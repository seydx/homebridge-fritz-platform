'use strict';

const logger = require('../../utils/logger');
const { UUIDgenerate } = require('../../utils/utils');
const Config = require('./wol.config');

const Setup = (devices, wolConfig) => {
  wolConfig.forEach((config) => {
    let error = false;
    const device = Config(config);

    if (!device.active) {
      error = true;
    } else if (!device.name) {
      logger.warn('One of the WOL devices has no name configured. This device will be skipped.');
      error = true;
    } else if (!device.address) {
      logger.warn(
        'There is no or no valid MAC address configured for this WOL device. This device will be skipped.',
        device.name
      );
      error = true;
    }

    if (!error) {
      const uuid = UUIDgenerate(device.name);

      if (devices.has(uuid)) {
        logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', device.name);
      } else {
        logger.debug('New device added!', device.name);
        devices.set(uuid, device);
      }
    }
  });
};

module.exports = Setup;
