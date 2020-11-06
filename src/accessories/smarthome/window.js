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
    
    let service = this.accessory.getService(this.api.hap.Service.ContactSensor);
    
    if(!service){
      Logger.info('Adding window (contact) sensor', this.accessory.displayName);
      service = this.accessory.addService(this.api.hap.Service.ContactSensor, this.accessory.displayName, this.accessory.context.config.subtype);
    }
    
    if (!service.testCharacteristic(this.api.hap.Characteristic.LastActivation))
      service.addCharacteristic(this.api.hap.Characteristic.LastActivation);
    
    if (!service.testCharacteristic(this.api.hap.Characteristic.TimesOpened))
      service.addCharacteristic(this.api.hap.Characteristic.TimesOpened);

    if (!service.testCharacteristic(this.api.hap.Characteristic.ResetTotal))
      service.addCharacteristic(this.api.hap.Characteristic.ResetTotal);   
    
    if (!service.testCharacteristic(this.api.hap.Characteristic.OpenDuration))
      service.addCharacteristic(this.api.hap.Characteristic.OpenDuration);
    
    if (!service.testCharacteristic(this.api.hap.Characteristic.ClosedDuration))
      service.addCharacteristic(this.api.hap.Characteristic.ClosedDuration);
    
    const now = Math.round(new Date().valueOf() / 1000); 
    const epoch = Math.round(new Date('2001-01-01T00:00:00Z').valueOf() / 1000);
    
    service.getCharacteristic(this.api.hap.Characteristic.ResetTotal)
      .setValue(now - epoch)
      .on('set', (value,callback) => {
        Logger.info(this.accessory.displayName + ': Resetting FakeGato..');
  
        this.accessory.context.timesOpened = 0;
  
        service.getCharacteristic(this.api.hap.Characteristic.TimesOpened)
          .updateValue(this.accessory.context.timesOpened);
      
        callback(null);
      });
    
    this.historyService = new this.FakeGatoHistoryService('door', this.accessory, {storage:'fs', path: this.api.user.storagePath() + '/fritzbox/'}); 
    
    if(this.accessory.context.polling.timer && (!this.accessory.context.polling.exclude.includes(this.accessory.context.config.type) && !this.accessory.context.polling.exclude.includes(this.accessory.context.config.subtype) && !this.accessory.context.polling.exclude.includes(this.accessory.displayName))){
 
      service.getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
        .on('change', this.handler.change.bind(this, this.accessory, 'smarthome-window', this.accessory.displayName, this.historyService));
 
    } else {
 
      service.getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
        .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.ContactSensor, this.api.hap.Characteristic.ContactSensorState, 'smarthome-window', this.accessory.context.config.options))
        .on('change', this.handler.change.bind(this, this.accessory, 'smarthome-window', this.accessory.displayName, this.historyService));
 
    }
    
  }

}

module.exports = extrasService;