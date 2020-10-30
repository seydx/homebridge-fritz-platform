'use strict';

const Logger = require('../helper/logger.js');

class extrasService {

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
      service = accessory.addService(this.api.hap.Service.Switch, this.accessory.displayName, 'extra');
    }
    
    if(accessory.context.config.subtype === 'broadband'){
      if(!service.testCharacteristic(this.api.hap.Characteristic.Download)){
        Logger.info('Adding Download Characteristic', accessory.displayName);
        service.addCharacteristic(this.api.hap.Characteristic.Download);
      }
      if(!service.testCharacteristic(this.api.hap.Characteristic.Upload)){
        Logger.info('Adding Upload Characteristic', accessory.displayName);
        service.addCharacteristic(this.api.hap.Characteristic.Upload);
      }
      if(!service.testCharacteristic(this.api.hap.Characteristic.Ping)){
        Logger.info('Adding Ping Characteristic', accessory.displayName);
        service.addCharacteristic(this.api.hap.Characteristic.Ping);
      }
    }
    
    if(accessory.context.polling.timer && (!accessory.context.polling.exclude.includes(accessory.context.config.subtype) || !accessory.context.polling.exclude.includes(accessory.displayName))){
      service.getCharacteristic(this.api.hap.Characteristic.On)
        .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, accessory.context.config.subtype, accessory.context.config.options))
        .on('change', this.handler.change.bind(this, accessory, accessory.context.config.subtype, accessory.displayName));
    } else {
      service.getCharacteristic(this.api.hap.Characteristic.On)
        .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, accessory.context.config.subtype, accessory.context.config.options))
        .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, accessory.context.config.subtype, accessory.context.config.options))
        .on('change', this.handler.change.bind(this, accessory, accessory.context.config.subtype, accessory.displayName));
    }
    
  }

}

module.exports = extrasService;