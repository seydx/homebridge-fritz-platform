'use strict';

const moment = require('moment');
const logger = require('../../utils/logger');

class Handler {
  constructor() {
    this.smarthomeList = {
      devices: [],
      groups: [],
    };
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
  async change(context, accessory, subtype, historyService) {}

  // eslint-disable-next-line no-unused-vars
  async get(accessory, subtype, ownCharacteristic) {
    if (!this.configured) {
      logger.debug(
        'Handler not configured yet. Skipping GET event.',
        `${accessory.displayName} (${accessory.context.config.subtype})`
      );
      return;
    }

    subtype = subtype || accessory.context.config.subtype;
    const buttons = accessory.context.config.buttons;

    switch (buttons) {
      case 1:
        try {
          let device = this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain));
          logger.debug(device, `${accessory.displayName} (${subtype})`);

          if (device) {
            accessory.context.config.ain = device.ain;

            if (device.online) {
              if (device.button) {
                if (device.button.short) {
                  if (accessory.context.lastpressedShort) {
                    const oldTimestamp = accessory.context.lastpressedShort;
                    const newTimestamp = parseInt(device.button.short.lastpressedtimestamp) * 1000;

                    if (moment(newTimestamp).isAfter(oldTimestamp)) {
                      logger.info('Clicked (short)', `${accessory.displayName} (${subtype})`);
                      accessory.context.lastpressedShort = newTimestamp;

                      accessory
                        .getService(this.api.hap.Service.StatelessProgrammableSwitch)
                        .getCharacteristic(this.api.hap.Characteristic.ProgrammableSwitchEvent)
                        .updateValue(0);
                    }
                  } else {
                    accessory.context.lastpressedShort = parseInt(device.button.short.lastpressedtimestamp) * 1000;
                  }
                }

                if (device.button.long) {
                  if (accessory.context.lastpressedLong) {
                    const oldTimestamp = accessory.context.lastpressedLong;
                    const newTimestamp = parseInt(device.button.long.lastpressedtimestamp) * 1000;

                    if (moment(newTimestamp).isAfter(oldTimestamp)) {
                      logger.info('Clicked (long)', `${accessory.displayName} (${subtype})`);
                      accessory.context.lastpressedLong = newTimestamp;

                      accessory
                        .getService(this.api.hap.Service.StatelessProgrammableSwitch)
                        .getCharacteristic(this.api.hap.Characteristic.ProgrammableSwitchEvent)
                        .updateValue(2);
                    }
                  } else {
                    accessory.context.lastpressedLong = parseInt(device.button.long.lastpressedtimestamp) * 1000;
                  }
                }
              } else {
                logger.warn(
                  'Can not find button data - "accType" and/or options correct?',
                  `${accessory.displayName} (${subtype})`
                );
              }

              if (accessory.context.config.battery) {
                if (device.battery) {
                  let batteryLevel = device.battery.value || 0;
                  let lowBattery = device.battery.low || 0;

                  accessory
                    .getService(this.api.hap.Service.BatteryService)
                    .getCharacteristic(this.api.hap.Characteristic.BatteryLevel)
                    .updateValue(batteryLevel);

                  accessory
                    .getService(this.api.hap.Service.BatteryService)
                    .getCharacteristic(this.api.hap.Characteristic.StatusLowBattery)
                    .updateValue(lowBattery);
                } else {
                  logger.warn(
                    'Can not find battery data - "accType" and/or options correct?',
                    `${accessory.displayName} (${subtype})`
                  );
                }
              }
            } else {
              logger.warn('Device offline!', `${accessory.displayName} (${subtype})`);
            }
          } else {
            logger.warn(
              `Can not find device with AIN: ${accessory.context.config.ain}`,
              `${accessory.displayName} (${subtype})`
            );
          }
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }
        break;
      case 4:
        try {
          let device = this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain));
          logger.debug(device, `${accessory.displayName} (${subtype})`);

          if (device) {
            accessory.context.config.ain = device.ain;

            if (device.online) {
              if (device.button) {
                if (device.button.top_left) {
                  if (accessory.context.lastpressedTopLeft) {
                    const oldTimestamp = accessory.context.lastpressedTopLeft;
                    const newTimestamp = parseInt(device.button.top_left.lastpressedtimestamp) * 1000;

                    if (moment(newTimestamp).isAfter(oldTimestamp)) {
                      logger.info('Clicked (top left)', `${accessory.displayName} (${subtype})`);
                      accessory.context.lastpressedTopLeft = newTimestamp;

                      accessory
                        .getServiceById(`${accessory.context.config.subtype}-${1}`)
                        .getCharacteristic(this.api.hap.Characteristic.ProgrammableSwitchEvent)
                        .updateValue(0);
                    }
                  } else {
                    accessory.context.lastpressedTopLeft = parseInt(device.button.top_left.lastpressedtimestamp) * 1000;
                  }
                }

                if (device.button.top_right) {
                  if (accessory.context.lastpressedTopRight) {
                    const oldTimestamp = accessory.context.lastpressedTopRight;
                    const newTimestamp = parseInt(device.button.top_right.lastpressedtimestamp) * 1000;

                    if (moment(newTimestamp).isAfter(oldTimestamp)) {
                      logger.info('Clicked (top right)', `${accessory.displayName} (${subtype})`);
                      accessory.context.lastpressedTopRight = newTimestamp;

                      accessory
                        .getServiceById(`${accessory.context.config.subtype}-${2}`)
                        .getCharacteristic(this.api.hap.Characteristic.ProgrammableSwitchEvent)
                        .updateValue(0);
                    }
                  } else {
                    accessory.context.lastpressedTopRight =
                      parseInt(device.button.top_right.lastpressedtimestamp) * 1000;
                  }
                }

                if (device.button.bottom_left) {
                  if (accessory.context.lastpressedBottomLeft) {
                    const oldTimestamp = accessory.context.lastpressedBottomLeft;
                    const newTimestamp = parseInt(device.button.bottom_left.lastpressedtimestamp) * 1000;

                    if (moment(newTimestamp).isAfter(oldTimestamp)) {
                      logger.info('Clicked (bottom left)', `${accessory.displayName} (${subtype})`);
                      accessory.context.lastpressedBottomLeft = newTimestamp;

                      accessory
                        .getServiceById(`${accessory.context.config.subtype}-${3}`)
                        .getCharacteristic(this.api.hap.Characteristic.ProgrammableSwitchEvent)
                        .updateValue(0);
                    }
                  } else {
                    accessory.context.lastpressedBottomLeft =
                      parseInt(device.button.bottom_left.lastpressedtimestamp) * 1000;
                  }
                }

                if (device.button.bottom_right) {
                  if (accessory.context.lastpressedBottomRight) {
                    const oldTimestamp = accessory.context.lastpressedBottomRight;
                    const newTimestamp = parseInt(device.button.bottom_right.lastpressedtimestamp) * 1000;

                    if (moment(newTimestamp).isAfter(oldTimestamp)) {
                      logger.info('Clicked (bottom right)', `${accessory.displayName} (${subtype})`);
                      accessory.context.lastpressedBottomRight = newTimestamp;

                      accessory
                        .getServiceById(`${accessory.context.config.subtype}-${4}`)
                        .getCharacteristic(this.api.hap.Characteristic.ProgrammableSwitchEvent)
                        .updateValue(0);
                    }
                  } else {
                    accessory.context.lastpressedBottomRight =
                      parseInt(device.button.bottom_right.lastpressedtimestamp) * 1000;
                  }
                }
              } else {
                logger.warn(
                  'Can not find button data - "accType" and/or options correct?',
                  `${accessory.displayName} (${subtype})`
                );
              }

              if (accessory.context.config.battery) {
                if (device.battery) {
                  let batteryLevel = device.battery.value || 0;
                  let lowBattery = device.battery.low || 0;

                  accessory
                    .getService(this.api.hap.Service.BatteryService)
                    .getCharacteristic(this.api.hap.Characteristic.BatteryLevel)
                    .updateValue(batteryLevel);

                  accessory
                    .getService(this.api.hap.Service.BatteryService)
                    .getCharacteristic(this.api.hap.Characteristic.StatusLowBattery)
                    .updateValue(lowBattery);
                } else {
                  logger.warn(
                    'Can not find battery data - "accType" and/or options correct?',
                    `${accessory.displayName} (${subtype})`
                  );
                }
              }
            } else {
              logger.warn('Device offline!', `${accessory.displayName} (${subtype})`);
            }
          } else {
            logger.warn(
              `Can not find device with AIN: ${accessory.context.config.ain}`,
              `${accessory.displayName} (${subtype})`
            );
          }
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }
        break;
      default:
        logger.warn(
          `Can not handle GET event. Not supported buttons (${buttons})`,
          `${accessory.displayName} (${subtype})`
        );
        break;
    }
  }

  // eslint-disable-next-line no-unused-vars
  async set(state, accessory, subtype, ownCharacteristic, target) {}

  async poll() {
    try {
      this.smarthomeList = await this.fritzbox.getSmarthomeDevices();
      //logger.debug(this.smarthomeList, 'Smarthome');

      const accessories = this.accessories.filter(
        (accessory) => accessory.context.config.subtype === 'smarthome-button'
      );

      for (const accessory of accessories) {
        await this.get(accessory);
      }
    } catch (err) {
      logger.warn('An error occurred during polling smarthome devices!');
      logger.error(err);
    } finally {
      setTimeout(() => this.poll(), this.polling.timerSmarthomeButtons * 1000);
    }
  }
}

const handler = new Handler();
module.exports = handler;
