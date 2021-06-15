'use strict';

const { validIP, validMAC } = require('../../utils/utils');

const Config = (networkConfig) => {
  return {
    active: networkConfig.active || false,
    name: networkConfig.name,
    address: validIP(networkConfig.address) || validMAC(networkConfig.address),
    type: 'network',
    subtype: 'network',
    polling: networkConfig.polling < 15 ? 15 : networkConfig.polling,
    onDelay: parseInt(networkConfig.onDelay) || 0,
    offDelay: parseInt(networkConfig.offDelay) || 0,
  };
};

module.exports = Config;
