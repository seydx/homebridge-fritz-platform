'use strict';

const Logger = require('../../helper/logger.js');

class SmarthomeLightbulbAccessory {

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
  
    let service = this.accessory.getService(this.api.hap.Service.Lightbulb);
        
    if(!service){
      Logger.info('Adding Lightbulb service', this.accessory.displayName);
      service = this.accessory.addService(this.api.hap.Service.Lightbulb, this.accessory.displayName, this.accessory.context.config.subtype);
    }
    
    if(!service.testCharacteristic(this.api.hap.Characteristic.Brightness) && this.accessory.context.config.brightness)
      service.addCharacteristic(this.api.hap.Characteristic.Brightness);
    
    if(this.accessory.context.polling.timer && (!this.accessory.context.polling.exclude.includes(this.accessory.context.config.type) && !this.accessory.context.polling.exclude.includes(this.accessory.context.config.subtype) && !this.accessory.context.polling.exclude.includes(this.accessory.displayName))){
 
      service.getCharacteristic(this.api.hap.Characteristic.On)
        .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Lightbulb, this.api.hap.Characteristic.On, 'smarthome-lightbulb', 'on'));
 
    } else {
 
      service.getCharacteristic(this.api.hap.Characteristic.On)
        .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Lightbulb, this.api.hap.Characteristic.On, 'smarthome-lightbulb', 'on'))
        .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Lightbulb, this.api.hap.Characteristic.On, 'smarthome-lightbulb', 'on'));
 
    }
    
    if(this.accessory.context.config.brightness)
      service.getCharacteristic(this.api.hap.Characteristic.Brightness)
        .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Lightbulb, this.api.hap.Characteristic.Brightness, 'smarthome-lightbulb', 'brightness'));
    
  }

}

module.exports = SmarthomeLightbulbAccessory;