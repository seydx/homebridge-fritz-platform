'use strict';

const logger = require('../../utils/logger');
const { UUIDgenerate } = require('../../utils/utils');
const Config = require('./network.config');
const Accessory = require('./network.accessory');

const Setup = (networkConfig, polling, meshMaster) => {
  networkConfig.forEach((config) => {
    let error = false;
    const device = Config(config);

    if (!device.active) {
      error = true;
    } else if (!device.name) {
      logger.warn('One of the NETWORK devices has no name configured. This device will be skipped.');
      error = true;
    } else if (!device.address) {
      logger.warn(
        'There is no or no valid address configured for this NETWORK device. This device will be skipped.',
        device.name
      );
      error = true;
    }

    if (!error) {
      const uuid = UUIDgenerate(device.name);

      if (this.network.has(uuid)) {
        logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', device.name);
      } else {
        logger.info('Configuring network device', device.name);
        new Accessory(device, polling, meshMaster);
      }
    }
  });
};

module.exports = Setup;
