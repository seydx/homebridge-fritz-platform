'use strict';

const HomeKitTypes = require('../types/types.js');
const EveTypes = require('../types/eve.js');
const LogUtil = require('../../lib/LogUtil.js');
const packageFile = require('../../package.json');
const request = require('request');
const moment = require('moment');

var Accessory, Service, Characteristic, UUIDGen, PlatformAccessory, FakeGatoHistoryService;

const pluginName = 'homebridge-fritz-platform';
const platformName = 'FritzPlatform';

class Fritz_Box {
  constructor (platform, parameter, type, publish) {

    // HB
    PlatformAccessory = platform.api.platformAccessory;
    Accessory = platform.api.hap.Accessory;
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;
    UUIDGen = platform.api.hap.uuid;
    HomeKitTypes.registerWith(platform.api.hap);
    EveTypes.registerWith(platform.api.hap);
    FakeGatoHistoryService = require('fakegato-history')(platform.api);

    this.platform = platform;
    this.log = platform.log;
    this.logger = new LogUtil(null, platform.log);
    this.api = platform.api;
    this.config = platform.config;
    this.accessories = platform.accessories;
    this.HBpath = platform.HBpath;

    if(publish){
      this.addAccessory(parameter,type);
    } else {
      this.getService(parameter,type); 
    }

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Add Accessories
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  addAccessory (parameter, type) {
    const self = this;
    let name = parameter.name;
    let deviceType, accessoryType; 

    switch(type){
      case 'switch':
        deviceType = Accessory.Categories.OUTLET;
        accessoryType = Service.Outlet;
        break;
      case 'contact':
        deviceType = Accessory.Categories.SENSOR;
        accessoryType = Service.ContactSensor;
        break;
      case 'thermo':
        deviceType = Accessory.Categories.THERMOSTAT;
        accessoryType = Service.Thermostat;
        break;
      case 'temp':
        deviceType = Accessory.Categories.SENSOR;
        accessoryType = Service.TemperatureSensor;
        break;
      case 'window':
        deviceType = Accessory.Categories.SENSOR;
        accessoryType = Service.ContactSensor;
        break;
      default:
        self.logger.warn('Can not detect type of SmartHome accessory! ' + ' (' + type + ')');
        return;
    }

    this.logger.initinfo('Publishing new accessory: ' + name);

    let accessory = this.accessories[name];
    const uuid = UUIDGen.generate(name);

    accessory = new PlatformAccessory(name, uuid, deviceType);
    accessory.addService(accessoryType, name);
    if(type=='thermo')accessory.addService(Service.BatteryService);

    // Setting reachable to true
    accessory.reachable = true;
    accessory.context = {};

    accessory.context.accType = parameter.accType;
    accessory.context.type = parameter.type;
    accessory.context.ain = parameter.ain;
    accessory.context.devices = parameter.devices;

    switch(type){
      case 'switch':
        accessory.context.lastSwitchState = false;
        break;
      case 'contact':
        accessory.context.lastSensorState = 0;
        //EVE
        accessory.context.lastActivation = 0;
        accessory.context.timesOpened = 0;
        accessory.context.closeDuration = 0;
        accessory.context.openDuration = 0;
        break;
      case 'thermo':
        accessory.context.lastThermoCurrentState = 0;
        accessory.context.lastThermoTargetState = 0;
        accessory.context.lastThermoCurrentTemp = 0;
        accessory.context.lastThermoTargetTemp = 0;
        accessory.context.unit = parameter.unit;
        accessory.context.heatValue = parameter.heatValue||5;
        accessory.context.coolValue = parameter.coolValue||5;
        break;
      case 'temp':
        accessory.context.lastTemp = 0;
        accessory.context.unit = parameter.unit;
        break;
      case 'window':
        accessory.context.lastWindowState = 0;
        //EVE
        accessory.context.lastWindowActivation = 0;
        accessory.context.timesWindowOpened = 0;
        accessory.context.closeWindowDuration = 0;
        accessory.context.openWindowDuration = 0;
        break;
      default:
        self.logger.warn('Can not detect type of SmartHome accessory! ' + ' (' + type + ')');
        return;
    }
    
    let serial;
    if(type=='temp'){
      serial='-T';
    } else if(type=='window'){
      serial='-W';
    }

    //AccessoryInformation
    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, accessory.displayName)
      .setCharacteristic(Characteristic.Identify, accessory.displayName)
      .setCharacteristic(Characteristic.Manufacturer, 'SeydX')
      .setCharacteristic(Characteristic.Model, 'SmartHome')
      .setCharacteristic(Characteristic.SerialNumber, parameter.ain+(serial?serial:''))
      .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

    // Publish
    this.platform.api.registerPlatformAccessories(pluginName, platformName, [accessory]);

    // Cache
    this.accessories[name] = accessory;

    self.getService(accessory, type);

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService (accessory, type) {
    const self = this;
    
    let serial;
    if(type=='temp'){
      serial='-T';
    } else if(type=='window'){
      serial='-W';
    }

    //Refresh AccessoryInformation
    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, accessory.displayName)
      .setCharacteristic(Characteristic.Identify, accessory.displayName)
      .setCharacteristic(Characteristic.Manufacturer, 'SeydX')
      .setCharacteristic(Characteristic.Model, 'SmartHome')
      .setCharacteristic(Characteristic.SerialNumber, accessory.context.ain+(serial?serial:''))
      .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

    accessory.on('identify', function (paired, callback) {
      self.logger.info(accessory.displayName + ': Hi!');
      callback();
    });

    let service, device, battery;
    for(const i in accessory.context.devices){
      if(accessory.context.devices[i].config.master){
        device = accessory.context.devices[i];
      }
    }
    switch(type){
      case 'temp':
        service = accessory.getService(Service.TemperatureSensor);
        service.getCharacteristic(Characteristic.CurrentTemperature)
          .updateValue(accessory.context.lastTemp)
          .on('change', self.refreshData.bind(this, accessory, service, type));
        self.historyService = new FakeGatoHistoryService('weather', accessory, {storage:'fs',path:self.HBpath, disableTimer: false, disableRepeatLastData:false});
        break;
      case 'window':
        service = accessory.getService(Service.ContactSensor);
        if (!service.testCharacteristic(Characteristic.LastActivation))service.addCharacteristic(Characteristic.LastActivation);
        service.getCharacteristic(Characteristic.LastActivation)
          .updateValue(accessory.context.lastWindowActivation);
      
        if (!service.testCharacteristic(Characteristic.TimesOpened))service.addCharacteristic(Characteristic.TimesOpened);
        service.getCharacteristic(Characteristic.TimesOpened)
          .updateValue(accessory.context.timesWindowOpened);

        if (!service.testCharacteristic(Characteristic.OpenDuration))service.addCharacteristic(Characteristic.OpenDuration);
        service.getCharacteristic(Characteristic.OpenDuration)
          .updateValue(accessory.context.openWindowDuration);

        if (!service.testCharacteristic(Characteristic.ClosedDuration))service.addCharacteristic(Characteristic.ClosedDuration);
        service.getCharacteristic(Characteristic.ClosedDuration)
          .updateValue(accessory.context.closeWindowDuration);
        
        service.getCharacteristic(Characteristic.ContactSensorState)
          .updateValue(accessory.context.lastWindowState)
          .on('change', self.refreshData.bind(this, accessory, service, type));
        
        self.historyService = new FakeGatoHistoryService('door', accessory, {storage:'fs',path:self.HBpath, disableTimer: false, disableRepeatLastData:false});
        break;
      case 'switch':
        service = accessory.getService(Service.Outlet);
        service.getCharacteristic(Characteristic.On)
          .updateValue(accessory.context.lastSwitchState)
          .on('set', self.setSwitchState.bind(this,accessory,service, device));
        service.getCharacteristic(Characteristic.OutletInUse)
          .updateValue(accessory.context.lastSwitchState);
        break;
      case 'contact':
        service = accessory.getService(Service.ContactSensor);
        if (!service.testCharacteristic(Characteristic.LastActivation))service.addCharacteristic(Characteristic.LastActivation);
        service.getCharacteristic(Characteristic.LastActivation)
          .updateValue(accessory.context.lastActivation);
      
        if (!service.testCharacteristic(Characteristic.TimesOpened))service.addCharacteristic(Characteristic.TimesOpened);
        service.getCharacteristic(Characteristic.TimesOpened)
          .updateValue(accessory.context.timesOpened);

        if (!service.testCharacteristic(Characteristic.OpenDuration))service.addCharacteristic(Characteristic.OpenDuration);
        service.getCharacteristic(Characteristic.OpenDuration)
          .updateValue(accessory.context.openDuration);

        if (!service.testCharacteristic(Characteristic.ClosedDuration))service.addCharacteristic(Characteristic.ClosedDuration);
        service.getCharacteristic(Characteristic.ClosedDuration)
          .updateValue(accessory.context.closeDuration);
        
        service.getCharacteristic(Characteristic.ContactSensorState)
          .updateValue(accessory.context.lastSensorState)
          .on('change', self.refreshData.bind(this, accessory, service, type));
        
        self.historyService = new FakeGatoHistoryService('door', accessory, {storage:'fs',path:self.HBpath, disableTimer: false, disableRepeatLastData:false});
        break;
      case 'thermo':
        service = accessory.getService(Service.Thermostat);
        battery = accessory.getService(Service.BatteryService);

        service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
          .updateValue(accessory.context.lastThermoCurrentState);

        service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
          .updateValue(accessory.context.lastThermoTargetState)
          .on('set', self.setThermostatState.bind(this, accessory,service,device));

        service.getCharacteristic(Characteristic.CurrentTemperature)
          .setProps({
            minValue: -100,
            maxValue: 100,
            minStep: 0.1,
            unit: accessory.context.unit
          })
          .updateValue(accessory.context.lastThermoCurrentTemp)
          .on('change', self.refreshData.bind(this, accessory, service, type));

        service.getCharacteristic(Characteristic.TargetTemperature)
          .setProps({
            minValue: 8,
            maxValue: 28,
            minStep: 0.5,
            unit: accessory.context.unit
          })
          .updateValue(accessory.context.lastThermoTargetTemp)
          .on('set', self.setThermostatTemp.bind(this, accessory, service, device))
          .on('change', self.refreshData.bind(this, accessory, service, type));

        service.getCharacteristic(Characteristic.TemperatureDisplayUnits)
        //.on('set', self.setTempUnit.bind(this, accessory, service))
          .updateValue(accessory.context.unit); // 0 = C ; 1 = F

        battery.getCharacteristic(Characteristic.ChargingState)
          .updateValue(2); //Not chargable

        battery.getCharacteristic(Characteristic.BatteryLevel)
          .updateValue(accessory.context.batteryLevel);

        battery.getCharacteristic(Characteristic.StatusLowBattery)
          .updateValue(accessory.context.batteryStatus);

       
        self.historyService = new FakeGatoHistoryService('weather', accessory, {storage:'fs',path:self.HBpath, disableTimer: false, disableRepeatLastData:false});
        break;
      default:
        self.logger.warn('Can not detect type of SmartHome accessory! ' + ' (' + type + ')');
        return; 
    }

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Switches
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  setSwitchState(accessory,service,device,state,callback){
    const self = this;
    if(accessory.context.newSid&&accessory.context.devPresent===1||accessory.context.devPresent==='1'){
      let sid = accessory.context.newSid;
      let cmd = state?'setswitchon':'setswitchoff';
      let url = 'http://'+device.config.host+'/webservices/homeautoswitch.lua?ain='+accessory.context.ain+'&switchcmd='+cmd+'&sid='+sid;
      let opt = {
        uri: url,
        method: 'GET',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false
      };
      request(opt,function(error, response, body) {
        if (!error && response.statusCode == 200) {
          self.logger.info(accessory.displayName+': '+(state?'On':'Off'));
          //accessory.context.lastSwitchState = state;
          accessory.context.newState = state;
          service.getCharacteristic(Characteristic.On).updateValue(state);
          service.getCharacteristic(Characteristic.OutletInUse).updateValue(state);
          callback(null,state);
        } else {
          self.logger.errorinfo(accessory.displayName + ': An error occured while setting new switch state!');
          let showError = {
            error: error?error.errno:response.statusMessage,
            errorCode: error?error.code:response.statusCode
          };
          self.logger.errorinfo(JSON.stringify(showError,null,4));
          setTimeout(function(){service.getCharacteristic(Characteristic.On).updateValue(accessory.context.lastSwitchState);},500);
          setTimeout(function(){service.getCharacteristic(Characteristic.OutletInUse).updateValue(accessory.context.lastSwitchState);},500);
          callback(null, state?false:true);
        }
      });
    } else {
      if(accessory.context.devPresent===0||accessory.context.devPresent==='0'){
        self.logger.warn(accessory.displayName + ': Device not present!');
      } else {
        self.logger.warn(accessory.displayName + ': SID dont fetched yet, try again..');
      }
      setTimeout(function(){service.getCharacteristic(Characteristic.On).updateValue(accessory.context.lastSwitchState);},500);
      setTimeout(function(){service.getCharacteristic(Characteristic.OutletInUse).updateValue(accessory.context.lastSwitchState);},500);
      callback(null, state?false:true);
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // FakeGato
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  
  refreshData(accessory, service, type, value){
    const self = this;   
    switch(type){
      case 'temp':
        self.historyService.addEntry({time: moment().unix(), temp:value.newValue, pressure:0, humidity:0});
        self.logger.debug(accessory.displayName + ': New entry: ' + accessory.context.lastTemp);
        break;
      case 'window':
        self.historyService.addEntry({time: moment().unix(), status:value.newValue});
        self.logger.debug(accessory.displayName + ': New entry: ' + accessory.context.lastWindowState);
        if(value.newValue){
          accessory.context.timesWindowOpened += 1;
          accessory.context.lastWindowActivation = moment().unix() - self.historyService.getInitialTime();
          accessory.context.closeWindowDuration = moment().unix() - self.historyService.getInitialTime();
          service.getCharacteristic(Characteristic.LastActivation).updateValue(accessory.context.lastWindowActivation);
          service.getCharacteristic(Characteristic.ClosedDuration).updateValue(accessory.context.closeWindowDuration);
          service.getCharacteristic(Characteristic.TimesOpened).updateValue(accessory.context.timesWindowOpened);
        } else {
          accessory.context.openWindowDuration = moment().unix() - self.historyService.getInitialTime();
          service.getCharacteristic(Characteristic.OpenDuration).updateValue(accessory.context.openWindowDuration);
        }
        break;
      case 'contact':
        self.historyService.addEntry({time: moment().unix(), status:value.newValue});
        self.logger.debug(accessory.displayName + ': New entry: ' + accessory.context.lastSensorState);
        if(value.newValue){
          accessory.context.timesOpened += 1;
          accessory.context.lastActivation = moment().unix() - self.historyService.getInitialTime();
          accessory.context.closeDuration = moment().unix() - self.historyService.getInitialTime();
          service.getCharacteristic(Characteristic.LastActivation).updateValue(accessory.context.lastActivation);
          service.getCharacteristic(Characteristic.ClosedDuration).updateValue(accessory.context.closeDuration);
          service.getCharacteristic(Characteristic.TimesOpened).updateValue(accessory.context.timesOpened);
        } else {
          accessory.context.openDuration = moment().unix() - self.historyService.getInitialTime();
          service.getCharacteristic(Characteristic.OpenDuration).updateValue(accessory.context.openDuration);
        }
        break;
      case 'thermo':
        self.historyService.addEntry({time: moment().unix(), temp:accessory.context.lastThermoCurrentTemp, pressure:0, humidity:0});
        self.logger.debug(accessory.displayName + ': New entry: ' + accessory.context.lastThermoCurrentTemp + ' - and - ' + accessory.context.lastThermoTargetTemp);
        break;
      default:
        //err
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Thermostats
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  setThermostatState(accessory,service,device,state,callback){
    const self = this;
    let cmd;
    if(accessory.context.newSid&&accessory.context.devPresent===1||accessory.context.devPresent==='1'){
      let sid = accessory.context.newSid;
      switch(state){
        case 0: //OFF
          accessory.context.lastThermoTargetTemp = accessory.context.lastThermoCurrentTemp;
          accessory.context.lastThermoTargetState = 0;
          accessory.context.lastThermoCurrentState = 0;
          cmd = 'sethkrtsoll&param=253';
          break;
        case 1: //HEAT
          accessory.context.lastThermoTargetTemp = accessory.context.lastThermoCurrentTemp + accessory.context.heatValue;
          accessory.context.lastThermoTargetState = 1;
          accessory.context.lastThermoCurrentState = 1;
          cmd = 'sethkrtsoll&param='+accessory.context.lastThermoTargetTemp*2;
          break;
        case 2: //COOL
          accessory.context.lastThermoTargetTemp = accessory.context.lastThermoCurrentTemp - accessory.context.coolValue;
          accessory.context.lastThermoTargetState = 2;
          accessory.context.lastThermoCurrentState = 2;
          cmd = 'sethkrtsoll&param='+accessory.context.lastThermoTargetTemp*2;
          break;
      }
      let url = 'http://'+device.config.host+'/webservices/homeautoswitch.lua?ain='+accessory.context.ain+'&switchcmd='+cmd+'&sid='+sid;
      let opt = {
        uri: url,
        method: 'GET',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false
      }; 
      request(opt,function(error, response, body) {
        if (!error && response.statusCode == 200) {
          switch(state){
            case 0: //OFF
              self.logger.info(accessory.displayName + ': OFF');
              break;
            case 1: //HEAT
              self.logger.info(accessory.displayName + ': Heating to ' + accessory.context.lastThermoTargetTemp);
              break;
            case 2: //COOL
              self.logger.info(accessory.displayName + ': Cooling to ' + accessory.context.lastThermoTargetTemp);
              break;
          }
          accessory.context.newState = state;
          accessory.context.newCurrState = state;
          accessory.context.newTarTemp = accessory.context.lastThermoTargetTemp;
          service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(state);
          service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(state); 
          service.getCharacteristic(Characteristic.TargetTemperature).updateValue(accessory.context.lastThermoTargetTemp);
          callback(null, state);
        } else {
          self.logger.errorinfo(accessory.displayName + ': An error occured while setting new target state!');
          let showError = {
            error: error?error.errno:response.statusMessage,
            errorCode: error?error.code:response.statusCode
          };
          self.logger.errorinfo(JSON.stringify(showError,null,4));
          setTimeout(function(){service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(accessory.context.lastThermoTargetState);},500);
          callback(null, accessory.context.lastThermoTargetState);
        }         
      });   
    } else {
      if(accessory.context.devPresent===0||accessory.context.devPresent==='0'){
        self.logger.warn(accessory.displayName + ': Device not present!');
      } else {
        self.logger.warn(accessory.displayName + ': SID dont fetched yet, try again..');
      }
      setTimeout(function(){service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(accessory.context.lastThermoTargetState);},500);
      callback(null, accessory.context.lastThermoTargetState);
    }
  }

  setThermostatTemp(accessory,service,device,value,callback){
    const self = this;
    if(accessory.context.newSid&&accessory.context.devPresent===1||accessory.context.devPresent==='1'){
      let sid = accessory.context.newSid;   
      let cmd = 'sethkrtsoll&param='+(value*2);
      let url = 'http://'+device.config.host+'/webservices/homeautoswitch.lua?ain='+accessory.context.ain+'&switchcmd='+cmd+'&sid='+sid;
      let opt = {
        uri: url,
        method: 'GET',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false
      };       
      request(opt,function(error, response, body) {
        if (!error && response.statusCode == 200) {
          self.logger.info(accessory.displayName + ': Target temperature: ' + value);
          accessory.context.lastThermoTargetTemp = value;
          if(accessory.context.lastThermoTargetTemp <= accessory.context.lastThermoCurrentTemp){
            accessory.context.lastThermoTargetState = 2;
            accessory.context.lastThermoCurrentState = 2; 
          } else {
            accessory.context.lastThermoTargetState = 1;
            accessory.context.lastThermoCurrentState = 1; 
          } 
          accessory.context.newState = accessory.context.lastThermoTargetState;
          accessory.context.newCurrState = accessory.context.lastThermoCurrentTemp;
          accessory.context.newTarTemp = value;
          service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(accessory.context.lastThermoTargetState);
          service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(accessory.context.lastThermoCurrentState); 
          service.getCharacteristic(Characteristic.TargetTemperature).updateValue(accessory.context.lastThermoTargetTemp);
          callback(null, value);
        } else {
          self.logger.errorinfo(accessory.displayName + ': An error occured while setting target temp!');
          let showError = {
            error: error?error.errno:response.statusMessage,
            errorCode: error?error.code:response.statusCode
          };
          self.logger.errorinfo(JSON.stringify(showError,null,4));
          setTimeout(function(){service.getCharacteristic(Characteristic.TargetTemperature).updateValue(accessory.context.lastThermoTargetTemp);},500);
          callback(null, accessory.context.lastThermoTargetTemp);
        }           
      });       
    } else {
      if(accessory.context.devPresent===0||accessory.context.devPresent==='0'){
        self.logger.warn(accessory.displayName + ': Device not present!');
      } else {
        self.logger.warn(accessory.displayName + ': SID dont fetched yet, try again..');
      }
      setTimeout(function(){service.getCharacteristic(Characteristic.TargetTemperature).updateValue(accessory.context.lastThermoTargetTemp);},500);
      callback(null, accessory.context.lastThermoTargetTemp);
    }
  }
  
}

module.exports = Fritz_Box;
