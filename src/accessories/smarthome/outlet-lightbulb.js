'use strict';

const Logger = require('../../helper/logger.js');

const moment = require('moment');

const timeout = (ms) => new Promise((res) => setTimeout(res, ms));

class SmarthomeOutletLightbulbAccessory {

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
    
    let serviceOutlet = this.accessory.getService(this.api.hap.Service.Outlet);
    let serviceLightbulb = this.accessory.getService(this.api.hap.Service.Lightbulb);
    let serviceTemp = this.accessory.getService(this.api.hap.Service.TemperatureSensor);
    let serviceSwitch = this.accessory.getService(this.api.hap.Service.Switch);
    
    if(serviceSwitch){
      Logger.info('Removing Switch service', this.accessory.displayName);
      this.accessory.removeService(serviceSwitch);
    }
        
    if(!serviceOutlet){
      Logger.info('Adding Outlet service', this.accessory.displayName);
      serviceOutlet = this.accessory.addService(this.api.hap.Service.Outlet, this.accessory.displayName, this.accessory.context.config.subtype);
    }
    
    if(!serviceLightbulb){
      Logger.info('Adding Lightbulb service', this.accessory.displayName);
      serviceLightbulb = this.accessory.addService(this.api.hap.Service.Lightbulb, this.accessory.displayName, this.accessory.context.config.subtype);
    } 
    
    if(this.accessory.context.config.temperature){
    
      if(!serviceTemp){
        Logger.info('Adding Temperature service', this.accessory.displayName);
        serviceTemp = this.accessory.addService(this.api.hap.Service.TemperatureSensor, this.accessory.displayName, this.accessory.context.config.subtype);
      }
      
      serviceTemp.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
        .setProps({
          minValue: -100,
          maxValue: 100
        });  
    
    } 
    
    if(this.accessory.context.config.brightness){
      if(!serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Brightness))
        serviceLightbulb.addCharacteristic(this.api.hap.Characteristic.Brightness);  
    } else {
      if(serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Brightness) && !this.accessory.context.config.color)
        serviceLightbulb.removeCharacteristic(serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.Brightness));  
    }

    if(this.accessory.context.config.color){
    
      if(!serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Brightness))
        serviceLightbulb.addCharacteristic(this.api.hap.Characteristic.Brightness);  
   
      if(!serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Hue))
        serviceLightbulb.addCharacteristic(this.api.hap.Characteristic.Hue); 
   
      if(!serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Saturation))
        serviceLightbulb.addCharacteristic(this.api.hap.Characteristic.Saturation);
   
      if(!serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.ColorTemperature))
        serviceLightbulb.addCharacteristic(this.api.hap.Characteristic.ColorTemperature); 
        
      serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.ColorTemperature)
        .setProps({
          minValue: 140,
          maxValue: 500
        });               
      
      if(this.api.versionGreaterOrEqual && this.api.versionGreaterOrEqual('v1.3.0-beta.23')){
    
        this.adaptiveLightingController  = new this.api.hap.AdaptiveLightingController(serviceLightbulb, {
          controllerMode: this.api.hap.AdaptiveLightingControllerMode.AUTOMATIC,
        });
        
        this.accessory.configureController(this.adaptiveLightingController);
        this.accessory.adaptiveLightingController = this.adaptiveLightingController;
      
      }
    
    } else {
    
      if(serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Brightness))
        serviceLightbulb.removeCharacteristic(serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.Brightness));   
   
      if(serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Hue))
        serviceLightbulb.removeCharacteristic(serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.Hue));   
   
      if(serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Saturation))
        serviceLightbulb.removeCharacteristic(serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.Saturation));  
   
      if(serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.ColorTemperature))
        serviceLightbulb.removeCharacteristic(serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.ColorTemperature));    
    
    }
    
    if(!serviceOutlet.testCharacteristic(this.api.hap.Characteristic.CurrentConsumption))
      serviceOutlet.addCharacteristic(this.api.hap.Characteristic.CurrentConsumption);
        
    if(!serviceOutlet.testCharacteristic(this.api.hap.Characteristic.TotalConsumption))
      serviceOutlet.addCharacteristic(this.api.hap.Characteristic.TotalConsumption);
      
    if(!serviceOutlet.testCharacteristic(this.api.hap.Characteristic.Volts))
      serviceOutlet.addCharacteristic(this.api.hap.Characteristic.Volts);
      
    if(!serviceOutlet.testCharacteristic(this.api.hap.Characteristic.Amperes))
      serviceOutlet.addCharacteristic(this.api.hap.Characteristic.Amperes);
      
    if(!serviceOutlet.testCharacteristic(this.api.hap.Characteristic.ResetTotal))
      serviceOutlet.addCharacteristic(this.api.hap.Characteristic.ResetTotal);
  
    this.historyService = new this.FakeGatoHistoryService('energy', this.accessory, {storage:'fs', path: this.api.user.storagePath() + '/fritzbox/', disableTimer:true});
    
    await timeout(250); //wait for historyService to load
    
    serviceOutlet.getCharacteristic(this.api.hap.Characteristic.CurrentConsumption)
      .on('change', this.handler.change.bind(this, this.accessory, this.accessory.context.config.subtype, this.accessory.displayName, this.historyService));
    
    serviceOutlet.getCharacteristic(this.api.hap.Characteristic.ResetTotal)
      .on('set', (value,callback) => {
       
        Logger.info('Resetting FakeGato..', this.accessory.displayName);
        
        const now = Math.round(new Date().valueOf() / 1000); 
        const epoch = Math.round(new Date('2001-01-01T00:00:00Z').valueOf() / 1000);
        
        serviceOutlet.getCharacteristic(this.api.hap.Characteristic.ResetTotal)
          .updateValue(now - epoch);
  
        serviceOutlet.getCharacteristic(this.api.hap.Characteristic.TotalConsumption)
          .updateValue(0);
      
        callback(null);
    
      });
    
    if(this.accessory.context.polling.timer && (!this.accessory.context.polling.exclude.includes(this.accessory.context.config.type) && !this.accessory.context.polling.exclude.includes(this.accessory.context.config.subtype) && !this.accessory.context.polling.exclude.includes(this.accessory.displayName))){
 
      if(!this.accessory.context.config.readOnly){
  
        serviceOutlet.getCharacteristic(this.api.hap.Characteristic.On)
          .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Outlet, this.api.hap.Characteristic.On, this.accessory.context.config.subtype, 'on'));
  
      } else {
  
        serviceOutlet.getCharacteristic(this.api.hap.Characteristic.On)
          .on('set', (state, callback) => {
          
            Logger.info('Can not be switched ' + (state ? 'ON' : 'OFF') + ' - "readOnly" is active!', this.accessory.displayName);
          
            setTimeout(() => {
            
              serviceOutlet
                .getCharacteristic(this.api.hap.Characteristic.On)
                .updateValue(!state);
            
            }, 1000);
            
            callback(null);
          
          });
  
      }
 
    } else {
    
      if(!this.accessory.context.config.readOnly){
   
        serviceOutlet.getCharacteristic(this.api.hap.Characteristic.On)
          .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Outlet, this.api.hap.Characteristic.On, this.accessory.context.config.subtype, 'on'))
          .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Outlet, this.api.hap.Characteristic.On, this.accessory.context.config.subtype, 'on'));
   
      } else {
      
        serviceOutlet.getCharacteristic(this.api.hap.Characteristic.On)
          .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Outlet, this.api.hap.Characteristic.On, this.accessory.context.config.subtype, 'on'))
          .on('set', (state, callback) => {
          
            Logger.info('Can not be switched ' + (state ? 'ON' : 'OFF') + ' - "readOnly" is active!', this.accessory.displayName);
          
            setTimeout(() => {
            
              serviceOutlet
                .getCharacteristic(this.api.hap.Characteristic.On)
                .updateValue(!state);
            
            }, 1000);
            
            callback(null);
          
          });
   
      }
 
    }
    
    if(this.accessory.context.config.brightness)
      serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.Brightness)
        .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Lightbulb, this.api.hap.Characteristic.Brightness, this.accessory.context.config.subtype, 'brightness'));  
        
    if(this.accessory.context.config.color){
    
      serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.ColorTemperature)    
        .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Lightbulb, this.api.hap.Characteristic.ColorTemperature, this.accessory.context.config.subtype, 'temperature'));  
   
      serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.Saturation)
        .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Lightbulb, this.api.hap.Characteristic.Saturation, this.accessory.context.config.subtype, 'color'));  
   
    } 
    
    this.refreshHistory(serviceOutlet);
    
  }
  
  async refreshHistory(serviceOutlet){ 
    
    let state = serviceOutlet.getCharacteristic(this.api.hap.Characteristic.CurrentConsumption).value;
    
    this.historyService.addEntry({
      time: moment().unix(), 
      power: state || 0
    });
    
    setTimeout(() => {
      this.refreshHistory(serviceOutlet);
    }, 10 * 60 * 1000);
    
  }

}

module.exports = SmarthomeOutletLightbulbAccessory;