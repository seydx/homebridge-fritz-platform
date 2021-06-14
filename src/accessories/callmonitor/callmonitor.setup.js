'use strict';

const logger = require('../../utils/logger');
const { UUIDgenerate } = require('../../utils/utils');
const Config = require('./callmonitor.config');

const Callmonitor = require('../../lib/callmonitor');

const Setup = (devices, callmonitorConfig) => {
  let error = false;
  const device = Config(callmonitorConfig);

  if (!device.ip) {
    logger.warn('Callmonitor: There is no or no valid IP address configured this device. This device will be skipped.');
    error = true;
  }

  if (!error) {
    if (device.group) {
      const deviceGroup = {
        ...device,
        name: 'Callmonitor',
        subtype: 'group',
      };

      const uuidGroup = UUIDgenerate(deviceGroup.name);

      if (devices.has(uuidGroup)) {
        logger.warn(
          'Multiple devices are configured with this name. Duplicate devices will be skipped.',
          deviceGroup.name
        );
      } else {
        logger.info('New device added!', deviceGroup.name);
        devices.set(uuidGroup, deviceGroup);
      }
    } else {
      const deviceIncoming = {
        ...device,
        name: 'Callmonitor Incoming',
        subtype: 'incoming',
      };

      const deviceOutgoing = {
        ...device,
        name: 'Callmonitor Outgoing',
        subtype: 'outgoing',
      };

      const uuidIncoming = UUIDgenerate(deviceIncoming.name);
      const uuidOutgoing = UUIDgenerate(deviceOutgoing.name);

      if (devices.has(uuidIncoming)) {
        logger.warn(
          'Multiple devices are configured with this name. Duplicate devices will be skipped.',
          deviceIncoming.name
        );
      } else {
        logger.info('New device added!', deviceIncoming.name);
        devices.set(uuidIncoming, deviceIncoming);
      }

      if (devices.has(uuidOutgoing)) {
        logger.warn(
          'Multiple devices are configured with this name. Duplicate devices will be skipped.',
          deviceOutgoing.name
        );
      } else {
        logger.info('New device added!', deviceOutgoing.name);
        devices.set(uuidOutgoing, deviceOutgoing);
      }
    }

    Callmonitor.configure(callmonitorConfig);
  }
};

module.exports = Setup;
