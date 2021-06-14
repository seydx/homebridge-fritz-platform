'use strict';

const { validIP } = require('../../utils/utils');

const Config = (extrasConfig) => {
  return {
    active: extrasConfig.active || false,
    name: null,
    group: extrasConfig.group || false,
    type: 'callmonitor',
    subtype: null,
    ip: validIP(extrasConfig.ip),
    port: extrasConfig.port || 1012,
    cityPrefix: extrasConfig.cityPrefix || false,
    countryPrefix: extrasConfig.countryPrefix || false,
    incomingTo: extrasConfig.incomingTo || [],
    outgoingFrom: extrasConfig.outgoingFrom || [],
  };
};

module.exports = Config;
