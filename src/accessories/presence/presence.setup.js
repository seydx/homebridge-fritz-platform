'use strict';

const logger = require('../../utils/logger');
const { UUIDgenerate } = require('../../utils/utils');
const Config = require('./presence.config');

const Setup = (devices, presenceConfig, presenceOptions) => {
  let exposed = false;

  presenceConfig.forEach((config) => {
    let error = false;
    const user = Config(config);

    if (!user.active) {
      error = true;
    } else if (!user.name) {
      logger.warn('One of the PRESENCE devices has no name configured. This user will be skipped.');
      error = true;
    } else if (user.name === 'Anyone') {
      logger.warn(
        'One of the PRESENCE devices is called "Anyone". Please change name of this device! This device will be skipped.',
        user.name
      );
      error = true;
    } else if (!user.address) {
      logger.warn(
        'There is no or no valid address configured for this PRESENCE device. This device will be skipped.',
        user.name
      );
      error = true;
    }

    if (!error) {
      const uuid = UUIDgenerate(user.name);

      if (devices.has(uuid)) {
        logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', user.name);
      } else {
        logger.info('New device added!', user.name);
        devices.set(uuid, user);

        exposed = true;
      }
    }
  });

  if (presenceOptions.anyone && exposed) {
    const validTypes = ['occupancy', 'motion'];

    const anyoneConfig = {
      name: 'Anyone',
      type: 'presence',
      subtype: validTypes.find((el) => el === presenceOptions.accType) || 'occupancy',
      accType: validTypes.find((el) => el === presenceOptions.accType) || 'occupancy',
    };

    const uuid = UUIDgenerate(anyoneConfig.name);

    if (devices.has(uuid)) {
      logger.warn(
        'Multiple devices are configured with this name. Duplicate devices will be skipped.',
        anyoneConfig.name
      );
    } else {
      devices.set(uuid, anyoneConfig);
    }
  }
};

module.exports = Setup;
