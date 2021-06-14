'use strict';

const { validIP, validMAC } = require('../../utils/utils');

const Config = (userConfig) => {
  return {
    active: userConfig.active || false,
    name: userConfig.name,
    address: validIP(userConfig.address) || validMAC(userConfig.address),
    type: 'network',
    subtype: 'network',
    onDelay: parseInt(userConfig.onDelay) || 0,
    offDelay: parseInt(userConfig.offDelay) || 0,
  };
};

module.exports = Config;
