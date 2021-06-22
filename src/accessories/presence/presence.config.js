'use strict';

const { validIP, validMAC } = require('../../utils/utils');

const Config = (userConfig) => {
  const validTypes = ['occupancy', 'motion'];

  return {
    active: userConfig.active || false,
    name: userConfig.name,
    address: validIP(userConfig.address) || validMAC(userConfig.address),
    type: 'presence',
    subtype: validTypes.find((el) => el === userConfig.accType) || 'occupancy',
    blockTelegram: userConfig.blockTelegram || false,
    ping: userConfig.ping || false,
    threshold: parseInt(userConfig.threshold) || 0,
    accType: validTypes.find((el) => el === userConfig.accType) || 'occupancy',
    onDelay: parseInt(userConfig.onDelay) || 0,
    offDelay: parseInt(userConfig.offDelay) || 0,
  };
};

module.exports = Config;
