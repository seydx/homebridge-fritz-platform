'use strict';

const Logger = require('../../helper/logger.js');

class extrasService {

  constructor (api, accessory, handler, FakeGatoHistoryService) {
    
    this.api = api;
    this.accessory = accessory;
    this.FakeGatoHistoryService = FakeGatoHistoryService;
    
    this.handler = handler;
    
    this.getService();

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService () {
    
    let service = this.accessory.getService(this.api.hap.Service.TemperatureSensor);
    
    if(!service){
      Logger.info('Adding temperature sensor', this.accessory.displayName);
      service = this.accessory.addService(this.api.hap.Service.TemperatureSensor, this.accessory.displayName, this.accessory.context.config.subtype);
    }
    
    this.historyService = new this.FakeGatoHistoryService('room', this.accessory, {storage:'fs', path: this.api.user.storagePath() + '/fritzbox/'}); 
    
    if(this.accessory.context.polling.timer && (!this.accessory.context.polling.exclude.includes(this.accessory.context.config.type) || !this.accessory.context.polling.exclude.includes(this.accessory.context.config.subtype) || !this.accessory.context.polling.exclude.includes(this.accessory.displayName))){

      service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
        .on('change', this.handler.change.bind(this, this.accessory, 'smarthome-temperature', this.accessory.displayName, this.historyService));
 
    } else {
 
      service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
        .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.TemperatureSensor, this.api.hap.Characteristic.CurrentTemperature, 'smarthome-temperature', this.accessory.context.config.options))
        .on('change', this.handler.change.bind(this, this.accessory, 'smarthome-temperature', this.accessory.displayName, this.historyService));
 
    }
    
  }

}

module.exports = extrasService;