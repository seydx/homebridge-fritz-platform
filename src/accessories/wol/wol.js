'use strict';

const Logger = require('../../helper/logger.js');

class WolSwitchAccessory {

  constructor (api, accessory, handler) {
    
    this.api = api;
    this.accessory = accessory;
    
    this.handler = handler;
    
    this.getService();

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService () {
    
    let service = this.accessory.getService(this.api.hap.Service.Switch);
    
    if(!service){
      Logger.info('Adding Switch service', this.accessory.displayName);
      service = this.accessory.addService(this.api.hap.Service.Switch, this.accessory.displayName, this.accessory.context.config.subtype);
    }
  
    service
      .getCharacteristic(this.api.hap.Characteristic.On)
      .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'wol', false))
      .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'wol', false));
    
  }

}

module.exports = WolSwitchAccessory;
