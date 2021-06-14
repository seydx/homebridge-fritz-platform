'use strict';

const { validMAC } = require('../../utils/utils');

const Config = (wolConfig) => {
  return {
    active: wolConfig.active || false,
    name: wolConfig.name,
    address: validMAC(wolConfig.address),
    type: 'wol',
    subtype: 'wol',
  };
};

module.exports = Config;
