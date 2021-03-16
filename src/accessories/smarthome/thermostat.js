'use strict';

const Logger = require('../../helper/logger.js');

const moment = require('moment');

const timeout = (ms) => new Promise((res) => setTimeout(res, ms));

class SmarthomeThermostatAccessory {

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

  async getService () {
    
    let service = this.accessory.getService(this.api.hap.Service.HeaterCooler);
    let serviceOld = this.accessory.getService(this.api.hap.Service.Thermostat);
    
    if(serviceOld){
      Logger.info('Removing Thermostat service', this.accessory.displayName);
      service = this.accessory.removeService(serviceOld);
    }
    
    if(!service){
      Logger.info('Adding HeaterCooler service', this.accessory.displayName);
      service = this.accessory.addService(this.api.hap.Service.HeaterCooler, this.accessory.displayName, this.accessory.context.config.subtype);
    }
    
    if(this.accessory.context.config.battery){
      
      let batteryService = this.accessory.getService(this.api.hap.Service.BatteryService);
      
      if(!batteryService){
        Logger.info('Adding Battery service', this.accessory.displayName);
        batteryService = this.accessory.addService(this.api.hap.Service.BatteryService);
      }
      
      batteryService
        .setCharacteristic(this.api.hap.Characteristic.ChargingState, this.api.hap.Characteristic.ChargingState.NOT_CHARGEABLE);
      
    } else {
    
      if(this.accessory.getService(this.api.hap.Service.BatteryService))
        this.accessory.removeService(this.accessory.getService(this.api.hap.Service.BatteryService));
    
    }
    
    if (!service.testCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature))
      service.addCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature);

    if(service.getCharacteristic(this.api.hap.Characteristic.CurrentHeaterCoolerState).value > 2)
      service.getCharacteristic(this.api.hap.Characteristic.CurrentHeaterCoolerState)
        .updateValue(2);

    service.getCharacteristic(this.api.hap.Characteristic.CurrentHeaterCoolerState)
      .setProps({
        maxValue: 2,      
        minValue: 0,        
        validValues: [0, 1, 2]
      });
    
    service.getCharacteristic(this.api.hap.Characteristic.TargetHeaterCoolerState)
      .updateValue(1);

    service.getCharacteristic(this.api.hap.Characteristic.TargetHeaterCoolerState)
      .setProps({
        maxValue: 1,
        minValue: 1,        
        validValues: [1]
      });
      
    let minValue = 8;
    let maxValue = 28;
    
    service.getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature)
      .setProps({
        minValue: 8,
        maxValue: 28,
        minStep: 0.5
      });
    
    if (service.getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature).value < minValue)
      service.getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature)
        .updateValue(minValue);
        
    if (service.getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature).value > maxValue)
      service.getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature)
        .updateValue(maxValue);
    
    service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100,
        maxValue: 100
      });
      
    if (!service.testCharacteristic(this.api.hap.Characteristic.ValvePosition))
      service.addCharacteristic(this.api.hap.Characteristic.ValvePosition);
    
    this.historyService = new this.FakeGatoHistoryService('thermo', this.accessory, {storage:'fs', path: this.api.user.storagePath() + '/fritzbox/', disableTimer:true}); 
    
    await timeout(250); //wait for historyService to load
    
    if(this.accessory.context.polling.timer && (!this.accessory.context.polling.exclude.includes(this.accessory.context.config.type) && !this.accessory.context.polling.exclude.includes(this.accessory.context.config.subtype) && !this.accessory.context.polling.exclude.includes(this.accessory.displayName))){

      service.getCharacteristic(this.api.hap.Characteristic.Active)
        .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.HeaterCooler, this.api.hap.Characteristic.Active, 'smarthome-thermostat', 'state'));
        
      service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
        .on('change', this.handler.change.bind(this, this.accessory, this.accessory.context.config.subtype, this.accessory.displayName, this.historyService));

      service.getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature)
        .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.HeaterCooler, this.api.hap.Characteristic.HeatingThresholdTemperature, 'smarthome-thermostat', 'temperature'))
        .on('change', this.handler.change.bind(this, this.accessory, this.accessory.context.config.subtype, this.accessory.displayName, this.historyService));
        
      service.getCharacteristic(this.api.hap.Characteristic.ValvePosition)
        .on('change', this.handler.change.bind(this, this.accessory, this.accessory.context.config.subtype, this.accessory.displayName, this.historyService));
 
    } else {
 
      service.getCharacteristic(this.api.hap.Characteristic.CurrentHeatingCoolingState)
        .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.HeaterCooler, false, this.accessory.context.config.subtype, false));
        
      service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
        .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.HeaterCooler, false, this.accessory.context.config.subtype, false))
        .on('change', this.handler.change.bind(this, this.accessory, this.accessory.context.config.subtype, this.accessory.displayName, this.historyService));
        
      service.getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature)
        .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.HeaterCooler, false, this.accessory.context.config.subtype, false))
        .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.HeaterCooler, this.api.hap.Characteristic.HeatingThresholdTemperature, 'smarthome-thermostat', 'temperature'))
        .on('change', this.handler.change.bind(this, this.accessory, this.accessory.context.config.subtype, this.accessory.displayName, this.historyService));
        
      service.getCharacteristic(this.api.hap.Characteristic.ValvePosition)
        .on('change', this.handler.change.bind(this, this.accessory, this.accessory.context.config.subtype, this.accessory.displayName, this.historyService));
 
    }
    
    this.refreshHistory(service);
    
  }
  
  async refreshHistory(service){ 

    let currentState = service.getCharacteristic(this.api.hap.Characteristic.CurrentHeaterCoolerState).value;  
    let currentTemp = service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature).value; 
    let targetTemp = service.getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature).value; 
      
    let valvePos = currentTemp <= targetTemp && currentState !== 0
      ? Math.round(((targetTemp - currentTemp) >= 5 ? 100 : (targetTemp - currentTemp) * 20))
      : 0;
      
    this.historyService.addEntry({
      time: moment().unix(), 
      currentTemp: currentTemp, 
      setTemp: targetTemp, 
      valvePosition: valvePos
    });
    
    setTimeout(() => {
      this.refreshHistory(service);
    }, 10 * 60 * 1000);
    
  }

}

module.exports = SmarthomeThermostatAccessory;