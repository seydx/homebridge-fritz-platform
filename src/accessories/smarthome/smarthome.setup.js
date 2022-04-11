'use strict';

const logger = require('../../utils/logger');
const { UUIDgenerate } = require('../../utils/utils');
const Config = require('./smarthome.config');

const Setup = (devices, smarthomeConfig) => {
  smarthomeConfig.forEach((config) => {
    let error = false;
    const device = Config(config);

    if (!device.group) {
      if (!device.active) {
        error = true;
      } else if (!device.name) {
        logger.warn('One of the SMARTHOME devices has no name configured. This device will be skipped.');
        error = true;
      } else if (!device.ain) {
        logger.warn(
          'There is no "ain" configured for this SMARTHOME device. This device will be skipped.',
          device.name
        );
        error = true;
      } else if (!device.accType) {
        logger.warn(
          'There is no or no valid "accType" configured for this SMARTHOME device. This device will be skipped.',
          device.name
        );
        error = true;
      } else if (device.accType === 'button' && !device.buttons && !device.temperature && !device.humidity) {
        logger.warn(
          'There is no or no valid "buttons" configured for this SMARTHOME device. This device will be skipped.',
          device.name
        );
        error = true;
      }
    } else {
      if (!device.active) {
        error = true;
      } else if (!device.name) {
        logger.warn('One of the SMARTHOME grouped devices has no name configured. This device will be skipped.');
        error = true;
      } else if (!device.accTypeGroup) {
        logger.warn(
          'There is no or no valid "accTypeGroup" configured for this grouped SMARTHOME device. This device will be skipped.',
          device.name
        );
        error = true;
      }
    }

    if (!error) {
      const uuid = UUIDgenerate(device.name);

      if (devices.has(uuid)) {
        logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', device.name);
      } else if (device.accType === 'button' && !device.buttons) {
        logger.debug('Buttons disabled!', device.name);
      } else {
        logger.debug('New device added!', device.name);
        devices.set(uuid, device);
      }

      if (!device.group) {
        if (
          device.temperature &&
          (device.accType === 'switch' || device.accType === 'button' || device.accType === 'thermostat')
        ) {
          let tempDevice = {
            name: device.name + ' Temperature',
            type: 'smarthome',
            subtype: 'smarthome-temperature',
            battery: device.battery,
            ain: device.ain,
          };

          const uuidTemp = UUIDgenerate(tempDevice.name);
          if (devices.has(uuidTemp)) {
            logger.warn(
              'Multiple devices are configured with this name. Duplicate devices will be skipped.',
              tempDevice.name
            );
          } else {
            logger.debug('New device added!', tempDevice.name);
            devices.set(uuidTemp, tempDevice);
          }
        }

        if (
          device.humidity &&
          (device.accType === 'switch' || device.accType === 'button' || device.accType === 'thermostat')
        ) {
          let humidityDevice = {
            name: device.name + ' Humidity',
            type: 'smarthome',
            subtype: 'smarthome-humidity',
            battery: device.battery,
            ain: device.ain,
          };

          const uuidTemp = UUIDgenerate(humidityDevice.name);
          if (devices.has(uuidTemp)) {
            logger.warn(
              'Multiple devices are configured with this name. Duplicate devices will be skipped.',
              humidityDevice.name
            );
          } else {
            logger.debug('New device added!', humidityDevice.name);
            devices.set(uuidTemp, humidityDevice);
          }
        }

        if (device.accType === 'thermostat') {
          if (device.window) {
            let windowDevice = {
              name: device.name + ' Window',
              type: 'smarthome',
              subtype: 'smarthome-window',
              battery: device.battery,
              ain: device.ain,
            };

            const uuidWindow = UUIDgenerate(windowDevice.name);
            if (devices.has(uuidWindow)) {
              logger.warn(
                'Multiple devices are configured with this name. Duplicate devices will be skipped.',
                windowDevice.name
              );
            } else {
              logger.debug('New device added!', windowDevice.name);
              devices.set(uuidWindow, windowDevice);
            }
          }

          if (device.openWindow) {
            let openWindowDevice = {
              name: device.name + ' Open Window',
              type: 'smarthome',
              subtype: 'smarthome-window-switch',
              ain: device.ain,
            };

            const uuidWindow = UUIDgenerate(openWindowDevice.name);
            if (devices.has(uuidWindow)) {
              logger.warn(
                'Multiple devices are configured with this name. Duplicate devices will be skipped.',
                openWindowDevice.name
              );
            } else {
              logger.debug('New device added!', openWindowDevice.name);
              devices.set(uuidWindow, openWindowDevice);
            }
          }
        }
      }
    }
  });
};

module.exports = Setup;
