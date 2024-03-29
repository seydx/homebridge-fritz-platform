'use strict';

const Fritzbox = require('@seydx/fritzbox');
const logger = require('../../utils/logger');
const { UUIDgenerate } = require('../../utils/utils');
const Config = require('./router.config');

const Setup = (devices, routerConfig, extrasConfig, optionsConfig, meshMaster) => {
  routerConfig.forEach((config) => {
    let error = false;
    const device = Config(config, extrasConfig, optionsConfig);

    if (!device.active) {
      error = true;
    } else if (!device.name) {
      logger.warn('One of the ROUTER devices has no name configured. This device will be skipped.');
      error = true;
    } else if (!device.host) {
      logger.warn('There is no host configured for this  device. This device will be skipped.', device.name);
      error = true;
    }

    if (!error) {
      const uuid = UUIDgenerate(device.name);

      if (devices.has(uuid)) {
        logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', device.name);
      } else {
        device.fritzbox = new Fritzbox(device);

        if (device.master && !meshMaster.configured) {
          meshMaster.config = device;
          meshMaster.configured = true;
          meshMaster.fritzbox = device.fritzbox;
          meshMaster.wifiUnits = device.wifiUnits;

          delete meshMaster.config.fritzbox;
        }

        if (!device.hide) {
          logger.debug('New device added!', device.name);
          devices.set(uuid, device);
        }

        device.switches.forEach((name) => {
          const formattedName = name.includes('_') ? name.replace('_', ' ') : name;

          let extraSwitch = {
            ...device,
            name: device.name + ' ' + (formattedName[0].toUpperCase() + formattedName.substring(1)),
            type: 'extra',
            subtype: name,
            parent: device.name,
          };

          const uuidSwitch = UUIDgenerate(extraSwitch.name);

          if (devices.has(uuidSwitch)) {
            logger.warn(
              'Multiple devices are configured with this name. Duplicate devices will be skipped.',
              extraSwitch.name
            );
          } else {
            logger.debug('New device added!', extraSwitch.name);
            devices.set(uuidSwitch, extraSwitch);
          }
        });
      }
    }
  });
};

module.exports = Setup;
