'use strict';

const logger = require('../../utils/logger');
const { UUIDgenerate } = require('../../utils/utils');
const Config = require('./extras.config');

const Setup = (devices, extrasConfig, meshMaster) => {
  const validExtrasInConfig = ['alarm', 'phoneBook', 'ringlock', 'wakeup', 'dnsServer'];

  let extras = Object.keys(extrasConfig).filter(
    (name) => validExtrasInConfig.includes(name) && extrasConfig[name].active && extrasConfig[name].accType === 'switch'
  );

  extras.forEach((name) => {
    let error = false;

    const config = extrasConfig[name];
    const device = Config(name, config, meshMaster);

    switch (name) {
      case 'alarm':
        if (!device.extras[name].telNr) {
          logger.warn(
            'There is no "telNr" configured for this EXTRAS (alarm) device. This device will be skipped.',
            device.name
          );
          error = true;
        }
        break;
      case 'wakeup':
        if (!device.extras[name].internNr) {
          logger.warn(
            'There is no "internNr" configured for this EXTRAS (wakeup) device. This device will be skipped.',
            device.name
          );
          error = true;
        }
        break;
      case 'ringlock':
        if (!device.extras[name].DECTphones) {
          logger.warn(
            'There is no "DECTphones" configured for this EXTRAS (ringlock) device. This device will be skipped.',
            device.name
          );
          error = true;
        }
        break;
      case 'phoneBook':
        //fall through
        break;
      case 'dnsServer':
        if (!device.extras[name].preferredDns) {
          logger.warn(
            'There is no "preferredDns" configured for this EXTRAS (dnsServer) device. This device will be skipped.',
            device.name
          );
          error = true;
        } else if (!device.extras[name].alternateDns) {
          logger.warn(
            'There is no "alternateDns" configured for this EXTRAS (dnsServer) device. This device will be skipped.',
            device.name
          );
          error = true;
        }
        break;
      case 'fallbackInternet':
        if (!device.extras[name].provider) {
          logger.warn(
            'There is no "provider" configured for this EXTRAS (fallbackInternet) device. This device will be skipped.',
            device.name
          );
          error = true;
        }
        break;
      default:
        //fall through
        break;
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
