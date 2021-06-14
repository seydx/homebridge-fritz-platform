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
      } else {
        devices.set(uuid, device);
      }

      if (!device.group && device.temperature && device.accType === 'switch') {
        let tempDevice = {
          name: device.name + ' Temperature',
          type: 'smarthome',
          subtype: 'smarthome-temperature',
          group: device.group,
          battery: device.battery,
          humidity: device.humidity,
          ain: device.ain,
        };

        const uuidTemp = UUIDgenerate(tempDevice.name);
        if (devices.has(uuidTemp)) {
          logger.warn(
            'Multiple devices are configured with this name. Duplicate devices will be skipped.',
            tempDevice.name
          );
        } else {
          devices.set(uuidTemp, tempDevice);
        }
      }

      if (!device.group && device.window && device.accType === 'thermostat') {
        let windowDevice = {
          name: device.name + ' Window',
          type: 'smarthome',
          subtype: 'smarthome-window',
          group: device.group,
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
          devices.set(uuidWindow, windowDevice);
        }
      }

      if (!device.group && device.blind && device.accType === 'blind') {
        let blindDevice = {
          name: device.name + ' Blind',
          type: 'smarthome',
          subtype: 'smarthome-blind',
          group: device.group,
          ain: device.ain,
        };

        const uuidBlind = UUIDgenerate(blindDevice.name);
        if (devices.has(uuidBlind)) {
          logger.warn(
            'Multiple devices are configured with this name. Duplicate devices will be skipped.',
            blindDevice.name
          );
        } else {
          devices.set(uuidBlind, blindDevice);
        }
      }
    }
  });
};

module.exports = Setup;
