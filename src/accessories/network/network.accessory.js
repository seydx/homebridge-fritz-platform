'use strict';

const Handler = require('./network.handler');

class Accessory {
  constructor(device, meshMaster) {
    this.device = device;
    this.fritzbox = meshMaster.fritzbox;

    this.handler = new Handler(device, meshMaster);
  }
}

module.exports = Accessory;
