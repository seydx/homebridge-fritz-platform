'use strict';

const Logger = require('../helper/logger.js');

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

  getService (accessory) {
    
    let service = accessory.getService(this.api.hap.Service.OccupancySensor);
    
    if(!service){
      Logger.info('Adding occupancy sensor', accessory.displayName);
      service = accessory.addService(this.api.hap.Service.OccupancySensor, this.accessory.displayName, 'presence');
    }
  
    if(accessory.displayName !== 'Anyone'){
   
      if(accessory.context.polling.timer && (!accessory.context.polling.exclude.includes('presence') && !accessory.context.polling.exclude.includes(accessory.displayName))){
        service.getCharacteristic(this.api.hap.Characteristic.OccupancyDetected)
          .on('change', this.handler.change.bind(this, accessory, 'presence', accessory.displayName));
      } else {
        service.getCharacteristic(this.api.hap.Characteristic.OccupancyDetected)
          .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.OccupancySensor, this.api.hap.Characteristic.OccupancyDetected, 'presence', false))
          .on('change', this.handler.change.bind(this, accessory, 'presence', accessory.displayName));
      }
      
    } else {
    
      service.getCharacteristic(this.api.hap.Characteristic.OccupancyDetected)
        .on('change', this.handler.change.bind(this, accessory, 'presence', accessory.displayName));
    
      this.getState(service);
    
    }
    
  }
  
  getState(service){
  
    let state = service.getCharacteristic(this.api.hap.Characteristic.OccupancyDetected).value;
    let states = [];
  
    for(const accessory of this.accessories)
      if(accessory.context.config.type === 'presence' && accessory.displayName !== 'Anyone')
        states.push(accessory.getService(this.api.hap.Service.OccupancySensor).getCharacteristic(this.api.hap.Characteristic.OccupancyDetected).value);
     
    state = states.includes(1) ? 1 : 0;
       
    service
      .getCharacteristic(this.api.hap.Characteristic.OccupancyDetected)
      .updateValue(state);
       
    setTimeout(() => {
      this.getState(service);
    }, 5000); 
  
  }

}

module.exports = occupancyService;