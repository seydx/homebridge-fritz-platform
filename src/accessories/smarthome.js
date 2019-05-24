'use strict';

const HomeKitTypes = require('../types/types.js');
const EveTypes = require('../types/eve.js');

const moment = require('moment');

var Service, Characteristic, FakeGatoHistoryService;

const timeout = ms => new Promise(res => setTimeout(res, ms));

class SmarthomeAccessory {
  constructor (platform, accessory, device, smarthome) {

    // HB
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;
    
    HomeKitTypes.registerWith(platform.api.hap);
    EveTypes.registerWith(platform.api.hap);
    FakeGatoHistoryService = require('fakegato-history')(platform.api);

    this.platform = platform;
    this.log = platform.log;
    this.logger = platform.logger;
    this.debug = platform.debug;
    this.api = platform.api;
    this.config = platform.config;
    this.accessories = platform.accessories;
    this.HBpath = platform.HBpath;
    
    this.smarthome = smarthome;
    this.device = device;
    
    this.accessory = accessory;

    if(this.accessory.context.devType === 'switch'){
    
      this.getSwitchService();
    
    } else if(this.accessory.context.devType === 'temperature'){
    
      this.getTemperatureService();
    
    } else if(this.accessory.context.devType === 'thermostat'){
    
      this.settedState = 0;
      this.ruleSetState = 0;
    
      this.getThermostatService();
    
    } else {
    
      this.getContactService();
      
    }

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getContactService(){
  
    this.mainService = this.accessory.getService(Service.ContactSensor);
  
    if (!this.mainService.testCharacteristic(Characteristic.LastActivation))
      this.mainService.addCharacteristic(Characteristic.LastActivation);
    
    if (!this.mainService.testCharacteristic(Characteristic.TimesOpened))
      this.mainService.addCharacteristic(Characteristic.TimesOpened);
        
    if (!this.mainService.testCharacteristic(Characteristic.OpenDuration))
      this.mainService.addCharacteristic(Characteristic.OpenDuration);
        
    if (!this.mainService.testCharacteristic(Characteristic.ClosedDuration))
      this.mainService.addCharacteristic(Characteristic.ClosedDuration);
        
    this.mainService.getCharacteristic(Characteristic.ContactSensorState)
      .on('change', this.refreshData.bind(this));
  
    this.historyService = new FakeGatoHistoryService('door', this.accessory, {storage:'fs',path:this.HBpath, disableTimer: false, disableRepeatLastData:false});
  
    this.getStates();
  
  }
  
  getSwitchService(){
  
    this.mainService = this.accessory.getService(Service.Outlet);
  
    this.mainService.getCharacteristic(Characteristic.On)
      .on('set', this.setSwitchState.bind(this));
      
    this.getStates();
  
  }
  
  getTemperatureService(){
  
    this.mainService = this.accessory.getService(Service.TemperatureSensor);
  
    this.mainService.getCharacteristic(Characteristic.CurrentTemperature)
      .on('change', this.refreshData.bind(this));
  
    this.historyService = new FakeGatoHistoryService('weather', this.accessory, {storage:'fs',path:this.HBpath, disableTimer: false, disableRepeatLastData:false});
  
    this.getStates();
  
  }
  
  getThermostatService(){
  
    this.mainService = this.accessory.getService(Service.Thermostat);
    this.batteryService = this.accessory.getService(Service.BatteryService);
  
    this.accessory.context.timesWindowOpened = this.accessory.context.timesWindowOpened ? this.accessory.context.timesWindowOpened : 0;
  
    this.mainService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .setProps({ maxValue: 2, validValues: [0,1,2] })
      .on('set', this.setThermostatState.bind(this));

    this.mainService.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100,
        maxValue: 100,
        minStep: 0.1,
        unit: Characteristic.Units.CELSIUS
      })
      .on('change', this.refreshData.bind(this));

    this.mainService.getCharacteristic(Characteristic.TargetTemperature)
      .setProps({
        minValue: 8,
        maxValue: 28,
        minStep: 0.5,
        unit: Characteristic.Units.CELSIUS
      })
      .on('set', this.setThermostatTemp.bind(this));
    //.on('change', this.refreshData.bind(this));

    this.mainService.getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .on('set', callback => callback());
      
    this.batteryService.getCharacteristic(Characteristic.ChargingState)
      .updateValue(2);

    this.historyService = new FakeGatoHistoryService('weather', this.accessory, {storage:'fs',path:this.HBpath, disableTimer: false, disableRepeatLastData:false});
  
    this.getStates();
  
  }
  
  async getStates(){
  
    try {
    
      let state, tstate, temp, ttemp, battery, batterylow, getSet;
      
      if(this.accessory.context.devType === 'thermostat')
        getSet = await this.getSetStatus();
      
      let device = await this.smarthome.getDevice(this.accessory.context.ain);
      
      if(device){
      
        switch(this.accessory.context.devType){
        
          case 'contact':
            
            if(device.present && device.options.alert.state[0] != ''){
             
              state = parseInt(device.options.alert.state[0]);
              
              this.mainService.getCharacteristic(Characteristic.ContactSensorState).updateValue(state);
            
            }
          
            break;
            
          case 'window':

            if(device.present && device.options.hkr.windowopenactiv[0] != ''){
             
              state = parseInt(device.options.hkr.windowopenactiv[0]);
              
              this.mainService.getCharacteristic(Characteristic.ContactSensorState).updateValue(state);
            
            }
          
            break;
            
          case 'switch':
            
            if(device.present && device.options.switch.state[0] !== ''){
             
              state = parseInt(device.options.switch.state[0]);
              
              this.mainService.getCharacteristic(Characteristic.On).updateValue(state);
              this.mainService.getCharacteristic(Characteristic.OutletInUse).updateValue(state);
            
            }
          
            break;
            
          case 'temperature':
            
            if(device.present && device.options.temperature.celsius[0] !== ''){
            
              temp = parseFloat(device.options.temperature.celsius[0])/10;
              
              this.mainService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(temp);
            
            }
          
            break;
            
          case 'thermostat':
            
            if(device.present){
            
              if(device.options.hkr.tist[0] !== '' && device.options.hkr.tsoll[0] !== ''){
              
                temp = parseFloat(device.options.hkr.tist[0])/2;
                ttemp = parseFloat(device.options.hkr.tsoll[0])/2;
                
                if((ttemp*2) === 253){
                
                  state = 0;
                  tstate = 0;
                
                } else {
                
                  if(ttemp <= temp){
                  
                    state = 2;
                    tstate = 2;
                  
                  } else {
                  
                    state = 1;
                    tstate = 1;
                  
                  }
                
                }
                
                this.mainService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(temp);
                this.mainService.getCharacteristic(Characteristic.TargetTemperature).updateValue(ttemp);
                this.mainService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(state);
               
                if(getSet)
                  this.mainService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(tstate);
                
              }
              
              if(device.options.hkr.battery[0] !== '' && device.options.hkr.batterylow[0] !== ''){
              
                battery = parseInt(device.options.hkr.battery[0]);
                batterylow = parseInt(device.options.hkr.batterylow[0]);
                
                this.batteryService.getCharacteristic(Characteristic.BatteryLevel).updateValue(battery);
                this.batteryService.getCharacteristic(Characteristic.StatusLowBattery).updateValue(batterylow);
                
              }
            
            }
          
            break;
        
        }
      
      } else {
      
        this.debug(this.accessory.displayName + ': No device with AIN: ' + this.accessory.context.ain + ' found or not intialized yet!');
     
        this.debug(this.accessory.displayName + ': Following devices are currently registered:');
        
        let devices = await this.smarthome.getAllDevices() || 'No Smarthome devices registered!';
        
        this.debug(devices);
     
      }
    
    } catch(err){
    
      this.logger.error(this.accessory.displayName + ': An error occured while polling state');

      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }
    
    } finally {
    
      setTimeout(this.getStates.bind(this), this.accessory.context.polling);
    
    }
  
  }
  
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Switches
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  async setSwitchState(state,callback){
  
    try{
    
      this.logger.info(this.accessory.displayName + ' Turn ' + (state?'on':'off'));
    
      let cmd = state?'setswitchon':'setswitchoff';
  
      await this.smarthome.sendCommand(this.accessory.displayName, this.accessory.context.ain, cmd);
    
    } catch(err){
    
      this.logger.error(this.accessory.displayName + ': An error occured while setting new switch state');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }
    
    } finally {
    
      callback();
    
    }
    
  }
  
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Thermostats
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  async setThermostatState(state,callback,context){
  
    this.ruleSetState++;

    try {
    
      this.settedState++;
    
      // from setTemp
      
      if((context && !isNaN(parseInt(context.newState))) || this.settedTemp){
      
        if(this.settedTemp){
          callback();
          return;
        }
        
        let mode, state, temp;
        
        if(context.newState === 1){
          
          mode = 'Heat Mode *';
          state = 1;
          temp = context.temp;
        
        } else if(context.newState === 2){
          
          mode = 'Cool Mode *';
          state = 2;
          temp = context.temp;
       
        } else if(context.newState === 3) {
          
          mode = 'Auto Mode not supported *';
          state = 0;
          temp = false;
       
        } else {
          
          mode = 'Off Mode *';
          state = 0;
          temp = this.mainService.getCharacteristic(Characteristic.CurrentTemperature).value;
      
        }
    
        this.logger.info(this.accessory.displayName + ': ' + mode);
        
        setTimeout(() => {
        
          this.mainService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
            .updateValue(state);
          
          this.mainService.getCharacteristic(Characteristic.TargetTemperature)
            .updateValue(temp);   
        
        }, 100);
      
        this.settedTemp = true;
      
        setTimeout(() => {
          
          this.settedTemp = false;
          
        }, 500);
        
        callback();
      
        return;
      
      } else {
      
        let cmd, temp;
      
        switch(state){
       
          case 0: //OFF
          
            this.logger.info(this.accessory.displayName + ': Off');
            cmd = 'sethkrtsoll&param=253';
        
            break;
       
          case 1: //HEAT
          
            this.logger.info(this.accessory.displayName + ': Heat');
            temp = this.mainService.getCharacteristic(Characteristic.CurrentTemperature).value + this.accessory.context.heatValue;
            cmd = 'sethkrtsoll&param=' + temp*2;
         
            break;
      
          case 2: //COOL
        
            this.logger.info(this.accessory.displayName + ': Cool');
            temp = this.mainService.getCharacteristic(Characteristic.CurrentTemperature).value + this.accessory.context.coolValue;
            cmd = 'sethkrtsoll&param=' + temp*2;
         
            break;
          
          case 3: //AUTO
        
            this.logger.info(this.accessory.displayName + ': Auto not supported');
            cmd = false;
         
            break;
          
          default:
          //
     
        }
      
        if(cmd)
          await this.smarthome.sendCommand(this.accessory.displayName, this.accessory.context.ain, cmd);
      
      
      }
    
    } catch(err){
    
      this.logger.error(this.accessory.displayName + ': An error occured while setting new thermostat state');

      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }
    
    } finally {
    
      callback();
    
    }
    
  }

  async setThermostatTemp(value,callback,context){
  
    await timeout(500);
    let targetService = this.mainService.getCharacteristic(Characteristic.TargetHeatingCoolingState).value;
  
    if(!this.ruleSetState){
  
      try {

        let tarState;

        this.logger.info(this.accessory.displayName + ': Setting new temperature: ' + value);
        
        let cmd = 'sethkrtsoll&param='+(value*2);
      
        await this.smarthome.sendCommand(this.accessory.displayName, this.accessory.context.ain, cmd);
  
        if(value < this.mainService.getCharacteristic(Characteristic.CurrentTemperature).value){
          
          tarState = 2;
       
        } else {
          
          tarState = 1;
       
        }
      
        if(context !== 'rule')  
          this.mainService.getCharacteristic(Characteristic.TargetHeatingCoolingState).setValue(tarState, undefined, {newState:tarState, temp: value});

      } catch (err){

        this.logger.error(this.accessory.displayName + ': An error occured while setting new temp!'); 

        if(err instanceof TypeError){
          console.log(err);
        } else {
          this.debug(err);
        }

      } finally {
    
        callback();
      
      }
    
    } else {
    
      this.ruleSetState = false; 
    
      if(targetService === 1 || targetService === 2){
  
        this.mainService.getCharacteristic(Characteristic.TargetTemperature).setValue(value, undefined, 'rule'); 
  
      }
    
      callback();
    
    }
  
  }
  
  async getSetStatus(){
  
    if(this.settedState){
    
      this.oldState = this.settedState; 
    
      await timeout(5000);
    
      if(this.settedState === this.oldState){
    
        this.settedState = 0;
        return true;
    
      } else {
    
        return false;
    
      }
    
    } else {
    
      return true;
    
    }
  
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // FakeGato
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  
  refreshData(value){

    switch(this.accessory.context.devType){
      
      case 'temperature':
      
        this.debug(this.accessory.displayName + ': New entry: ' + value.newValue);
        
        this.historyService.addEntry({time: moment().unix(), temp:value.newValue, pressure:0, humidity:0});
        
        break;
     
      case 'window':
      case 'contact':
        
        this.debug(this.accessory.displayName + ': New entry: ' + value.newValue);
        
        if(value.newValue){
          
          this.accessory.context.timesWindowOpened += 1;
          let lastWindowActivation = moment().unix() - this.historyService.getInitialTime();
          let closeWindowDuration = moment().unix() - this.historyService.getInitialTime();
          this.mainService.getCharacteristic(Characteristic.LastActivation).updateValue(lastWindowActivation);
          this.mainService.getCharacteristic(Characteristic.ClosedDuration).updateValue(closeWindowDuration);
          this.mainService.getCharacteristic(Characteristic.TimesOpened).updateValue(this.accessory.context.timesWindowOpened);
        
        } else {
          
          let openWindowDuration = moment().unix() - this.historyService.getInitialTime();
          this.mainService.getCharacteristic(Characteristic.OpenDuration).updateValue(openWindowDuration);
        
        }
        
        this.historyService.addEntry({time: moment().unix(), status:value.newValue});
        
        break;
      
      case 'thermostat':
        
        this.debug(this.accessory.displayName + ': New entry: ' + value.newValue);
        
        this.historyService.addEntry({time: moment().unix(), temp:value.newValue, pressure:0, humidity:0});
        
        break;
     
      default:
        //err
    
    }
 
  }
  
}

module.exports = SmarthomeAccessory;
