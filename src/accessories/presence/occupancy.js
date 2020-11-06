'use strict';

const Logger = require('../../helper/logger.js');

class PresenceOccupancyAccessory {

  constructor (api, accessory, handler, accessories) {
    
    this.api = api;
    this.accessory = accessory;
    this.accessories = accessories;
    
    this.handler = handler;
    
    this.getService();

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  async getService () {
    
    let service = this.accessory.getService(this.api.hap.Service.OccupancySensor);
    let serviceOld = this.accessory.getService(this.api.hap.Service.MotionSensor);
    
    if(serviceOld){
      Logger.info('Removing Motion service', this.accessory.displayName);
      this.accessory.removeService(serviceOld);
    }
    
    if(!service){
      Logger.info('Adding Occupancy service', this.accessory.displayName);
      service = this.accessory.addService(this.api.hap.Service.OccupancySensor, this.accessory.displayName, this.accessory.context.config.subtype);
    }
    
    if(this.accessory.displayName === 'Anyone' || (this.accessory.context.polling.timer && (!this.accessory.context.polling.exclude.includes(this.accessory.context.config.type) && !this.accessory.context.polling.exclude.includes(this.accessory.context.config.subtype) && !this.accessory.context.polling.exclude.includes(this.accessory.displayName)))){
   
      service.getCharacteristic(this.api.hap.Characteristic.OccupancyDetected)
        .on('change', this.handler.change.bind(this, this.accessory, 'presence', this.accessory.displayName, false));
        
      if(this.accessory.displayName === 'Anyone'){
        setTimeout(() => {
          this.getState();
        }, 1000);
      }
   
    } else {
    
      service.getCharacteristic(this.api.hap.Characteristic.OccupancyDetected)
        .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.OccupancySensor, this.api.hap.Characteristic.OccupancyDetected, 'presence', false))
        .on('change', this.handler.change.bind(this, this.accessory, 'presence', this.accessory.displayName, false));
    
    }
    
  }
  
  getState(){
  
    let state = this.accessory.getService(this.api.hap.Service.OccupancySensor).getCharacteristic(this.api.hap.Characteristic.OccupancyDetected).value;
    let states = [];
  
    for(const accessory of this.accessories){
      if(accessory.context.config.type.includes('presence') && accessory.displayName !== 'Anyone'){
        let accService = accessory.getService(this.api.hap.Service.OccupancySensor);
        let accChararteristic = this.api.hap.Characteristic.OccupancyDetected;
        if(!accService){
          accService = accessory.getService(this.api.hap.Service.MotionSensor);
          accChararteristic = this.api.hap.Characteristic.MotionDetected;
        }
        states.push(accService.getCharacteristic(accChararteristic).value);
      }
    }
     
    state = (states.includes(1) || states.includes(true)) ? 1 : 0;
       
    this.accessory
      .getService(this.api.hap.Service.OccupancySensor)
      .getCharacteristic(this.api.hap.Characteristic.OccupancyDetected)
      .updateValue(state);
       
    setTimeout(() => {
      this.getState();
    }, 3000); 
  
  }

}

module.exports = PresenceOccupancyAccessory;