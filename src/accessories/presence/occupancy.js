'use strict';

const Logger = require('../../helper/logger.js');

class occupancyService {

  constructor (api, accessory, handler, accessories) {
    
    this.api = api;
    this.accessory = accessory;
    this.accessories = accessories;
    
    this.handler = handler;
    
    this.getService(this.accessory);

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  async getService (accessory) {
    
    let service = accessory.getService(this.api.hap.Service.OccupancySensor);
    let serviceOld = accessory.getService(this.api.hap.Service.MotionSensor);
    
    if(serviceOld){
      Logger.info('Removing motion sensor', accessory.displayName);
      accessory.removeService(accessory.getService(this.api.hap.Service.MotionSensor));
    }
    
    if(!service){
      Logger.info('Adding occupancy sensor', accessory.displayName);
      service = accessory.addService(this.api.hap.Service.OccupancySensor, this.accessory.displayName, 'presence');
    }
    
    if(accessory.displayName === 'Anyone' || (accessory.context.polling.timer && (!accessory.context.polling.exclude.includes('presence') && !accessory.context.polling.exclude.includes(accessory.displayName)))){
   
      service.getCharacteristic(this.api.hap.Characteristic.OccupancyDetected)
        .on('change', this.handler.change.bind(this, accessory, 'presence', accessory.displayName, false));
        
      if(accessory.displayName === 'Anyone')
        this.getState();
   
    } else {
    
      service.getCharacteristic(this.api.hap.Characteristic.OccupancyDetected)
        .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.OccupancySensor, this.api.hap.Characteristic.OccupancyDetected, 'presence', false))
        .on('change', this.handler.change.bind(this, accessory, 'presence', accessory.displayName, false));
    
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

module.exports = occupancyService;