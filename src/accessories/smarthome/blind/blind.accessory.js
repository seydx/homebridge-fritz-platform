'use strict';

const logger = require('../../../utils/logger');
const Handler = require('../smarthome.handler');

class Accessory {
  constructor(api, accessory, accessories, meshMaster) {
    this.api = api;
    this.accessory = accessory;

    this.handler = Handler.configure(api, accessories, accessory.context.config.polling, meshMaster);
    this.getService();
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService() {
    let service = this.accessory.getService(this.api.hap.Service.WindowCovering);

    if (!service) {
      logger.info('Adding WindowCovering service', this.accessory.displayName);
      service = this.accessory.addService(
        this.api.hap.Service.WindowCovering,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    service
      .getCharacteristic(this.api.hap.Characteristic.TargetPosition)
      .onSet((state) => this.handler.set(state, this.accessory));
  }
}

module.exports = Accessory;
