'use strict';

const logger = require('../../utils/logger');
const Handler = require('./extras.handler');
const RouterHandler = require('../router/router.handler');

class Accessory {
  constructor(api, accessory, accessories, meshMaster) {
    this.api = api;
    this.accessory = accessory;

    this.handler = Handler.configure(api, accessories, accessory.context.config.polling, meshMaster);
    RouterHandler.configure(api, accessories, accessory.context.config.polling, meshMaster);

    this.getService();
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService() {
    let service = this.accessory.getService(this.api.hap.Service.Switch);
    const polling = this.accessory.context.config.polling;

    const validOptionsSwitches = [
      'wifi_2ghz',
      'wifi_5ghz',
      'wifi_guest',
      'wps',
      'led',
      'lock',
      'deflection',
      'aw',
      'dect',
    ];

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
      .onSet((state) =>
        validOptionsSwitches.includes(this.accessory.context.config.subtype)
          ? RouterHandler.set(state, this.accessory)
          : this.handler.set(state, this.accessory)
      )
      .on('change', (context) =>
        validOptionsSwitches.includes(this.accessory.context.config.subtype)
          ? RouterHandler.change(context, this.accessory)
          : this.handler.change(context, this.accessory)
      );

    if (polling.exclude.includes(this.accessory.context.config.subtype)) {
      service
        .getCharacteristic(this.api.hap.Characteristic.On)
        .onGet(() =>
          validOptionsSwitches.includes(this.accessory.context.config.subtype)
            ? RouterHandler.get(this.accessory)
            : this.handler.get(this.accessory)
        );
    }
  }
}

module.exports = Accessory;
