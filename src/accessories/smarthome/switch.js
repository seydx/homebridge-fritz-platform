'use strict';

const Logger = require('../../helper/logger.js');

class SmarthomeSwitchAccessory {

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
    let serviceOld = this.accessory.getService(this.api.hap.Service.Outlet);
    
    if(serviceOld){
      Logger.info('Removing Outlet service', this.accessory.displayName);
      this.accessory.removeService(serviceOld);
    }
        
    if(!service){
      Logger.info('Adding Switch service', this.accessory.displayName);
      service = this.accessory.addService(this.api.hap.Service.Switch, this.accessory.displayName, this.accessory.context.config.subtype);
    }
    
    if(this.accessory.context.polling.timer && (!this.accessory.context.polling.exclude.includes(this.accessory.context.config.type) && !this.accessory.context.polling.exclude.includes(this.accessory.context.config.subtype) && !this.accessory.context.polling.exclude.includes(this.accessory.displayName))){
 
      if(!this.accessory.context.config.readOnly){
  
        service.getCharacteristic(this.api.hap.Characteristic.On)
          .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'smarthome-switch', this.accessory.context.config.options));
  
      } else {
  
        service.getCharacteristic(this.api.hap.Characteristic.On)
          .on('set', (state, callback) => {
          
            Logger.info('Can not be switched ' + (state ? 'ON' : 'OFF') + ' - "readOnly" is active!', this.accessory.displayName);
          
            setTimeout(() => {
            
              service
                .getCharacteristic(this.api.hap.Characteristic.On)
                .updateValue(!state);
            
            }, 1000);
            
            callback(null);
          
          });
  
      }
 
    } else {
 
      if(!this.accessory.context.config.readOnly){
   
        service.getCharacteristic(this.api.hap.Characteristic.On)
          .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'smarthome-switch', this.accessory.context.config.options))
          .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'smarthome-switch', this.accessory.context.config.options));
   
      } else {
   
        service.getCharacteristic(this.api.hap.Characteristic.On)
          .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'smarthome-switch', this.accessory.context.config.options))
          .on('set', (state, callback) => {
          
            Logger.info('Can not be switched ' + (state ? 'ON' : 'OFF') + ' - "readOnly" is active!', this.accessory.displayName);
          
            setTimeout(() => {
            
              service
                .getCharacteristic(this.api.hap.Characteristic.On)
                .updateValue(!state);
            
            }, 1000);
            
            callback(null);
          
          });
   
      }
 
    }
    
  }

}

module.exports = SmarthomeSwitchAccessory;