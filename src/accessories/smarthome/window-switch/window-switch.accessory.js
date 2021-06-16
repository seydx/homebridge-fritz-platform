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

  async getService() {
    let service = this.accessory.getService(this.api.hap.Service.Switch);

    if (!service) {
      logger.info('Adding Switch service', `${this.accessory.displayName} (${this.accessory.context.config.subtype})`);
      service = this.accessory.addService(
        this.api.hap.Service.Switch,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    service
      .getCharacteristic(this.api.hap.Characteristic.On)
      .onGet(() => this.handler.get(this.accessory))
      .onSet((state) => this.handler.set(state, this.accessory))
      .on('change', (context) => this.handler.change(context, this.accessory));
  }
}

module.exports = Accessory;
