'use strict';

const Logger = require('../../helper/logger.js');

class extrasService {

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
      Logger.info('Adding switch', this.accessory.displayName);
      service = this.accessory.addService(this.api.hap.Service.Switch, this.accessory.displayName, this.accessory.context.config.subtype);
    }
    
    if(this.accessory.context.config.subtype === 'broadband'){
      if(!service.testCharacteristic(this.api.hap.Characteristic.Download)){
        Logger.info('Adding Download Characteristic', this.accessory.displayName);
        service.addCharacteristic(this.api.hap.Characteristic.Download);
      }
      if(!service.testCharacteristic(this.api.hap.Characteristic.Upload)){
        Logger.info('Adding Upload Characteristic', this.accessory.displayName);
        service.addCharacteristic(this.api.hap.Characteristic.Upload);
      }
      if(!service.testCharacteristic(this.api.hap.Characteristic.Ping)){
        Logger.info('Adding Ping Characteristic', this.accessory.displayName);
        service.addCharacteristic(this.api.hap.Characteristic.Ping);
      }
    }
    
    if(this.accessory.context.polling.timer && (!this.accessory.context.polling.exclude.includes(this.accessory.context.config.type) && !this.accessory.context.polling.exclude.includes(this.accessory.context.config.subtype) && !this.accessory.context.polling.exclude.includes(this.accessory.displayName))){
      service.getCharacteristic(this.api.hap.Characteristic.On)
        .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, this.accessory.context.config.subtype, this.accessory.context.config.options))
        .on('change', this.handler.change.bind(this, this.accessory, this.accessory.context.config.subtype, this.accessory.displayName, false));
    } else {
      service.getCharacteristic(this.api.hap.Characteristic.On)
        .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, this.accessory.context.config.subtype, this.accessory.context.config.options))
        .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, this.accessory.context.config.subtype, this.accessory.context.config.options))
        .on('change', this.handler.change.bind(this, this.accessory, this.accessory.context.config.subtype, this.accessory.displayName, false));
    }
    
  }

}

module.exports = extrasService;
