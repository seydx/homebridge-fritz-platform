'use strict';

const moment = require('moment');
const ping = require('ping');
const logger = require('../../utils/logger');
const { validIP } = require('../../utils/utils');
const Telegram = require('../../lib/telegram');

class Handler {
  constructor() {
    this.hosts = [];
    this.configured = false;
  }

  configure(api, accessories, polling, meshMaster) {
    if (this.configured) {
      return this;
    }

    this.api = api;
    this.accessories = accessories;
    this.polling = polling;
    this.fritzbox = meshMaster.fritzbox;

    this.configured = true;

    setTimeout(() => this.poll(), 1000);

    return this;
  }

  // eslint-disable-next-line no-unused-vars
  async change(context, accessory, subtype, historyService) {
    if (context.oldValue !== context.newValue) {
      if (!this.configured) {
        logger.debug(
          'Handler not configured yet. Skipping CHANGE event.',
          `${accessory.displayName} (${accessory.context.config.subtype})`
        );
        return;
      }

      subtype = subtype || accessory.context.config.subtype;

      if (historyService) {
        const lastActivation = moment().unix() - historyService.getInitialTime();

        accessory
          .getService(this.api.hap.Service.MotionSensor)
          .getCharacteristic(this.api.hap.Characteristic.LastActivation)
          .updateValue(lastActivation);

        historyService.addEntry({ time: moment().unix(), status: context.newValue ? 1 : 0 });
      }

      if (!accessory.context.config.blockTelegram) {
        let dest = false;

        if (context.newValue) {
          dest = accessory.displayName === 'Anyone' ? 'anyone_in' : 'user_in';
        } else {
          dest = accessory.displayName === 'Anyone' ? 'anyone_out' : 'user_out';
        }

        Telegram.send('presence', dest, accessory.displayName === 'Anyone' ? false : accessory.displayName);
      }
    }
  }

  // eslint-disable-next-line no-unused-vars
  async get(accessory, subtype, ownCharacteristic) {
    if (!this.configured) {
      logger.debug(
        'Handler not configured yet. Skipping GET event.',
        `${accessory.displayName} (${accessory.context.config.subtype})`
      );
      return accessory.context.config.subtype === 'motion' ? false : 0;
    }

    // eslint-disable-next-line no-unused-vars
    subtype = subtype || accessory.context.config.subtype;

    const service =
      accessory.context.config.subtype === 'motion'
        ? this.api.hap.Service.MotionSensor
        : this.api.hap.Service.OccupancySensor;

    const characteristic =
      accessory.context.config.subtype === 'motion'
        ? this.api.hap.Characteristic.MotionDetected
        : this.api.hap.Characteristic.OccupancyDetected;

    let state = accessory.getService(service).getCharacteristic(characteristic).value;

    if (accessory.displayName === 'Anyone') {
      const states = this.accessories
        .filter((accessory) => accessory.context.config.type === 'presence' && accessory.displayName !== 'Anyone')
        .map((accessory) => {
          const service2 =
            accessory.context.config.subtype === 'motion'
              ? this.api.hap.Service.MotionSensor
              : this.api.hap.Service.OccupancySensor;

          const characteristic2 =
            accessory.context.config.subtype === 'motion'
              ? this.api.hap.Characteristic.MotionDetected
              : this.api.hap.Characteristic.OccupancyDetected;

          const state = accessory.getService(service2).getCharacteristic(characteristic2).value
            ? 'detected'
            : 'not detected';

          return state;
        });

      state = states.includes('detected');
    } else {
      let oldState = accessory.getService(service).getCharacteristic(characteristic).value;
      let newState = oldState;

      const host = this.hosts.find(
        (host) => host.ip === accessory.context.config.address || host.mac === accessory.context.config.address
      );

      if (host) {
        logger.debug(host, `${accessory.displayName} (${subtype})`);

        newState = host.active;
        const address = host.ip;
        const onDelay = accessory.context.config.onDelay;
        const offDelay = accessory.context.config.offDelay;
        const threshold = accessory.context.config.threshold;

        if (newState == state && accessory.context.config.ping) {
          const res = await ping.promise.probe(address);

          if (res.alive != newState) {
            logger.debug('Ping and FritzBox states are not equal.', `${accessory.displayName} (${subtype})`);

            if (res.alive) {
              accessory.context.lastSeen = Date.now();
              newState = res.alive;

              logger.debug('Taking the value of Ping. (DETECTED)', `${accessory.displayName} (${subtype})`);
            } else {
              if (accessory.context.lastSeen) {
                let lastSeenMoment = moment(accessory.context.lastSeen);
                let activeThreshold = moment().subtract(threshold, 'm');

                if (lastSeenMoment.isAfter(activeThreshold)) {
                  newState = true;
                  accessory.context.lastSeen = false;

                  logger.debug(
                    'Taking the value of Ping. (DETECTED - THRESHOLD REACHED)',
                    `${accessory.displayName} (${subtype})`
                  );
                } else {
                  newState = false;

                  logger.debug(
                    'Taking the value of Ping. (NOT DETECTED - THRESHOLD NOT REACHED)',
                    `${accessory.displayName} (${subtype})`
                  );
                }
              }
            }
          }
        }

        if (newState != state) {
          if (accessory.context.changedOn) {
            let millis = Date.now() - accessory.context.changedOn;
            let secElapsed = Math.floor(millis / 1000);

            let passed = false;

            if (newState && secElapsed > onDelay) {
              passed = true;
            } else if (!newState && secElapsed > offDelay) {
              passed = true;
            }

            if (passed) {
              state = newState;
              accessory.context.changedOn = false;
            }
          } else {
            accessory.context.changedOn = Date.now();

            logger.info(
              `Occupancy state switched back to ${newState ? 'DETECTED' : 'NOT DETECTED'}`,
              `${accessory.displayName} (${subtype})`
            );

            logger.info(
              `Wait ${newState ? onDelay : offDelay}s before switching state!`,
              `${accessory.displayName} (${subtype})`
            );
          }
        } else {
          if (accessory.context.changedOn) {
            accessory.context.changedOn = false;

            logger.info(
              `Occupancy state switched back to ${newState ? 'DETECTED' : 'NOT DETECTED'}`,
              `${accessory.displayName} (${subtype})`
            );
          }
        }
      }
    }

    if (state) {
      state = accessory.context.config.subtype === 'motion' ? true : 1;
    } else {
      state = accessory.context.config.subtype === 'motion' ? false : 0;
    }

    accessory.getService(service).getCharacteristic(characteristic).updateValue(state);

    return state;
  }

  // eslint-disable-next-line no-unused-vars
  async set(state, accessory, subtype, ownCharacteristic) {}

  async poll() {
    try {
      this.hosts = await this.fritzbox.getAllHostsV2();
      //logger.debug(this.hosts, 'Hosts');

      if (this.hosts.length) {
        const userAccessories = this.accessories.filter(
          (accessory) => accessory.context.config.type === 'presence' && accessory.displayName !== 'Anyone'
        );

        for (const accessory of userAccessories) {
          const host = this.hosts.find(
            (host) =>
              host.ip === accessory.context.config.address ||
              host.mac.toLowerCase() === accessory.context.config.address.toLowerCase()
          );

          if (!host) {
            logger.debug(
              'User could not be found in hosts list. Looking for user manually.',
              `${accessory.displayName} (${accessory.context.config.subtype})`
            );

            try {
              const service = validIP(accessory.context.config.address)
                ? 'X_AVM-DE_GetSpecificHostEntryByIP'
                : 'GetSpecificHostEntry';

              const input = validIP(accessory.context.config.address)
                ? { NewIPAddress: accessory.context.config.address }
                : { NewMACAddress: accessory.context.config.address };

              const user = await this.fritzbox.exec('urn:LanDeviceHosts-com:serviceId:Hosts1', service, input);

              this.hosts.push({
                mac: user.NewMACAddress,
                ip: user.NewIPAddress,
                active: user.NewActive === '1',
                name: user.NewHostName,
                interface: user.NewInterfaceType,
              });
            } catch (err) {
              if (err.soap && err.soap.errorDescription === 'NoSuchEntryInArray') {
                logger.debug(
                  'User could not be found manually. Setting user to inactive.',
                  `${accessory.displayName} (${accessory.context.config.subtype})`
                );

                this.hosts.push({
                  mac: accessory.context.config.address,
                  ip: accessory.context.config.address,
                  active: false,
                  name: accessory.displayName,
                  interface: '802.11',
                });
              } else {
                throw new Error(err);
              }
            }
          }

          await this.get(accessory);
        }

        const anyoneAccessory = this.accessories.find(
          (accessory) => accessory.context.config.type === 'presence' && accessory.displayName === 'Anyone'
        );

        if (anyoneAccessory) {
          await this.get(anyoneAccessory);
        }
      }
    } catch (err) {
      logger.warn('An error occurred during polling hosts!');
      logger.error(err);
    } finally {
      setTimeout(() => this.poll(), this.polling.timer * 1000);
    }
  }
}

const handler = new Handler();
module.exports = handler;
