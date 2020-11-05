'use strict';

const Logger = require('../../helper/logger.js');

var FakeGatoHistoryService;

class occupancyService {

  constructor (api, accessory, handler, accessories) {
  
    FakeGatoHistoryService = require('fakegato-history')(api);
    
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
    
    let service = accessory.getService(this.api.hap.Service.MotionSensor);
    let serviceOld = accessory.getService(this.api.hap.Service.OccupancySensor);
    
    if(serviceOld){
      Logger.info('Removing occupancy sensor', accessory.displayName);
      accessory.removeService(accessory.getService(this.api.hap.Service.OccupancySensor));
    }
    
    if(!service){
      Logger.info('Adding motion sensor', accessory.displayName);
      service = accessory.addService(this.api.hap.Service.MotionSensor, this.accessory.displayName, 'presence');
    }
    
    if(!service.testCharacteristic(this.api.hap.Characteristic.LastActivation))
      service.addCharacteristic(this.api.hap.Characteristic.LastActivation);
    
    this.historyService = new FakeGatoHistoryService('motion', this.accessory, {storage:'fs'}); 
    
    if(accessory.displayName === 'Anyone' || (accessory.context.polling.timer && (!accessory.context.polling.exclude.includes('presence') && !accessory.context.polling.exclude.includes(accessory.displayName)))){
   
      service.getCharacteristic(this.api.hap.Characteristic.MotionDetected)
        .on('change', this.handler.change.bind(this, accessory, 'presence', accessory.displayName, this.historyService));
        
      if(accessory.displayName === 'Anyone')
        this.getState();
   
    } else {
    
      service.getCharacteristic(this.api.hap.Characteristic.MotionDetected)
        .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.MotionSensor, this.api.hap.Characteristic.MotionDetected, 'presence', false))
        .on('change', this.handler.change.bind(this, accessory, 'presence', accessory.displayName, this.historyService));
    
    }
    
  }
  
  getState(){
  
    let state = this.accessory.getService(this.api.hap.Service.MotionSensor).getCharacteristic(this.api.hap.Characteristic.MotionDetected).value;
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
      .getService(this.api.hap.Service.MotionSensor)
      .getCharacteristic(this.api.hap.Characteristic.MotionDetected)
      .updateValue(state);
       
    setTimeout(() => {
      this.getState();
    }, 3000); 
  
  }

}

module.exports = occupancyService;