'use strict';

const { validIP } = require('../../utils/utils');

const Config = (childlockConfig) => {
  return {
    active: childlockConfig.active || false,
    name: childlockConfig.name,
    ips: (childlockConfig.ips || []).filter((ip) => validIP(ip)),
    type: 'childlock',
    subtype: 'childlock',
  };
};

module.exports = Config;
