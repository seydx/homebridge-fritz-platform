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
    
    if(this.accessory.context.config.brightness){
      if(!service.testCharacteristic(this.api.hap.Characteristic.Brightness))
        service.addCharacteristic(this.api.hap.Characteristic.Brightness);  
    } else {
      if(service.testCharacteristic(this.api.hap.Characteristic.Brightness) && !this.accessory.context.config.color)
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Brightness));  
    }

    if(this.accessory.context.config.color){
    
      if(!service.testCharacteristic(this.api.hap.Characteristic.Brightness))
        service.addCharacteristic(this.api.hap.Characteristic.Brightness);  
   
      if(!service.testCharacteristic(this.api.hap.Characteristic.Hue))
        service.addCharacteristic(this.api.hap.Characteristic.Hue); 
   
      if(!service.testCharacteristic(this.api.hap.Characteristic.Saturation))
        service.addCharacteristic(this.api.hap.Characteristic.Saturation);
   
      if(!service.testCharacteristic(this.api.hap.Characteristic.ColorTemperature))
        service.addCharacteristic(this.api.hap.Characteristic.ColorTemperature); 
        
      service.getCharacteristic(this.api.hap.Characteristic.ColorTemperature)
        .setProps({
          minValue: 140,
          maxValue: 500
        });               
      
      if(this.api.versionGreaterOrEqual && this.api.versionGreaterOrEqual('v1.3.0-beta.23')){
    
        this.adaptiveLightingController  = new this.api.hap.AdaptiveLightingController(service, {
          controllerMode: this.api.hap.AdaptiveLightingControllerMode.AUTOMATIC,
        });
        
        this.accessory.configureController(this.adaptiveLightingController);
        this.accessory.adaptiveLightingController = this.adaptiveLightingController;
      
      }
    
    } else {
    
      if(service.testCharacteristic(this.api.hap.Characteristic.Brightness))
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Brightness));   
   
      if(service.testCharacteristic(this.api.hap.Characteristic.Hue))
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Hue));   
   
      if(service.testCharacteristic(this.api.hap.Characteristic.Saturation))
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Saturation));  
   
      if(service.testCharacteristic(this.api.hap.Characteristic.ColorTemperature))
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.ColorTemperature));    
    
    }                                                                                             
    
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
        
    if(this.accessory.context.config.color){
    
      service.getCharacteristic(this.api.hap.Characteristic.ColorTemperature)    
        .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Lightbulb, this.api.hap.Characteristic.ColorTemperature, 'smarthome-lightbulb', 'temperature'));  
   
      service.getCharacteristic(this.api.hap.Characteristic.Saturation)
        .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Lightbulb, this.api.hap.Characteristic.Saturation, 'smarthome-lightbulb', 'color'));  
   
    }         
                   
  }

}

module.exports = SmarthomeLightbulbAccessory;
