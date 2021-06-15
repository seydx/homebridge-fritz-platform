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
    let service = this.accessory.getService(this.api.hap.Service.Switch);
    let serviceOld = this.accessory.getService(this.api.hap.Service.Outlet);

    if (serviceOld) {
      logger.info(
        'Removing Outlet service',
        `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
      );
      this.accessory.removeService(serviceOld);
    }

    if (!service) {
      logger.info('Adding Switch service', `${this.accessory.displayName} (${this.accessory.context.config.subtype})`);
      service = this.accessory.addService(
        this.api.hap.Service.Switch,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    if (!this.accessory.context.config.readOnly) {
      service
        .getCharacteristic(this.api.hap.Characteristic.On)
        .onSet((state) => this.handler.set(state, this.accessory));
    } else {
      service.getCharacteristic(this.api.hap.Characteristic.On).onSet((state) => {
        logger.info(
          'Changing state not allowed - "readOnly" is active!',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        setTimeout(() => service.getCharacteristic(this.api.hap.Characteristic.On).updateValue(!state), 1000);
      });
    }
  }
}

module.exports = Accessory;
