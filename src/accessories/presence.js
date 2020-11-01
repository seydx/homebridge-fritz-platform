'use strict';

const Logger = require('../helper/logger.js');

var FakeGatoHistoryService;

class occupancyService {

  constructor (api, accessory, handler, accessories) {
  
    if(accessory.context.config.accType === 'motion')
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
  
    this.historyService = false;
    
    let serviceName = accessory.context.config.accType === 'occupancy' 
      ? this.api.hap.Service.OccupancySensor 
      : this.api.hap.Service.MotionSensor;
      
    let serviceNameOld = accessory.context.config.accType === 'occupancy' 
      ? this.api.hap.Service.MotionSensor 
      : this.api.hap.Service.OccupancySensor;
      
    let characteristicName = accessory.context.config.accType === 'occupancy' 
      ? this.api.hap.Characteristic.OccupancyDetected
      : this.api.hap.Characteristic.MotionDetected;
      
    let characteristicNameOld = accessory.context.config.accType === 'occupancy' 
      ? this.api.hap.Characteristic.MotionDetected
      : this.api.hap.Characteristic.OccupancyDetected;
    
    let service = accessory.getService(serviceName);
    let serviceOld = accessory.getService(serviceNameOld);
    
    if(serviceOld){
      Logger.info('Removing ' + (accessory.context.config.accType === 'occupancy' ? 'motion' : 'occupancy') + ' sensor', accessory.displayName);
      accessory.removeService(accessory.getService(serviceNameOld));
    }
    
    if(!service){
      Logger.info('Adding ' + (accessory.context.config.accType === 'occupancy' ? 'occupancy' : 'motion') + ' sensor', accessory.displayName);
      service = accessory.addService(serviceName, this.accessory.displayName, 'presence');
    }
    
    if(service.testCharacteristic(characteristicNameOld)){
      Logger.debug('Removing ' + (accessory.context.config.accType === 'occupancy' ? 'motion' : 'occupancy') + ' characteristic', accessory.displayName);
      service.removeCharacteristic(service.getCharacteristic(characteristicNameOld));
      if(accessory.context.config.accType === 'occupancy' && service.testCharacteristic(this.api.hap.Characteristic.LastActivation)){
        Logger.debug('Removing LastActivation characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.LastActivation)); 
      }
    }
    
    if(accessory.context.config.accType === 'motion'){
    
      if(!service.testCharacteristic(this.api.hap.Characteristic.LastActivation))
        service.addCharacteristic(this.api.hap.Characteristic.LastActivation);
      
      this.historyService = new FakeGatoHistoryService('motion', this.accessory, {storage:'fs'}); 
        
    }
  
    if(accessory.displayName !== 'Anyone'){
   
      if(accessory.context.polling.timer && (!accessory.context.polling.exclude.includes('presence') && !accessory.context.polling.exclude.includes(accessory.displayName))){
        service.getCharacteristic(characteristicName)
          .on('change', this.handler.change.bind(this, accessory, 'presence', accessory.displayName, this.historyService));
      } else {
        service.getCharacteristic(characteristicName)
          .on('get', this.handler.get.bind(this, accessory, serviceName, characteristicName, 'presence', false)) 
          .on('change', this.handler.change.bind(this, accessory, 'presence', accessory.displayName, this.historyService));
      }
      
    } else {
    
      service.getCharacteristic(characteristicName)
        .on('change', this.handler.change.bind(this, accessory, 'presence', accessory.displayName, this.historyService));
    
      this.getState(service, characteristicName);
    
    }
    
  }
  
  getState(service, characteristicName){
  
    let state = service.getCharacteristic(characteristicName).value;
    let states = [];
  
    for(const accessory of this.accessories){
      if(accessory.context.config.type === 'presence' && accessory.displayName !== 'Anyone'){
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
       
    service
      .getCharacteristic(characteristicName)
      .updateValue(state);
       
    setTimeout(() => {
      this.getState(service, characteristicName);
    }, 5000); 
  
  }

}

module.exports = occupancyService;
