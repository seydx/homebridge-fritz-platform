'use strict';

const Logger = require('../../helper/logger.js');

class ExtrasSwitchAccessory {
  constructor(api, accessory, handler) {
    this.api = api;
    this.accessory = accessory;

    this.handler = handler;

    this.getService();
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService() {
    let service = this.accessory.getService(this.api.hap.Service.Switch);

    if (!service) {
      Logger.info('Adding Switch service', this.accessory.displayName);
      service = this.accessory.addService(
        this.api.hap.Service.Switch,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    if (
      this.accessory.context.polling.timer &&
      !this.accessory.context.polling.exclude.includes(this.accessory.context.config.type) &&
      !this.accessory.context.polling.exclude.includes(this.accessory.context.config.subtype) &&
      !this.accessory.context.polling.exclude.includes(this.accessory.displayName)
    ) {
      service
        .getCharacteristic(this.api.hap.Characteristic.On)
        .on(
          'set',
          this.handler.set.bind(
            this,
            this.accessory,
            this.api.hap.Service.Switch,
            this.api.hap.Characteristic.On,
            this.accessory.context.config.subtype,
            this.accessory.context.config.options
          )
        )
        .on(
          'change',
          this.handler.change.bind(
            this,
            this.accessory,
            this.accessory.context.config.subtype,
            this.accessory.displayName,
            false
          )
        );
    } else {
      service
        .getCharacteristic(this.api.hap.Characteristic.On)
        .on(
          'get',
          this.handler.get.bind(
            this,
            this.accessory,
            this.api.hap.Service.Switch,
            this.api.hap.Characteristic.On,
            this.accessory.context.config.subtype,
            this.accessory.context.config.options
          )
        )
        .on(
          'set',
          this.handler.set.bind(
            this,
            this.accessory,
            this.api.hap.Service.Switch,
            this.api.hap.Characteristic.On,
            this.accessory.context.config.subtype,
            this.accessory.context.config.options
          )
        )
        .on(
          'change',
          this.handler.change.bind(
            this,
            this.accessory,
            this.accessory.context.config.subtype,
            this.accessory.displayName,
            false
          )
        );
    }
  }
}

module.exports = ExtrasSwitchAccessory;
