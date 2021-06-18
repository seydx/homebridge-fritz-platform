'use strict';

const { validIP } = require('../../utils/utils');
const logger = require('../../utils/logger');
const Telegram = require('../../lib/telegram');

class Handler {
  constructor(device, meshMaster) {
    this.device = device;
    this.fritzbox = meshMaster.fritzbox;

    this.poll();
  }

  // eslint-disable-next-line no-unused-vars
  configure(api, accessories, polling, meshMaster) {}

  // eslint-disable-next-line no-unused-vars
  async change(context, accessory, subtype, historyService) {}

  // eslint-disable-next-line no-unused-vars
  async get(accessory, subtype, ownCharacteristic) {}

  // eslint-disable-next-line no-unused-vars
  async set(state, accessory, subtype, ownCharacteristic) {}

  async poll() {
    try {
      let service = validIP(this.device.address) ? 'X_AVM-DE_GetSpecificHostEntryByIP' : 'GetSpecificHostEntry';
      let input = validIP(this.device.address)
        ? { NewIPAddress: this.device.address }
        : { NewMACAddress: this.device.address };

      const response = await this.fritzbox.exec('urn:LanDeviceHosts-com:serviceId:Hosts1', service, input);
      logger.debug(response, this.device.name);

      let newState = parseInt(response.NewActive);

      this.device.passed = false;

      if (this.device.state !== undefined) {
        if (this.device.onDelay || this.device.offDelay) {
          if (this.device.state !== newState) {
            if (this.device.changedOn) {
              let millis = Date.now() - this.device.changedOn;
              let secElapsed = Math.floor(millis / 1000);

              if (newState) {
                if (this.device.onDelay) {
                  if (secElapsed > this.device.onDelay) {
                    this.device.passed = true;
                  }
                } else {
                  //no onDelay in config
                  this.device.passed = true;
                }
              } else {
                if (this.device.offDelay) {
                  if (secElapsed > this.device.offDelay) {
                    this.device.passed = true;
                  }
                } else {
                  //no offDelay in config
                  this.device.passed = true;
                }
              }
            } else {
              if ((newState && this.device.onDelay) || (!newState && this.device.offDelay)) {
                this.device.changedOn = Date.now();
              }

              if (this.device.changedOn) {
                logger.info(`State changed to ${newState ? 'DETECTED' : 'NOT DETECTED'}`, this.device.name);
                this.device.informed = true;

                logger.info(
                  `Wait ${newState ? this.device.onDelay : this.device.offDelay}s before switching state!`,
                  this.device.name
                );
              } else {
                this.device.passed = true;
              }
            }
          } else {
            if (this.device.informed && this.device.changedOn) {
              this.device.informed = false;
              this.device.changedOn = false;

              logger.info(`State switched back to ${newState ? 'DETECTED' : 'NOT DETECTED'}`, this.device.name);
            }
          }
        } else {
          //no off/on delay in config
          if (this.device.state !== newState) {
            this.device.passed = true;
          }
        }
      } else {
        //first call
        this.device.state = newState;
      }

      if (this.device.passed) {
        this.device.state = newState;
        this.device.changedOn = false;

        if (newState) {
          Telegram.send('network', 'on', this.device.name);
        } else {
          Telegram.send('network', 'off', this.device.name);
        }
      }
    } catch (err) {
      logger.error('An error occured during polling network this.device!', this.device.name);
      logger.error(err);
    } finally {
      setTimeout(() => this.poll(), this.device.polling * 1000);
    }
  }
}

module.exports = Handler;
