'use strict';

const { requestAHA } = require('@seydx/fritzbox/lib/request');
const moment = require('moment');
const logger = require('../../utils/logger');
const { colortemp2api, getValidColor } = require('./smarthome.utils');
const Telegram = require('../../lib/telegram');

const timeout = (ms) => new Promise((res) => setTimeout(res, ms));

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

    this.poll();

    return this;
  }

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

      switch (subtype) {
        case 'smarthome-switch-lightbulb':
          if (historyService) {
            historyService.addEntry({ time: moment().unix(), power: context.newValue });

            if (accessory.context.config.startValue) {
              if (context.newValue >= accessory.context.config.startValue && !accessory.context.started) {
                logger.info('Started!', `${accessory.displayName} (${accessory.context.config.subtype})`);
                accessory.context.started = true;

                Telegram.send('outlet', 'started', accessory.displayName, context.newValue);
              } else if (context.newValue < accessory.context.config.startValue && accessory.context.started) {
                logger.info('Finished!', `${accessory.displayName} (${accessory.context.config.subtype})`);
                accessory.context.started = false;

                Telegram.send('outlet', 'finished', accessory.displayName, context.newValue);
              }
            }
          }
          break;
        case 'smarthome-lightbulb':
          break;
        case 'smarthome-switch':
          {
            if (historyService) {
              historyService.addEntry({ time: moment().unix(), power: context.newValue });

              if (accessory.context.config.startValue) {
                if (context.newValue >= accessory.context.config.startValue && !accessory.context.started) {
                  logger.info('Started!', `${accessory.displayName} (${accessory.context.config.subtype})`);
                  accessory.context.started = true;

                  Telegram.send('outlet', 'started', accessory.displayName, context.newValue);
                } else if (context.newValue < accessory.context.config.startValue && accessory.context.started) {
                  logger.info('Finished!', `${accessory.displayName} (${accessory.context.config.subtype})`);
                  accessory.context.started = false;

                  Telegram.send('outlet', 'finished', accessory.displayName, context.newValue);
                }
              }
            }
          }
          break;
        case 'smarthome-temperature': {
          historyService.addEntry({ time: moment().unix(), temp: context.newValue, humidity: 0, ppm: 0 });
          break;
        }
        case 'smarthome-contact': {
          if (context.newValue) {
            accessory.context.timesOpened = accessory.context.timesOpened || 0;
            accessory.context.timesOpened += 1;

            let lastActivation = moment().unix() - historyService.getInitialTime();
            let closeDuration = moment().unix() - historyService.getInitialTime();

            accessory
              .getService(this.api.hap.Service.ContactSensor)
              .getCharacteristic(this.api.hap.Characteristic.LastActivation)
              .updateValue(lastActivation);

            accessory
              .getService(this.api.hap.Service.ContactSensor)
              .getCharacteristic(this.api.hap.Characteristic.TimesOpened)
              .updateValue(accessory.context.timesOpened);

            accessory
              .getService(this.api.hap.Service.ContactSensor)
              .getCharacteristic(this.api.hap.Characteristic.ClosedDuration)
              .updateValue(closeDuration);
          } else {
            let openDuration = moment().unix() - historyService.getInitialTime();

            accessory
              .getService(this.api.hap.Service.ContactSensor)
              .getCharacteristic(this.api.hap.Characteristic.ClosedDuration)
              .updateValue(openDuration);
          }

          historyService.addEntry({ time: moment().unix(), status: context.newValue ? 1 : 0 });
          break;
        }
        case 'smarthome-window': {
          if (context.newValue) {
            accessory.context.timesOpened = accessory.context.timesOpened || 0;
            accessory.context.timesOpened += 1;

            let lastActivation = moment().unix() - historyService.getInitialTime();
            let closeDuration = moment().unix() - historyService.getInitialTime();

            accessory
              .getService(this.api.hap.Service.ContactSensor)
              .getCharacteristic(this.api.hap.Characteristic.LastActivation)
              .updateValue(lastActivation);

            accessory
              .getService(this.api.hap.Service.ContactSensor)
              .getCharacteristic(this.api.hap.Characteristic.TimesOpened)
              .updateValue(accessory.context.timesOpened);

            accessory
              .getService(this.api.hap.Service.ContactSensor)
              .getCharacteristic(this.api.hap.Characteristic.ClosedDuration)
              .updateValue(closeDuration);
          } else {
            let openDuration = moment().unix() - historyService.getInitialTime();

            accessory
              .getService(this.api.hap.Service.ContactSensor)
              .getCharacteristic(this.api.hap.Characteristic.ClosedDuration)
              .updateValue(openDuration);
          }

          historyService.addEntry({ time: moment().unix(), status: context.newValue ? 1 : 0 });
          break;
        }
        case 'smarthome-window-switch':
          break;
        case 'smarthome-thermostat': {
          let currentState = accessory
            .getService(this.api.hap.Service.HeaterCooler)
            .getCharacteristic(this.api.hap.Characteristic.CurrentHeaterCoolerState).value;

          let currentTemp = accessory
            .getService(this.api.hap.Service.HeaterCooler)
            .getCharacteristic(this.api.hap.Characteristic.CurrentTemperature).value;

          let targetTemp = accessory
            .getService(this.api.hap.Service.HeaterCooler)
            .getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature).value;

          let valvePos =
            currentTemp <= targetTemp && currentState !== 0
              ? Math.round(targetTemp - currentTemp >= 5 ? 100 : (targetTemp - currentTemp) * 20)
              : 0;

          historyService.addEntry({
            time: moment().unix(),
            currentTemp: currentTemp,
            setTemp: targetTemp,
            valvePosition: valvePos,
          });
          break;
        }
        case 'smarthome-blind':
          break;
        default:
          logger.warn(
            `Can not handle CHANGE event. Unknown accessory subtype (${subtype})`,
            `${accessory.displayName} (${subtype})`
          );
          break;
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
      return;
    }

    subtype = subtype || accessory.context.config.subtype;

    switch (subtype) {
      case 'smarthome-switch-lightbulb': {
        let service = accessory.context.config.energy
          ? accessory.getService(this.api.hap.Service.Outlet)
          : accessory.getService(this.api.hap.Service.Switch);

        let state = accessory.getService(service).getCharacteristic(this.api.hap.Characteristic.On).value;

        if (accessory.context.busy) {
          return state;
        }

        let bulbState = accessory
          .getService(this.api.hap.Service.Lightbulb)
          .getCharacteristic(this.api.hap.Characteristic.On).value;

        let brightness, temp, hue, sat, temperature;

        if (accessory.context.config.temperature) {
          temperature = accessory
            .getService(this.api.hap.Service.TemperatureSensor)
            .getCharacteristic(this.api.hap.Characteristic.CurrentTemperature).value;
        }

        if (accessory.context.config.brightness) {
          accessory.context.config.brightnessValue = accessory
            .getService(this.api.hap.Service.Lightbulb)
            .getCharacteristic(this.api.hap.Characteristic.Brightness).value;
        }

        if (accessory.context.config.color) {
          accessory.context.config.brightnessValue = accessory
            .getService(this.api.hap.Service.Lightbulb)
            .getCharacteristic(this.api.hap.Characteristic.Brightness).value;

          accessory.context.config.tempValue = accessory
            .getService(this.api.hap.Service.Lightbulb)
            .getCharacteristic(this.api.hap.Characteristic.ColorTemperature).value;
        }

        try {
          let device = this.smarthomeList.groups.find((device) => device.name.includes(accessory.displayName));
          logger.debug(device, `${accessory.displayName} (${subtype})`);

          if (device) {
            accessory.context.config.ain = device.ain;

            if (device.online) {
              if (device.switch) {
                state = device.switch.state ? true : false;

                if (accessory.context.config.energy) {
                  if (device.powermeter) {
                    let currentPower = device.powermeter.power || 0;
                    let totalPower = device.powermeter.energy || 0;
                    let voltage = device.powermeter.voltage || 0;
                    let ampere = Math.round((currentPower / voltage + Number.EPSILON) * 100) / 100;

                    accessory
                      .getService(this.api.hap.Service.Outlet)
                      .getCharacteristic(this.api.hap.Characteristic.OutletInUse)
                      .updateValue(currentPower > 0 ? true : false);

                    accessory
                      .getService(this.api.hap.Service.Outlet)
                      .getCharacteristic(this.api.hap.Characteristic.CurrentConsumption)
                      .updateValue(currentPower);

                    accessory
                      .getService(this.api.hap.Service.Outlet)
                      .getCharacteristic(this.api.hap.Characteristic.TotalConsumption)
                      .updateValue(totalPower);

                    accessory
                      .getService(this.api.hap.Service.Outlet)
                      .getCharacteristic(this.api.hap.Characteristic.Volts)
                      .updateValue(voltage);

                    accessory
                      .getService(this.api.hap.Service.Outlet)
                      .getCharacteristic(this.api.hap.Characteristic.Amperes)
                      .updateValue(ampere);
                  } else {
                    logger.warn(
                      'Can not find powermeter data - "accType" and/or options correct?',
                      `${accessory.displayName} (${subtype})`
                    );
                  }
                }
              }

              if (device.light) {
                bulbState = device.light.state || 0;

                if (accessory.context.config.brightness) {
                  if (device.light.brightness) {
                    brightness = !isNaN(device.light.brightness.levelpercentage)
                      ? device.light.brightness.levelpercentage
                      : null;
                  }
                } else {
                  logger.warn(
                    'Can not find brightness data - "accType" and/or options correct?',
                    `${accessory.displayName} (${subtype})`
                  );
                }

                if (accessory.context.config.color) {
                  if (device.light.color) {
                    temp = device.light.color.temperature ? Math.round(1000000 / device.light.color.temperature) : null;
                    hue = !isNaN(device.light.color.hue) ? device.light.color.hue : null;
                    sat = !isNaN(device.light.color.saturation) ? device.light.color.saturation / 2.55 : null;
                  }
                } else {
                  logger.warn(
                    'Can not find color data - "accType" and/or options correct?',
                    `${accessory.displayName} (${subtype})`
                  );
                }
              } else {
                logger.warn(
                  'Can not find light data - "accType" and/or options correct?',
                  `${accessory.displayName} (${subtype})`
                );
              }

              if (accessory.context.config.temperature) {
                if (device.temperature) {
                  temperature = device.temperature.value || 0;
                } else {
                  logger.warn(
                    'Can not find temperature data - "accType" and/or options correct?',
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

        service.getCharacteristic(this.api.hap.Characteristic.On).updateValue(state);

        accessory
          .getService(this.api.hap.Service.Lightbulb)
          .getCharacteristic(this.api.hap.Characteristic.On)
          .updateValue(bulbState);

        if (accessory.context.config.temperature) {
          accessory
            .getService(this.api.hap.Service.TemperatureSensor)
            .getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
            .updateValue(temperature);
        }

        if (
          accessory.context.config.brightness &&
          brightness !== null &&
          brightness !== undefined &&
          brightness !== accessory.context.config.brightnessValue
        ) {
          accessory
            .getService(this.api.hap.Service.Lightbulb)
            .getCharacteristic(this.api.hap.Characteristic.Brightness)
            .updateValue(brightness);
        }

        if (accessory.context.config.color) {
          if (temp !== null && temp !== undefined) {
            let changed = Math.abs(accessory.context.config.tempValue - temp) > 5;

            if (changed) {
              //Logger.debug('Color temperature changed from outside. Disabling AdaptiveLighting.', `${accessory.displayName} (${subtype})`);

              accessory.adaptiveLightingController.disableAdaptiveLighting(true);

              let colorTemperatureMired = temp;
              let color = this.api.hap.ColorUtils.colorTemperatureToHueAndSaturation(colorTemperatureMired);

              accessory
                .getService(this.api.hap.Service.Lightbulb)
                .getCharacteristic(this.api.hap.Characteristic.ColorTemperature)
                .updateValue(colorTemperatureMired);

              accessory
                .getService(this.api.hap.Service.Lightbulb)
                .getCharacteristic(this.api.hap.Characteristic.Hue)
                .updateValue(color.hue);

              accessory
                .getService(this.api.hap.Service.Lightbulb)
                .getCharacteristic(this.api.hap.Characteristic.Saturation)
                .updateValue(color.saturation);
            }
          }

          if (hue !== null && hue !== undefined && sat !== null && sat !== undefined) {
            //Logger.debug('Color changed from outside. Disabling AdaptiveLighting.', `${accessory.displayName} (${subtype})`);

            accessory.adaptiveLightingController.disableAdaptiveLighting(true);

            accessory
              .getService(this.api.hap.Service.Lightbulb)
              .getCharacteristic(this.api.hap.Characteristic.Hue)
              .updateValue(hue);

            accessory
              .getService(this.api.hap.Service.Lightbulb)
              .getCharacteristic(this.api.hap.Characteristic.Saturation)
              .updateValue(sat);
          }
        }

        return state;
      }
      case 'smarthome-lightbulb': {
        let state = accessory
          .getService(this.api.hap.Service.Lightbulb)
          .getCharacteristic(this.api.hap.Characteristic.On).value;

        if (accessory.context.busy) {
          return state;
        }

        let brightness, temp, hue, sat;

        if (accessory.context.config.brightness) {
          accessory.context.config.brightnessValue = accessory
            .getService(this.api.hap.Service.Lightbulb)
            .getCharacteristic(this.api.hap.Characteristic.Brightness).value;
        }

        if (accessory.context.config.color) {
          accessory.context.config.brightnessValue = accessory
            .getService(this.api.hap.Service.Lightbulb)
            .getCharacteristic(this.api.hap.Characteristic.Brightness).value;

          accessory.context.config.tempValue = accessory
            .getService(this.api.hap.Service.Lightbulb)
            .getCharacteristic(this.api.hap.Characteristic.ColorTemperature).value;
        }

        try {
          let device = !accessory.context.config.group
            ? this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain))
            : this.smarthomeList.groups.find((device) => device.name.includes(accessory.displayName));

          logger.debug(device, `${accessory.displayName} (${subtype})`);

          if (device) {
            accessory.context.config.ain = device.ain;

            if (device.online) {
              if (device.light) {
                state = device.light.state || false;

                if (accessory.context.config.brightness) {
                  if (device.light.brightness) {
                    brightness = !isNaN(device.light.brightness.levelpercentage)
                      ? device.light.brightness.levelpercentage
                      : null;
                  } else {
                    logger.warn(
                      'Can not find brightness data - "accType" and/or options correct?',
                      `${accessory.displayName} (${subtype})`
                    );
                  }
                }

                if (accessory.context.config.color) {
                  if (device.light.color) {
                    temp = device.light.color.temperature ? Math.round(1000000 / device.light.color.temperature) : null;
                    hue = !isNaN(device.light.color.hue) ? device.light.color.hue : null;
                    sat = !isNaN(device.light.color.saturation) ? device.light.color.saturation / 2.55 : null;
                  } else {
                    logger.warn(
                      'Can not find color data - "accType" and/or options correct?',
                      `${accessory.displayName} (${subtype})`
                    );
                  }
                }
              } else {
                logger.warn(
                  'Can not find light data - "accType" and/or options correct?',
                  `${accessory.displayName} (${subtype})`
                );
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

        accessory
          .getService(this.api.hap.Service.Lightbulb)
          .getCharacteristic(this.api.hap.Characteristic.On)
          .updateValue(state);

        if (
          accessory.context.config.brightness &&
          brightness !== null &&
          brightness !== undefined &&
          brightness !== accessory.context.config.brightnessValue
        ) {
          accessory
            .getService(this.api.hap.Service.Lightbulb)
            .getCharacteristic(this.api.hap.Characteristic.Brightness)
            .updateValue(brightness);
        }

        if (accessory.context.config.color) {
          if (temp !== null && temp !== undefined) {
            let changed = Math.abs(accessory.context.config.tempValue - temp) > 5;

            if (changed) {
              //Logger.debug('Color temperature changed from outside. Disabling AdaptiveLighting.', `${accessory.displayName} (${subtype})`);

              accessory.adaptiveLightingController.disableAdaptiveLighting(true);

              let colorTemperatureMired = temp;
              let color = this.api.hap.ColorUtils.colorTemperatureToHueAndSaturation(colorTemperatureMired);

              accessory
                .getService(this.api.hap.Service.Lightbulb)
                .getCharacteristic(this.api.hap.Characteristic.ColorTemperature)
                .updateValue(colorTemperatureMired);

              accessory
                .getService(this.api.hap.Service.Lightbulb)
                .getCharacteristic(this.api.hap.Characteristic.Hue)
                .updateValue(color.hue);

              accessory
                .getService(this.api.hap.Service.Lightbulb)
                .getCharacteristic(this.api.hap.Characteristic.Saturation)
                .updateValue(color.saturation);
            }
          }

          if (hue !== null && hue !== undefined && sat !== null && sat !== undefined) {
            //Logger.debug('Color changed from outside. Disabling AdaptiveLighting.', `${accessory.displayName} (${subtype})`);

            accessory.adaptiveLightingController.disableAdaptiveLighting(true);

            accessory
              .getService(this.api.hap.Service.Lightbulb)
              .getCharacteristic(this.api.hap.Characteristic.Hue)
              .updateValue(hue);
            accessory
              .getService(this.api.hap.Service.Lightbulb)
              .getCharacteristic(this.api.hap.Characteristic.Saturation)
              .updateValue(sat);
          }
        }

        return state;
      }
      case 'smarthome-switch': {
        let service = accessory.context.config.energy
          ? accessory.getService(this.api.hap.Service.Outlet)
          : accessory.getService(this.api.hap.Service.Switch);

        let state = service.getCharacteristic(this.api.hap.Characteristic.On).value;

        if (accessory.context.busy) {
          return state;
        }

        try {
          let device = !accessory.context.config.group
            ? this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain))
            : this.smarthomeList.groups.find((device) => device.name.includes(accessory.displayName));

          logger.debug(device, `${accessory.displayName} (${subtype})`);

          if (device) {
            accessory.context.config.ain = device.ain;

            if (device.online) {
              if (device.switch) {
                state = device.switch.state ? true : false;

                if (accessory.context.config.energy) {
                  if (device.powermeter) {
                    let currentPower = device.powermeter.power || 0;
                    let totalPower = device.powermeter.energy || 0;
                    let voltage = device.powermeter.voltage || 0;
                    let ampere = Math.round((currentPower / voltage + Number.EPSILON) * 100) / 100;

                    accessory
                      .getService(this.api.hap.Service.Outlet)
                      .getCharacteristic(this.api.hap.Characteristic.OutletInUse)
                      .updateValue(currentPower > 0 ? true : false);

                    accessory
                      .getService(this.api.hap.Service.Outlet)
                      .getCharacteristic(this.api.hap.Characteristic.CurrentConsumption)
                      .updateValue(currentPower);

                    accessory
                      .getService(this.api.hap.Service.Outlet)
                      .getCharacteristic(this.api.hap.Characteristic.TotalConsumption)
                      .updateValue(totalPower);

                    accessory
                      .getService(this.api.hap.Service.Outlet)
                      .getCharacteristic(this.api.hap.Characteristic.Volts)
                      .updateValue(voltage);

                    accessory
                      .getService(this.api.hap.Service.Outlet)
                      .getCharacteristic(this.api.hap.Characteristic.Amperes)
                      .updateValue(ampere);
                  } else {
                    logger.warn(
                      'Can not find powermeter data - "accType" and/or options correct?',
                      `${accessory.displayName} (${subtype})`
                    );
                  }
                }
              } else {
                logger.warn(
                  'Can not find switch data - "accType" and/or options correct?',
                  `${accessory.displayName} (${subtype})`
                );
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

        service.getCharacteristic(this.api.hap.Characteristic.On).updateValue(state);

        return state;
      }
      case 'smarthome-temperature': {
        let state = accessory
          .getService(this.api.hap.Service.TemperatureSensor)
          .getCharacteristic(this.api.hap.Characteristic.CurrentTemperature).value;

        try {
          let device = this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain));
          logger.debug(device, `${accessory.displayName} (${subtype})`);

          if (device) {
            accessory.context.config.ain = device.ain;

            if (device.online) {
              if (device.temperature) {
                state = device.temperature.value;
              } else {
                logger.warn(
                  'Can not find temperature data - "accType" and/or options correct?',
                  `${accessory.displayName} (${subtype})`
                );
              }

              if (accessory.context.config.humidity) {
                if (device.humidity) {
                  let humidity = device.humidity.value || 0;

                  accessory
                    .getService(this.api.hap.Service.HumiditySensor)
                    .getCharacteristic(this.api.hap.Characteristic.CurrentRelativeHumidity)
                    .updateValue(humidity);
                } else {
                  logger.warn(
                    'Can not find humidity data - "accType" and/or options correct?',
                    `${accessory.displayName} (${subtype})`
                  );
                }
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

        accessory
          .getService(this.api.hap.Service.TemperatureSensor)
          .getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
          .updateValue(state);

        return state;
      }
      case 'smarthome-contact': {
        let state = accessory
          .getService(this.api.hap.Service.ContactSensor)
          .getCharacteristic(this.api.hap.Characteristic.ContactSensorState).value;

        try {
          let device = this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain));
          logger.debug(device, `${accessory.displayName} (${subtype})`);

          if (device) {
            accessory.context.config.ain = device.ain;

            if (device.online) {
              if (device.alert) {
                state = device.alert.state || 0;
              } else {
                logger.warn(
                  'Can not find alert data - "accType" and/or options correct?',
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

        accessory
          .getService(this.api.hap.Service.ContactSensor)
          .getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
          .updateValue(state);

        return state;
      }
      case 'smarthome-window': {
        let state = accessory
          .getService(this.api.hap.Service.ContactSensor)
          .getCharacteristic(this.api.hap.Characteristic.ContactSensorState).value;

        try {
          let device = this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain));
          logger.debug(device, `${accessory.displayName} (${subtype})`);

          if (device) {
            accessory.context.config.ain = device.ain;

            if (device.online) {
              if (device.thermostat) {
                state = device.thermostat.windowOpen || 0;
              } else {
                logger.warn(
                  'Can not find thermostat data - "accType" and/or options correct?',
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

        accessory
          .getService(this.api.hap.Service.ContactSensor)
          .getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
          .updateValue(state);

        return state;
      }
      case 'smarthome-window-switch': {
        let state = accessory
          .getService(this.api.hap.Service.Switch)
          .getCharacteristic(this.api.hap.Characteristic.On).value;

        try {
          let device = this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain));
          logger.debug(device, `${accessory.displayName} (${subtype})`);

          if (device) {
            accessory.context.config.ain = device.ain;

            if (device.online) {
              if (device.thermostat) {
                state = device.thermostat.windowOpen ? true : false;
              } else {
                logger.warn(
                  'Can not find thermostat data - "accType" and/or options correct?',
                  `${accessory.displayName} (${subtype})`
                );
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

        accessory
          .getService(this.api.hap.Service.Switch)
          .getCharacteristic(this.api.hap.Characteristic.On)
          .updateValue(state);

        return state;
      }
      case 'smarthome-thermostat': {
        let active = accessory
          .getService(this.api.hap.Service.HeaterCooler)
          .getCharacteristic(this.api.hap.Characteristic.Active).value;

        let currentState = accessory
          .getService(this.api.hap.Service.HeaterCooler)
          .getCharacteristic(this.api.hap.Characteristic.CurrentHeaterCoolerState).value;

        let currentTemp = accessory
          .getService(this.api.hap.Service.HeaterCooler)
          .getCharacteristic(this.api.hap.Characteristic.CurrentTemperature).value;

        let targetTemp = accessory
          .getService(this.api.hap.Service.HeaterCooler)
          .getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature).value;

        if (accessory.context.busy) {
          //assuming we are calling GET event for Characteristic.Active
          return active;
        }

        try {
          let device = !accessory.context.config.group
            ? this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain))
            : this.smarthomeList.groups.find((device) => device.name.includes(accessory.displayName));

          logger.debug(device, `${accessory.displayName} (${subtype})`);

          if (device) {
            accessory.context.config.ain = device.ain;

            if (device.online) {
              if (device.thermostat) {
                currentTemp = device.thermostat.current;
                targetTemp = device.thermostat.target;

                /*currentTemp = (device.thermostat.current === 'on' || device.thermostat.current === 'off')
                ? currentTemp
                : device.thermostat.current;
              
              targetTemp = (device.thermostat.target === 'on' || device.thermostat.target === 'off')
                ? targetTemp
                : device.thermostat.target;*/

                if (device.temperature) {
                  currentTemp = device.temperature.value || currentTemp;
                }

                if (targetTemp === 'off') {
                  active = this.api.hap.Characteristic.Active.INACTIVE;
                  currentState = this.api.hap.Characteristic.CurrentHeaterCoolerState.INACTIVE;
                } else {
                  active = this.api.hap.Characteristic.Active.ACTIVE;

                  if (currentTemp && targetTemp) {
                    if (targetTemp !== 'on' && currentTemp !== 'on' && currentTemp !== 'off') {
                      if (currentTemp < targetTemp) {
                        currentState = this.api.hap.Characteristic.CurrentHeaterCoolerState.HEATING;

                        let valvePos = Math.round(
                          targetTemp - currentTemp >= 5 ? 100 : (targetTemp - currentTemp) * 20
                        );

                        accessory
                          .getService(this.api.hap.Service.HeaterCooler)
                          .getCharacteristic(this.api.hap.Characteristic.ValvePosition)
                          .updateValue(valvePos);
                      } else {
                        currentState = this.api.hap.Characteristic.CurrentHeaterCoolerState.COOLING;
                      }

                      accessory
                        .getService(this.api.hap.Service.HeaterCooler)
                        .getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature)
                        .updateValue(targetTemp);

                      accessory
                        .getService(this.api.hap.Service.HeaterCooler)
                        .getCharacteristic(this.api.hap.Characteristic.CoolingThresholdTemperature)
                        .updateValue(targetTemp);
                    }
                  }
                }

                if (!isNaN(currentTemp))
                  accessory
                    .getService(this.api.hap.Service.HeaterCooler)
                    .getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
                    .updateValue(currentTemp);

                accessory
                  .getService(this.api.hap.Service.HeaterCooler)
                  .getCharacteristic(this.api.hap.Characteristic.Active)
                  .updateValue(active);

                accessory
                  .getService(this.api.hap.Service.HeaterCooler)
                  .getCharacteristic(this.api.hap.Characteristic.CurrentHeaterCoolerState)
                  .updateValue(currentState);
              } else {
                logger.warn(
                  'Can not find thermostat data - "accType" and/or options correct?',
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

        return active;
      }
      case 'smarthome-blind': {
        let state = accessory
          .getService(this.api.hap.Service.WindowCovering)
          .getCharacteristic(this.api.hap.Characteristic.CurrentPosition).value;

        /*let targetPosition = accessory
          .getService(this.api.hap.Service.WindowCovering)
          .getCharacteristic(this.api.hap.Characteristic.TargetPosition).value;*/

        let validCurrentPosition = state;

        try {
          let device = this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain));
          logger.debug(device, `${accessory.displayName} (${subtype})`);

          if (device) {
            accessory.context.config.ain = device.ain;

            if (device.online) {
              if (device.blind.position) {
                validCurrentPosition = 100 - device.blind.position.levelpercentage || 0;
              } else {
                logger.warn(
                  'Can not find position data - "accType" and/or options correct?',
                  `${accessory.displayName} (${subtype})`
                );
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

        accessory
          .getService(this.api.hap.Service.WindowCovering)
          .getCharacteristic(this.api.hap.Characteristic.TargetPosition)
          .updateValue(validCurrentPosition);

        accessory
          .getService(this.api.hap.Service.WindowCovering)
          .getCharacteristic(this.api.hap.Characteristic.CurrentPosition)
          .updateValue(validCurrentPosition);

        return state;
      }
      default:
        logger.warn(
          `Can not handle GET event. Unknown accessory subtype (${subtype})`,
          `${accessory.displayName} (${subtype})`
        );
        break;
    }
  }

  // eslint-disable-next-line no-unused-vars
  async set(state, accessory, subtype, ownCharacteristic, target) {
    if (!this.configured) {
      logger.debug(
        'Handler not configured yet. Skipping SET event.',
        `${accessory.displayName} (${accessory.context.config.subtype})`
      );
      return;
    }

    subtype = subtype || accessory.context.config.subtype;

    accessory.context.busy = true;

    switch (subtype) {
      case 'smarthome-switch-lightbulb':
        {
          let bulbState = accessory
            .getService(this.api.hap.Service.Lightbulb)
            .getCharacteristic(this.api.hap.Characteristic.On).value;

          try {
            const response = await this.fritzbox.exec(
              'urn:DeviceConfig-com:serviceId:DeviceConfig1',
              'X_AVM-DE_CreateUrlSID'
            );
            const sid = response['NewX_AVM-DE_UrlSID'].split('sid=')[1];

            if (accessory.context.config.group) {
              let device = this.smarthomeList.groups.find((device) => device.name.includes(accessory.displayName));

              if (device) {
                accessory.context.config.ain = device.ain;
              }
            }

            let device = this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain));

            if (device) {
              accessory.context.config.ain = device.ain;
            }

            let cmd = {
              ain: accessory.context.config.ain,
              sid: sid,
            };

            if (accessory.context.config.ain) {
              if (target === 'on') {
                logger.info(`${state ? 'ON' : 'OFF'}`, `${accessory.displayName} (${subtype})`);

                cmd = {
                  ...cmd,
                  switchcmd: state ? 'setswitchon' : 'setswitchoff',
                };

                logger.debug(`Send CMD: ${JSON.stringify(cmd)}`, `${accessory.displayName} (${subtype})`);
                await requestAHA(this.fritzbox.url.hostname, cmd);
              } else if (target === 'brightness') {
                logger.info(`Brightness ${state}`, `${accessory.displayName} (${subtype})`);

                cmd = {
                  ...cmd,
                  switchcmd: 'setlevelpercentage',
                  level: state,
                };

                logger.debug(`Send CMD: ${JSON.stringify(cmd)}`, `${accessory.displayName} (${subtype})`);
                await requestAHA(this.fritzbox.url.hostname, cmd);
              } else if (target === 'temperature') {
                logger.info(`${state ? 'ON' : 'OFF'}`, `${accessory.displayName} (${subtype})`);

                let colorTemperatureMired = state;
                let colorTemperatureKelvin = Math.round(1000000 / colorTemperatureMired);
                let validColorTemperatureKelvin = colortemp2api(colorTemperatureKelvin);
                let validColorTemperatureMired = Math.round(1000000 / validColorTemperatureKelvin);
                let color = this.api.hap.ColorUtils.colorTemperatureToHueAndSaturation(validColorTemperatureMired);
                let hue = color.hue;
                let saturation = color.saturation;

                logger.info(
                  `Color Temperature ${validColorTemperatureKelvin} Kelvin`,
                  `${accessory.displayName} (${subtype})`
                );

                cmd = {
                  ...cmd,
                  switchcmd: 'setcolortemperature',
                  temperature: validColorTemperatureKelvin,
                  duration: 100,
                };

                if (bulbState) {
                  logger.debug(`Send CMD: ${JSON.stringify(cmd)}`, `${accessory.displayName} (${subtype})`);
                  await requestAHA(this.fritzbox.url.hostname, cmd);

                  accessory
                    .getService(this.api.hap.Service.Lightbulb)
                    .getCharacteristic(this.api.hap.Characteristic.Hue)
                    .updateValue(hue);

                  accessory
                    .getService(this.api.hap.Service.Lightbulb)
                    .getCharacteristic(this.api.hap.Characteristic.Saturation)
                    .updateValue(saturation);
                }
              } else {
                //color
                let validHueSat = getValidColor(accessory, false, state);
                logger.info(
                  `Hue ${validHueSat.hue} - Saturation ${validHueSat.sat}`,
                  `${accessory.displayName} (${subtype})`
                );

                cmd = {
                  ...cmd,
                  switchcmd: 'setcolor',
                  hue: validHueSat.hue,
                  saturation: validHueSat.sat,
                  duration: 100,
                };

                if (bulbState) {
                  logger.debug(`Send CMD: ${JSON.stringify(cmd)}`, `${accessory.displayName} (${subtype})`);
                  await requestAHA(this.fritzbox.url.hostname, cmd);
                }
              }
            } else {
              logger.warn('Can not switch state! No AIN found/defined!', `${accessory.displayName} (${subtype})`);
            }
          } catch (err) {
            logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
            logger.error(err);
          }
        }
        break;
      case 'smarthome-lightbulb':
        {
          let bulbState = accessory
            .getService(this.api.hap.Service.Lightbulb)
            .getCharacteristic(this.api.hap.Characteristic.On).value;

          try {
            const response = await this.fritzbox.exec(
              'urn:DeviceConfig-com:serviceId:DeviceConfig1',
              'X_AVM-DE_CreateUrlSID'
            );
            const sid = response['NewX_AVM-DE_UrlSID'].split('sid=')[1];

            if (accessory.context.config.group) {
              let device = this.smarthomeList.groups.find((device) => device.name.includes(accessory.displayName));

              if (device) {
                accessory.context.config.ain = device.ain;
              }
            }

            let device = this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain));

            if (device) {
              accessory.context.config.ain = device.ain;
            }

            let cmd = {
              ain: accessory.context.config.ain,
              sid: sid,
            };

            if (accessory.context.config.ain) {
              if (target === 'on') {
                logger.info(`${state ? 'ON' : 'OFF'}`, `${accessory.displayName} (${subtype})`);

                cmd = {
                  ...cmd,
                  switchcmd: 'setsimpleonoff',
                  onoff: state ? 1 : 0,
                };

                logger.debug(`Send CMD: ${JSON.stringify(cmd)}`, `${accessory.displayName} (${subtype})`);
                await requestAHA(this.fritzbox.url.hostname, cmd);
              } else if (target === 'brightness') {
                logger.info(`Brightness ${state}`, `${accessory.displayName} (${subtype})`);

                cmd = {
                  ...cmd,
                  switchcmd: 'setlevelpercentage',
                  level: state,
                };

                logger.debug(`Send CMD: ${JSON.stringify(cmd)}`, `${accessory.displayName} (${subtype})`);
                await requestAHA(this.fritzbox.url.hostname, cmd);
              } else if (target === 'temperature') {
                let colorTemperatureMired = state;
                let colorTemperatureKelvin = Math.round(1000000 / colorTemperatureMired);
                let validColorTemperatureKelvin = colortemp2api(colorTemperatureKelvin);
                let validColorTemperatureMired = Math.round(1000000 / validColorTemperatureKelvin);
                let color = this.api.hap.ColorUtils.colorTemperatureToHueAndSaturation(validColorTemperatureMired);
                let hue = color.hue;
                let saturation = color.saturation;

                logger.info(
                  `Color Temperature ${validColorTemperatureKelvin} Kelvin`,
                  `${accessory.displayName} (${subtype})`
                );

                cmd = {
                  ...cmd,
                  switchcmd: 'setcolortemperature',
                  temperature: validColorTemperatureKelvin,
                  duration: 100,
                };

                if (bulbState) {
                  logger.debug(`Send CMD: ${JSON.stringify(cmd)}`, `${accessory.displayName} (${subtype})`);
                  await requestAHA(this.fritzbox.url.hostname, cmd);

                  accessory
                    .getService(this.api.hap.Service.Lightbulb)
                    .getCharacteristic(this.api.hap.Characteristic.Hue)
                    .updateValue(hue);

                  accessory
                    .getService(this.api.hap.Service.Lightbulb)
                    .getCharacteristic(this.api.hap.Characteristic.Saturation)
                    .updateValue(saturation);
                }
              } else {
                //color
                let validHueSat = getValidColor(accessory, false, state);
                logger.info(
                  `Hue ${validHueSat.hue} - Saturation ${validHueSat.sat}`,
                  `${accessory.displayName} (${subtype})`
                );

                cmd = {
                  ...cmd,
                  switchcmd: 'setcolor',
                  hue: validHueSat.hue,
                  saturation: validHueSat.sat,
                  duration: 100,
                };

                if (bulbState) {
                  logger.debug(`Send CMD: ${JSON.stringify(cmd)}`, `${accessory.displayName} (${subtype})`);
                  await requestAHA(this.fritzbox.url.hostname, cmd);
                }
              }
            } else {
              logger.warn('Can not switch state! No AIN found/defined!', `${accessory.displayName} (${subtype})`);
            }
          } catch (err) {
            logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
            logger.error(err);
          }
        }
        break;
      case 'smarthome-switch':
        {
          try {
            logger.info(`${state ? 'ON' : 'OFF'}`, `${accessory.displayName} (${subtype})`);

            const response = await this.fritzbox.exec(
              'urn:DeviceConfig-com:serviceId:DeviceConfig1',
              'X_AVM-DE_CreateUrlSID'
            );
            const sid = response['NewX_AVM-DE_UrlSID'].split('sid=')[1];

            if (accessory.context.config.group) {
              let device = this.smarthomeList.groups.find((device) => device.name.includes(accessory.displayName));

              if (device) {
                accessory.context.config.ain = device.ain;
              }
            }

            let device = this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain));

            if (device) {
              accessory.context.config.ain = device.ain;
            }

            let cmd = {
              ain: accessory.context.config.ain,
              sid: sid,
              switchcmd: state ? 'setswitchon' : 'setswitchoff',
            };

            if (accessory.context.config.ain) {
              logger.debug(`Send CMD: ${JSON.stringify(cmd)}`, `${accessory.displayName} (${subtype})`);
              await requestAHA(this.fritzbox.url.hostname, cmd);
            } else {
              logger.warn('Can not switch state! No AIN found/defined!', `${accessory.displayName} (${subtype})`);
            }
          } catch (err) {
            logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
            logger.error(err);
          }
        }
        break;
      case 'smarthome-temperature':
        // no SET event;
        break;
      case 'smarthome-contact':
        // no SET event
        break;
      case 'smarthome-window':
        // no SET event
        break;
      case 'smarthome-window-switch':
        {
          try {
            logger.info(`${state ? 'ON' : 'OFF'}`, `${accessory.displayName} (${subtype})`);

            const response = await this.fritzbox.exec(
              'urn:DeviceConfig-com:serviceId:DeviceConfig1',
              'X_AVM-DE_CreateUrlSID'
            );
            const sid = response['NewX_AVM-DE_UrlSID'].split('sid=')[1];

            if (accessory.context.config.group) {
              let device = this.smarthomeList.groups.find((device) => device.name.includes(accessory.displayName));

              if (device) {
                accessory.context.config.ain = device.ain;
              }
            }

            let device = this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain));

            if (device) {
              accessory.context.config.ain = device.ain;
            }

            const unixTimestampNow = Math.floor(Date.now() / 1000);
            const maxEndTime = 24 * 60 * 60 - 60;
            const endTime = unixTimestampNow + maxEndTime;

            let cmd = {
              ain: accessory.context.config.ain,
              sid: sid,
              switchcmd: 'sethkrwindowopen',
              endtimestamp: state ? endTime : 0,
            };

            if (accessory.context.config.ain) {
              logger.debug(`Send CMD: ${JSON.stringify(cmd)}`, `${accessory.displayName} (${subtype})`);
              await requestAHA(this.fritzbox.url.hostname, cmd);
            } else {
              logger.warn('Can not switch state! No AIN found/defined!', `${accessory.displayName} (${subtype})`);
            }
          } catch (err) {
            logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
            logger.error(err);
          }
        }
        break;
      case 'smarthome-thermostat':
        {
          try {
            const response = await this.fritzbox.exec(
              'urn:DeviceConfig-com:serviceId:DeviceConfig1',
              'X_AVM-DE_CreateUrlSID'
            );
            const sid = response['NewX_AVM-DE_UrlSID'].split('sid=')[1];

            if (accessory.context.config.group) {
              let device = this.smarthomeList.groups.find((device) => device.name.includes(accessory.displayName));

              if (device) {
                accessory.context.config.ain = device.ain;
              }
            }

            let device = this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain));

            if (device) {
              accessory.context.config.ain = device.ain;
            }

            let cmd = {
              ain: accessory.context.config.ain,
              sid: sid,
            };

            if (accessory.context.config.ain) {
              if (target === 'temperature') {
                logger.info(`Temperature ${state}`, `${accessory.displayName} (${subtype})`);
                let temp = Math.round((Math.min(Math.max(state, 8), 28) - 8) * 2) + 16;

                cmd = {
                  ...cmd,
                  switchcmd: 'sethkrtsoll',
                  param: temp,
                };

                logger.debug(`Send CMD: ${JSON.stringify(cmd)}`, `${accessory.displayName} (${subtype})`);
                await requestAHA(this.fritzbox.url.hostname, cmd);
              } else {
                logger.info(`${state ? 'ON' : 'OFF'}`, `${accessory.displayName} (${subtype})`);

                let targetTemp = accessory
                  .getService(this.api.hap.Service.HeaterCooler)
                  .getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature).value;

                let temp = Math.round((Math.min(Math.max(targetTemp, 8), 28) - 8) * 2) + 16;

                cmd = {
                  ...cmd,
                  switchcmd: 'sethkrtsoll',
                  param: state ? temp : 253,
                };

                logger.debug(`Send CMD: ${JSON.stringify(cmd)}`, `${accessory.displayName} (${subtype})`);
                await requestAHA(this.fritzbox.url.hostname, cmd);
              }
            } else {
              logger.warn('Can not switch state! No AIN found/defined!', `${accessory.displayName} (${subtype})`);
            }
          } catch (err) {
            logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
            logger.error(err);
          }
        }
        break;
      case 'smarthome-blind':
        {
          try {
            logger.info(`Position ${state}`, `${accessory.displayName} (${subtype})`);

            let validTargetPosition = 100 - state;

            let currentPosition = accessory
              .getService(this.api.hap.Service.WindowCovering)
              .getCharacteristic(this.api.hap.Characteristic.CurrentPosition).value;

            if (state === currentPosition) {
              const targetPosition = state;

              accessory
                .getService(this.api.hap.Service.WindowCovering)
                .getCharacteristic(this.api.hap.Characteristic.TargetPosition)
                .updateValue(targetPosition);

              accessory
                .getService(this.api.hap.Service.WindowCovering)
                .getCharacteristic(this.api.hap.Characteristic.CurrentPosition)
                .updateValue(currentPosition);

              accessory
                .getService(this.api.hap.Service.WindowCovering)
                .getCharacteristic(this.api.hap.Characteristic.PositionState)
                .updateValue(2);

              return;
            }

            let moveUp = state > currentPosition;
            let positionState = moveUp ? 1 : 0;

            accessory
              .getService(this.api.hap.Service.WindowCovering)
              .getCharacteristic(this.api.hap.Characteristic.PositionState)
              .updateValue(positionState);

            const response = await this.fritzbox.exec(
              'urn:DeviceConfig-com:serviceId:DeviceConfig1',
              'X_AVM-DE_CreateUrlSID'
            );
            const sid = response['NewX_AVM-DE_UrlSID'].split('sid=')[1];

            if (accessory.context.config.group) {
              let device = this.smarthomeList.groups.find((device) => device.name.includes(accessory.displayName));

              if (device) {
                accessory.context.config.ain = device.ain;
              }
            }

            let device = this.smarthomeList.devices.find((device) => device.ain.includes(accessory.context.config.ain));

            if (device) {
              accessory.context.config.ain = device.ain;
            }

            let cmd = {
              ain: accessory.context.config.ain,
              sid: sid,
              switchcmd: 'setlevelpercentage',
              level: validTargetPosition,
            };

            if (accessory.context.config.ain) {
              logger.debug(`Send CMD: ${JSON.stringify(cmd)}`, `${accessory.displayName} (${subtype})`);
              await requestAHA(this.fritzbox.url.hostname, cmd);
            } else {
              logger.warn('Can not switch state! No AIN found/defined!', `${accessory.displayName} (${subtype})`);

              accessory
                .getService(this.api.hap.Service.WindowCovering)
                .getCharacteristic(this.api.hap.Characteristic.PositionState)
                .updateValue(2);
            }

            accessory
              .getService(this.api.hap.Service.WindowCovering)
              .getCharacteristic(this.api.hap.Characteristic.TargetPosition)
              .updateValue(state);

            accessory
              .getService(this.api.hap.Service.WindowCovering)
              .getCharacteristic(this.api.hap.Characteristic.CurrentPosition)
              .updateValue(state);

            accessory
              .getService(this.api.hap.Service.WindowCovering)
              .getCharacteristic(this.api.hap.Characteristic.PositionState)
              .updateValue(2);
          } catch (err) {
            logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
            logger.error(err);

            accessory
              .getService(this.api.hap.Service.WindowCovering)
              .getCharacteristic(this.api.hap.Characteristic.PositionState)
              .updateValue(2);
          }
        }
        break;
      default:
        logger.warn(
          `Can not handle SET event. Unknown accessory subtype (${subtype})`,
          `${accessory.displayName} (${subtype})`
        );
        break;
    }

    accessory.context.busy = false;
  }

  async poll() {
    await timeout(1000); //wait for accessories to fully load

    try {
      this.smarthomeList = await this.fritzbox.getSmarthomeDevices();
      //logger.debug(this.smarthomeList, 'Smarthome');

      const accessories = this.accessories.filter((accessory) => accessory.context.config.type === 'smarthome');

      for (const accessory of accessories) {
        await this.get(accessory);
      }
    } catch (err) {
      logger.warn('An error occurred during polling smarthome devices!');
      logger.error(err);
    } finally {
      setTimeout(() => this.poll(), this.polling.timer * 1000);
    }
  }
}

const handler = new Handler();
module.exports = handler;
