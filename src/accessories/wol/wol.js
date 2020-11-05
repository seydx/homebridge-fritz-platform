'use strict';

const Logger = require('../../helper/logger.js');

class wolService {

  constructor (api, accessory, handler) {
    
    this.api = api;
    this.accessory = accessory;
    
    this.handler = handler;
    
    this.getService(this.accessory);

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService (accessory) {
    
    let service = accessory.getService(this.api.hap.Service.Switch);
    
    if(!service){
      Logger.info('Adding switch', accessory.displayName);
      service = accessory.addService(this.api.hap.Service.Switch, this.accessory.displayName, 'wol');
    }
  
    service
      .getCharacteristic(this.api.hap.Characteristic.On)
      .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'wol', false))
      .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'wol', false));
    //.on('change', this.handler.change.bind(this, accessory, accessory.displayName, accessory.context.type)); // no change event required atm
    
  }

}

module.exports = wolService;