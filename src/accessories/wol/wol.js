'use strict';

const Logger = require('../../helper/logger.js');

class wolService {

  constructor (api, accessory, handler) {
    
    this.api = api;
    this.accessory = accessory;
    
    this.handler = handler;
    
    this.getService();

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService (accessory) {
    
    let service = accessory.getService(this.api.hap.Service.Switch);
    
    if(!service){
      Logger.info('Adding switch', accessory.displayName);
      service = accessory.addService(this.api.hap.Service.Switch, this.accessory.displayName, this.accessory.context.config.subtype);
    }
  
    service
      .getCharacteristic(this.api.hap.Characteristic.On)
      .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'wol', false))
      .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'wol', false));
    
  }

}

module.exports = wolService;