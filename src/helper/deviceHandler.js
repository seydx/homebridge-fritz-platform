'use strict';

const Logger = require('./logger.js');
const lua = require('./lua.js');
const aha = require('./aha.js');

const ColorUtils = require('./color-utils'); //remove if hb v1.3 is out

const fs = require('fs-extra');
const moment = require('moment');
const ping = require('ping');

const { requestXml } = require('@seydx/fritzbox/dist/lib/request');

let hostList, smarthomeList, smarthomeGroupList;

module.exports = (api, masterDevice, devices, presence, smarthome, configPath, Telegram, presenceOptions, polling, reboot) => {

  async function get(accessory, service, characteristic, target, config, callback){
    
    Logger.debug((typeof callback !== 'function' ? 'Polling' : 'Getting') + ' state (' + target + ')...', accessory.displayName); 
  
    let fritzbox = accessory.context.config.fritzbox;
    
    if(typeof callback === 'function')
      callback(null, accessory.getService(service).getCharacteristic(characteristic).value);
  
    switch (target) {
    
      case 'smarthome-switch-lightbulb': {

        let state = accessory.getService(service).getCharacteristic(characteristic).value;
        let bulbState = accessory.getService(api.hap.Service.Lightbulb).getCharacteristic(characteristic).value; 
        let brightness, temp, hue, sat, temperature;
        
        if(accessory.context.config.temperature)
          temperature = accessory.getService(api.hap.Service.TemperatureSensor).getCharacteristic(api.hap.Characteristic.CurrentTemperature).value; 
        
        if(accessory.context.config.brightness)
          accessory.context.config.brightnessValue = accessory.getService(api.hap.Service.Lightbulb).getCharacteristic(api.hap.Characteristic.Brightness).value; 
        
        if(accessory.context.config.color){
          accessory.context.config.brightnessValue = accessory.getService(api.hap.Service.Lightbulb).getCharacteristic(api.hap.Characteristic.Brightness).value; 
          accessory.context.config.tempValue = accessory.getService(api.hap.Service.Lightbulb).getCharacteristic(api.hap.Characteristic.ColorTemperature).value; 
        }
        
        try {
        
          if(!smarthomeGroupList)
            await this.refreshSmarthome(false, true);
          
          let device = smarthomeGroupList.find(device => device.name.includes(accessory.displayName));
        
          Logger.debug(device, accessory.displayName);
          
          if(device)
            accessory.context.config.ain = device.ain;
            
          if(device && device.online && device.switch){
          
            state = device.switch.state ? true : false;
            
            if(accessory.context.config.energy && device.powermeter){
              
              let currentPower = device.powermeter.power || 0;
              let totalPower = device.powermeter.energy || 0;
              let voltage = device.powermeter.voltage || 0;
              let ampere = Math.round(((currentPower/voltage) + Number.EPSILON) * 100) / 100;
              
              accessory
                .getService(service)
                .getCharacteristic(api.hap.Characteristic.OutletInUse)
                .updateValue(currentPower > 0 ? true : false);  
              
              accessory
                .getService(service)
                .getCharacteristic(api.hap.Characteristic.CurrentConsumption)
                .updateValue(currentPower);    
                
              accessory
                .getService(service)
                .getCharacteristic(api.hap.Characteristic.TotalConsumption)
                .updateValue(totalPower);   
                
              accessory
                .getService(service)
                .getCharacteristic(api.hap.Characteristic.Volts)
                .updateValue(voltage);   
                
              accessory
                .getService(service)
                .getCharacteristic(api.hap.Characteristic.Amperes)
                .updateValue(ampere);                
            
            }
          
          }
          
          if(device && device.online && device.light){
          
            bulbState = device.light.state || 0;
            
            if(device.light.brightness){
              brightness = !isNaN(device.light.brightness.levelpercentage) ? device.light.brightness.levelpercentage : null;
            }
            
            if(device.light.color){
              temp = device.light.color.temperature ? Math.round(1000000/device.light.color.temperature) : null;
              hue = !isNaN(device.light.color.hue) ? device.light.color.hue : null;
              sat = !isNaN(device.light.color.saturation) ? device.light.color.saturation/2.55 : null;
            }
          
          }
          
          if(device && device.online && device.temperature){
          
            temperature = device.temperature.value || 0;
          
          }
        
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
        
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
          
        accessory
          .getService(api.hap.Service.Lightbulb)
          .getCharacteristic(characteristic)
          .updateValue(bulbState);
          
        if(accessory.context.config.temperature){
          accessory
            .getService(api.hap.Service.TemperatureSensor)
            .getCharacteristic(api.hap.Characteristic.CurrentTemperature)
            .updateValue(temperature);
        }
          
        if(accessory.context.config.brightness && brightness !== null && brightness !== undefined && brightness !== accessory.context.config.brightnessValue){
      
          accessory
            .getService(api.hap.Service.Lightbulb)
            .getCharacteristic(api.hap.Characteristic.Brightness)
            .updateValue(brightness);
        
        }
            
        if(accessory.context.config.color){
         
          if(temp !== null && temp !== undefined){
          
            let changed = Math.abs(accessory.context.config.tempValue - temp) > 5;
          
            if(changed){
            
              //Logger.debug('Color temperature changed from outside. Disabling AdaptiveLighting.', accessory.displayName);
            
              if(api.versionGreaterOrEqual && api.versionGreaterOrEqual('v1.3.0-beta.23'))
                accessory.adaptiveLightingController.disableAdaptiveLighting(true);
                
              let colorTemperatureMired = temp; 
              let color = api.versionGreaterOrEqual && api.versionGreaterOrEqual('v1.3.0-beta.23')
                ? api.hap.ColorUtils.colorTemperatureToHueAndSaturation(colorTemperatureMired)
                : ColorUtils.colorTemperatureToHueAndSaturation(colorTemperatureMired);
                        
              accessory
                .getService(api.hap.Service.Lightbulb)
                .getCharacteristic(api.hap.Characteristic.ColorTemperature)
                .updateValue(colorTemperatureMired);
                
              accessory
                .getService(api.hap.Service.Lightbulb)
                .getCharacteristic(api.hap.Characteristic.Hue)
                .updateValue(color.hue);
            
              accessory
                .getService(api.hap.Service.Lightbulb)
                .getCharacteristic(api.hap.Characteristic.Saturation)
                .updateValue(color.saturation);
           
            }
         
          }
         
          if(hue !== null && hue !== undefined && sat !== null && sat !== undefined){
          
            //Logger.debug('Color changed from outside. Disabling AdaptiveLighting.', accessory.displayName);
          
            if(api.versionGreaterOrEqual && api.versionGreaterOrEqual('v1.3.0-beta.23'))
              accessory.adaptiveLightingController.disableAdaptiveLighting(true);
       
            accessory
              .getService(api.hap.Service.Lightbulb)
              .getCharacteristic(api.hap.Characteristic.Hue)
              .updateValue(hue);
          
            accessory
              .getService(api.hap.Service.Lightbulb)
              .getCharacteristic(api.hap.Characteristic.Saturation)
              .updateValue(sat);
   
          }
         
        }
      
        break;
      }
    
      case 'smarthome-lightbulb': {

        let state = accessory.getService(service).getCharacteristic(characteristic).value; 
        let brightness, temp, hue, sat;
        
        if(accessory.context.config.brightness)
          accessory.context.config.brightnessValue = accessory.getService(service).getCharacteristic(api.hap.Characteristic.Brightness).value; 
        
        if(accessory.context.config.color){
          accessory.context.config.brightnessValue = accessory.getService(service).getCharacteristic(api.hap.Characteristic.Brightness).value; 
          accessory.context.config.tempValue = accessory.getService(service).getCharacteristic(api.hap.Characteristic.ColorTemperature).value; 
        }
        
        try {
          
          if((!accessory.context.config.group && !smarthomeList) || (accessory.context.config.group && !smarthomeGroupList))
            await this.refreshSmarthome(false, true);
          
          let device = !accessory.context.config.group
            ? smarthomeList.find(device => device.ain.includes(accessory.context.config.ain))
            : smarthomeGroupList.find(device => device.name.includes(accessory.displayName));
        
          Logger.debug(device, accessory.displayName);
          
          if(device)
            accessory.context.config.ain = device.ain;
          
          if(device && device.online && device.light){
          
            state = device.light.state || 0;
            
            if(device.light.brightness){
              brightness = !isNaN(device.light.brightness.levelpercentage) ? device.light.brightness.levelpercentage : null;
            }
            
            if(device.light.color){
              temp = device.light.color.temperature ? Math.round(1000000/device.light.color.temperature) : null;
              hue = !isNaN(device.light.color.hue) ? device.light.color.hue : null;
              sat = !isNaN(device.light.color.saturation) ? device.light.color.saturation/2.55 : null;
            }
          
          }
        
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
        
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
          
        if(accessory.context.config.brightness && brightness !== null && brightness !== undefined && brightness !== accessory.context.config.brightnessValue){
      
          accessory
            .getService(service)
            .getCharacteristic(api.hap.Characteristic.Brightness)
            .updateValue(brightness);
        
        }
            
        if(accessory.context.config.color){
         
          if(temp !== null && temp !== undefined){
          
            let changed = Math.abs(accessory.context.config.tempValue - temp) > 5;
          
            if(changed){
            
              //Logger.debug('Color temperature changed from outside. Disabling AdaptiveLighting.', accessory.displayName);
            
              if(api.versionGreaterOrEqual && api.versionGreaterOrEqual('v1.3.0-beta.23'))
                accessory.adaptiveLightingController.disableAdaptiveLighting(true);
                
              let colorTemperatureMired = temp; 
              let color = api.versionGreaterOrEqual && api.versionGreaterOrEqual('v1.3.0-beta.23')
                ? api.hap.ColorUtils.colorTemperatureToHueAndSaturation(colorTemperatureMired)
                : ColorUtils.colorTemperatureToHueAndSaturation(colorTemperatureMired);
                        
              accessory
                .getService(service)
                .getCharacteristic(api.hap.Characteristic.ColorTemperature)
                .updateValue(colorTemperatureMired);
                
              accessory
                .getService(service)
                .getCharacteristic(api.hap.Characteristic.Hue)
                .updateValue(color.hue);
            
              accessory
                .getService(service)
                .getCharacteristic(api.hap.Characteristic.Saturation)
                .updateValue(color.saturation);
           
            }
         
          }
         
          if(hue !== null && hue !== undefined && sat !== null && sat !== undefined){
          
            //Logger.debug('Color changed from outside. Disabling AdaptiveLighting.', accessory.displayName);
          
            if(api.versionGreaterOrEqual && api.versionGreaterOrEqual('v1.3.0-beta.23'))
              accessory.adaptiveLightingController.disableAdaptiveLighting(true);
       
            accessory
              .getService(service)
              .getCharacteristic(api.hap.Characteristic.Hue)
              .updateValue(hue);
          
            accessory
              .getService(service)
              .getCharacteristic(api.hap.Characteristic.Saturation)
              .updateValue(sat);
   
          }
         
        }
      
        break;
      
      }
    
      case 'smarthome-switch': {

        let state = accessory.getService(service).getCharacteristic(characteristic).value; 
        
        try {
        
          if((!accessory.context.config.group && !smarthomeList) || (accessory.context.config.group && !smarthomeGroupList))
            await this.refreshSmarthome(false, true);
          
          let device = !accessory.context.config.group
            ? smarthomeList.find(device => device.ain.includes(accessory.context.config.ain))
            : smarthomeGroupList.find(device => device.name.includes(accessory.displayName));
        
          Logger.debug(device, accessory.displayName);
          
          if(device)
            accessory.context.config.ain = device.ain;
          
          if(device && device.online && device.switch){
          
            state = device.switch.state ? true : false;
              
            if(accessory.context.config.energy && device.powermeter){
              
              let currentPower = device.powermeter.power || 0;
              let totalPower = device.powermeter.energy || 0;
              let voltage = device.powermeter.voltage || 0;
              let ampere = Math.round(((currentPower/voltage) + Number.EPSILON) * 100) / 100;
              
              accessory
                .getService(service)
                .getCharacteristic(api.hap.Characteristic.OutletInUse)
                .updateValue(currentPower > 0 ? true : false);  
              
              accessory
                .getService(service)
                .getCharacteristic(api.hap.Characteristic.CurrentConsumption)
                .updateValue(currentPower);    
                
              accessory
                .getService(service)
                .getCharacteristic(api.hap.Characteristic.TotalConsumption)
                .updateValue(totalPower);   
                
              accessory
                .getService(service)
                .getCharacteristic(api.hap.Characteristic.Volts)
                .updateValue(voltage);   
                
              accessory
                .getService(service)
                .getCharacteristic(api.hap.Characteristic.Amperes)
                .updateValue(ampere);                
            
            }
          
          }
        
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
        
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
      
        break;
      
      }
      
      case 'smarthome-temperature': {
      
        let state = accessory.getService(service).getCharacteristic(characteristic).value; 
        
        try {
        
          if(!smarthomeList)
            await this.refreshSmarthome(false, true);
          
          let device = smarthomeList
            .find(device => device.ain.includes(accessory.context.config.ain));
          
          Logger.debug(device, accessory.displayName); 
          
          if(device)
            accessory.context.config.ain = device.ain;
          
          if(device && device.online && device.temperature){
          
            state = device.temperature.value || 0;
          
          }
          
          if(device && device.online && device.humidity && accessory.context.config.humidity){
            
            let humidity = device.humidity.value || 0;
            
            accessory
              .getService(api.hap.Service.HumiditySensor)
              .getCharacteristic(api.hap.Characteristic.CurrentRelativeHumidity)
              .updateValue(humidity);
            
          }
          
          if(device && device.online && device.battery && accessory.context.config.battery){
            
            let batteryLevel = device.battery.value || 0;
            let lowBattery = device.battery.low || 0;
            
            accessory
              .getService(api.hap.Service.BatteryService)
              .getCharacteristic(api.hap.Characteristic.BatteryLevel)
              .updateValue(batteryLevel);
              
            accessory
              .getService(api.hap.Service.BatteryService)
              .getCharacteristic(api.hap.Characteristic.StatusLowBattery)
              .updateValue(lowBattery);
            
          }
        
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
        
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
      
        break;
      
      }
      
      case 'smarthome-contact': {
      
        let state = accessory.getService(service).getCharacteristic(characteristic).value; 
        
        try {
        
          if(!smarthomeList)
            await this.refreshSmarthome(false, true);
        
          let device = smarthomeList.find(device => device.ain.includes(accessory.context.config.ain)); 
          Logger.debug(device, accessory.displayName);
          
          if(device)
            accessory.context.config.ain = device.ain;
          
          if(device && device.online && device.alert){
          
            state = device.alert.state || 0;
          
          }
          
          if(device && device.online && device.battery && accessory.context.config.battery){
            
            let batteryLevel = device.battery.value || 0;
            let lowBattery = device.battery.low || 0;
            
            accessory
              .getService(api.hap.Service.BatteryService)
              .getCharacteristic(api.hap.Characteristic.BatteryLevel)
              .updateValue(batteryLevel);
              
            accessory
              .getService(api.hap.Service.BatteryService)
              .getCharacteristic(api.hap.Characteristic.StatusLowBattery)
              .updateValue(lowBattery);
            
          }
        
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
        
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
        
        break;
      
      }
      
      case 'smarthome-window': {
      
        let state = accessory.getService(service).getCharacteristic(characteristic).value; 
      
        try {
        
          let device = smarthomeList.find(device => device.ain.includes(accessory.context.config.ain)); 
          Logger.debug(device, accessory.displayName);
          
          if(device)
            accessory.context.config.ain = device.ain;
          
          if(device && device.online && device.thermostat){
          
            state = device.thermostat.windowOpen || 0;
          
          }
          
          if(device && device.online && device.battery && accessory.context.config.battery){
            
            let batteryLevel = device.battery.value || 0;
            let lowBattery = device.battery.low || 0;
            
            accessory
              .getService(api.hap.Service.BatteryService)
              .getCharacteristic(api.hap.Characteristic.BatteryLevel)
              .updateValue(batteryLevel);
              
            accessory
              .getService(api.hap.Service.BatteryService)
              .getCharacteristic(api.hap.Characteristic.StatusLowBattery)
              .updateValue(lowBattery);
            
          }
        
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
        
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
        
        break;
      
      }
      
      case 'smarthome-thermostat': {
      
        let currentState = accessory.getService(service).getCharacteristic(api.hap.Characteristic.CurrentHeatingCoolingState).value;
        let targetState = accessory.getService(service).getCharacteristic(api.hap.Characteristic.TargetHeatingCoolingState).value;
        let currentTemp = accessory.getService(service).getCharacteristic(api.hap.Characteristic.CurrentTemperature).value;
        let targetTemp = accessory.getService(service).getCharacteristic(api.hap.Characteristic.TargetTemperature).value;
        
        try {
        
          if((!accessory.context.config.group && !smarthomeList) || (accessory.context.config.group && !smarthomeGroupList))
            await this.refreshSmarthome(false, true);
          
          let device = !accessory.context.config.group
            ? smarthomeList.find(device => device.ain.includes(accessory.context.config.ain))
            : smarthomeGroupList.find(device => device.name.includes(accessory.displayName));

          Logger.debug(device, accessory.displayName);
          
          if(device)
            accessory.context.config.ain = device.ain;
          
          if(device && device.online && device.thermostat){
          
            currentTemp = device.thermostat.current;
            targetTemp = device.thermostat.target;
            
            if(device.temperature)
              currentTemp = device.temperature.value || currentTemp;
             
            if(targetTemp === 'off'){
             
              currentState = api.hap.Characteristic.CurrentHeatingCoolingState.OFF;
              targetState = api.hap.Characteristic.TargetHeatingCoolingState.OFF;
             
            } else {
             
              if(currentTemp > targetTemp){
                 
                targetState = api.hap.Characteristic.TargetHeatingCoolingState.COOL;
                currentState = api.hap.Characteristic.CurrentHeatingCoolingState.COOL;
                 
              } else {
               
                targetState = api.hap.Characteristic.TargetHeatingCoolingState.HEAT;
                currentState = api.hap.Characteristic.CurrentHeatingCoolingState.HEAT;
               
              }
               
              accessory
                .getService(service)
                .getCharacteristic(api.hap.Characteristic.TargetTemperature)
                .updateValue(targetTemp);
             
            }
          
          }
          
          if(device && device.online && device.battery && accessory.context.config.battery){
            
            let batteryLevel = device.battery.value || 0;
            let lowBattery = device.battery.low || 0;
            
            accessory
              .getService(api.hap.Service.BatteryService)
              .getCharacteristic(api.hap.Characteristic.BatteryLevel)
              .updateValue(batteryLevel);
              
            accessory
              .getService(api.hap.Service.BatteryService)
              .getCharacteristic(api.hap.Characteristic.StatusLowBattery)
              .updateValue(lowBattery);
            
          }
        
        } catch(err) {
        
          handleError(accessory, currentState, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
        
        }
        
        let valvePos = currentTemp <= targetTemp && currentState !== api.hap.Characteristic.CurrentHeatingCoolingState.OFF && targetState !== api.hap.Characteristic.TargetHeatingCoolingState.OFF
          ? Math.round(((targetTemp - currentTemp) >= 5 ? 100 : (targetTemp - currentTemp) * 20))
          : 0;
        
        accessory
          .getService(service)
          .getCharacteristic(api.hap.Characteristic.CurrentHeatingCoolingState)
          .updateValue(currentState);
    
        accessory
          .getService(service)
          .getCharacteristic(api.hap.Characteristic.TargetHeatingCoolingState)
          .updateValue(targetState);
          
        accessory
          .getService(service)
          .getCharacteristic(api.hap.Characteristic.CurrentTemperature)
          .updateValue(currentTemp);
          
        accessory
          .getService(service)
          .getCharacteristic(api.hap.Characteristic.ValvePosition)
          .updateValue(valvePos);
        
        break;
      
      }
    
      case 'presence': {
          
        let state = accessory.getService(service).getCharacteristic(characteristic).value ? 1 : 0;    
          
        try {

          let validMAC = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
          let target = 'IPAddress';
          let service = 'X_AVM-DE_GetSpecificHostEntryByIP';
          let input = {NewIPAddress: accessory.context.config.address};

          let active = 'Active';

          if(validMAC.test(accessory.context.config.address)){
            target = 'MACAddress';
            service = 'GetSpecificHostEntry';
            input = {NewMACAddress: accessory.context.config.address};
          }

          let user = hostList ? hostList.find(user => user[target] === accessory.context.config.address) : false;

          if(!user){
            user = await fritzbox.exec('urn:dslforum-org:service:Hosts:1', service, input);
            active = 'NewActive';
          }

          Logger.debug(user, accessory.displayName);

          let newState = parseInt(user[active]);

          if(newState === state && accessory.context.config.ping){

            let threshold = !isNaN(accessory.context.config.threshold) ? accessory.context.config.threshold : 15;

            let address = user.IPAddress || user.NewIPAddress;

            let res = await ping.promise.probe(address);
            res.alive = res.alive ? 1 : 0;

            if(res.alive !== newState){
            
              Logger.debug('Ping and FritzBox states are not equal.', accessory.displayName);

              if(res.alive){ 

                accessory.context.lastSeen = Date.now(); 
                newState = res.alive;

                Logger.debug('Taking the value of Ping. (DETECTED)', accessory.displayName);

              } else { 

                if(accessory.context.lastSeen){

                  let lastSeenMoment = moment(accessory.context.lastSeen);
                  let activeThreshold = moment().subtract(threshold, 'm');
                  
                  if(lastSeenMoment.isAfter(activeThreshold)){
                    newState = 1;
                    accessory.context.lastSeen = false;
                    Logger.debug('Taking the value of Ping. (DETECTED - THRESHOLD REACHED)', accessory.displayName);
                  } else {
                    newState = 0;
                    Logger.debug('Taking the value of Ping. (NOT DETECTED - THRESHOLD NOT REACHED)', accessory.displayName);
                  }

                }

              }

            }

          }

          if(newState !== state){

            if(accessory.context.changedOn) {

              let millis = Date.now() - accessory.context.changedOn;
              let secElapsed = Math.floor(millis / 1000);

              let passed = false;

              if(newState && secElapsed > presenceOptions.onDelay){
                passed = true;        
              } else if(!newState && secElapsed > presenceOptions.offDelay){
                passed = true; 
              }

              if(passed){
                state = newState;
                accessory.context.changedOn = false;
              }

            } else {

              accessory.context.changedOn = Date.now();

              Logger.info('Occupancy state changed to ' + (newState ? 'DETECTED' : 'NOT DETECTED'), accessory.displayName);

              if(newState) {
                Logger.info('Wait ' + presenceOptions.onDelay + 's before switching state!', accessory.displayName);
              } else {
                Logger.info('Wait ' + presenceOptions.offDelay + 's before switching state!', accessory.displayName);
              }

            }

          } else {

            if(accessory.context.changedOn){

              accessory.context.changedOn = false;

              Logger.info('Occupancy state switched back to ' + (newState ? 'DETECTED' : 'NOT DETECTED'), accessory.displayName);

            }

          }

        } catch(err) {

          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});

        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
         
        break;
        
      }  
         
      case 'router': {
      
        let state = accessory.getService(service).getCharacteristic(characteristic).value;   
         
        try {
        
          let service = 'urn:dslforum-org:service:WLANConfiguration:1';
          let prefix = 'NewEnable';
          
          if(accessory.context.config.connection === 'cable'){
            service = 'urn:dslforum-org:service:WANIPConnection:1';
            prefix = 'NewConnectionStatus';
          } else if(accessory.context.config.connection === 'dsl'){
            service = 'urn:dslforum-org:service:WANPPPConnection:1';
            prefix = 'NewConnectionStatus';
          }
         
          let data = await fritzbox.exec(service, 'GetInfo');
          Logger.debug(data, accessory.displayName);
          
          if(prefix === 'NewEnable'){
            state = parseInt(data[prefix]) ? true : false;
          } else {
            state = data[prefix] === 'Connected' ? true : false;
          }
          
          if(accessory.context.restart){
            
            accessory.context.restart = false;
            
            if(reboot.off && accessory.context.config.master){
              
              try {
              
                await initReboot(reboot.off);
                Logger.info('OFF script executed successfully!');
             
              } catch(err) {
              
                Logger.error('An error occured during executing OFF script!');
                Logger.error(err);
            
              }
            
            }
            
          }
         
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
       
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
         
        break;
       
      }
     
      case 'wifi_2ghz': {
      
        let state = accessory.getService(service).getCharacteristic(characteristic).value;
         
        try {
         
          let data = await fritzbox.exec('urn:dslforum-org:service:WLANConfiguration:1', 'GetInfo');
          Logger.debug(data, accessory.displayName);
          state = parseInt(data.NewEnable) ? true : false;
         
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
       
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
         
        break;
         
      }   
         
      case 'wifi_5ghz': {
      
        let state = accessory.getService(service).getCharacteristic(characteristic).value;
         
        try {
         
          let data = await fritzbox.exec('urn:dslforum-org:service:WLANConfiguration:2', 'GetInfo');
          Logger.debug(data, accessory.displayName);
          state = parseInt(data.NewEnable) ? true : false;
         
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
       
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
         
        break;
         
      }   
         
      case 'wifi_guest': {
      
        let state = accessory.getService(service).getCharacteristic(characteristic).value;
         
        try {
         
          let data = await fritzbox.exec('urn:dslforum-org:service:WLANConfiguration:3', 'GetInfo');
          Logger.debug(data, accessory.displayName);
          state = parseInt(data.NewEnable) ? true : false;
         
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
       
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
         
        break;
        
      }  
         
      case 'wps': {
      
        let state = accessory.getService(service).getCharacteristic(characteristic).value;
         
        try {
         
          let data = await fritzbox.exec('urn:dslforum-org:service:WLANConfiguration:1', 'X_AVM-DE_GetWPSInfo');
          Logger.debug(data, accessory.displayName);
          state = data['NewX_AVM-DE_WPSStatus'] === 'off' ? false : true;
         
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
       
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
         
        break;
        
      }
      
      case 'dect': {
      
        let state = accessory.getService(service).getCharacteristic(characteristic).value;
         
        try {
         
          let data = await fritzbox.exec('urn:dslforum-org:service:DeviceConfig:1', 'X_AVM-DE_CreateUrlSID');
          let sid = data['NewX_AVM-DE_UrlSID'].split('sid=')[1];
         
          let body = await lua.request({
            xhr: '1',
            sid: sid,
            page: 'dectSet',
            no_sidrenew: ''
          }, accessory.context.config.fritzbox.url.hostname, '/data.lua', 'dect_activ');

          Logger.debug(body, accessory.displayName);
           
          state = body.checked || body.checked === '' ? true : false;
         
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
       
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
       
        break;
        
      }
         
      case 'aw': {
      
        let state = accessory.getService(service).getCharacteristic(characteristic).value;
         
        try {
         
          let data = await fritzbox.exec('urn:dslforum-org:service:X_AVM-DE_TAM:1', 'GetInfo', {'NewIndex': '0'});
          Logger.debug(data, accessory.displayName);
          state = parseInt(data.NewEnable) ? true : false;
         
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
       
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
         
        break;
        
      }
         
      case 'deflection': {
      
        let state = accessory.getService(service).getCharacteristic(characteristic).value;
         
        try {
         
          let data = await fritzbox.exec('urn:dslforum-org:service:X_AVM-DE_OnTel:1', 'GetNumberOfDeflections');
          Logger.debug(data, accessory.displayName);
           
          let amount = parseInt(data.NewNumberOfDeflections);
           
          if(amount){
             
            data = await fritzbox.exec('urn:dslforum-org:service:X_AVM-DE_OnTel:1', 'GetDeflection', {'NewDeflectionId': '0'});
            Logger.debug(data, accessory.displayName);
            state = parseInt(data.NewEnable) ? true : false;
        
          } else {
    
            state = false;
    
          }
         
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
       
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
         
        break;
        
      }
         
      case 'led': {
      
        let state = accessory.getService(service).getCharacteristic(characteristic).value;
         
        try {
         
          let data = await fritzbox.exec('urn:dslforum-org:service:DeviceConfig:1', 'X_AVM-DE_CreateUrlSID');
          let sid = data['NewX_AVM-DE_UrlSID'].split('sid=')[1];
         
          let body = await lua.request({
            xhr: '1',
            xhrId: 'all',
            sid: sid,
            page: 'led'
          }, accessory.context.config.fritzbox.url.hostname, '/data.lua');
          
          Logger.debug(body, accessory.displayName);
           
          if(body && body.data && body.data.ledSettings)
            state = parseInt(body.data.ledSettings.ledDisplay) === 0 ? true : false;
           
          //old fw  
          if(body && body.data && body.data.led_display)
            state = parseInt(body.data.led_display) === 0 ? true : false;
         
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
       
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
       
        break;
        
      }
         
      case 'lock': {
 
        let state = accessory.getService(service).getCharacteristic(characteristic).value;
         
        try {
         
          let data = await fritzbox.exec('urn:dslforum-org:service:DeviceConfig:1', 'X_AVM-DE_CreateUrlSID');
          let sid = data['NewX_AVM-DE_UrlSID'].split('sid=')[1];
         
          let body = await lua.request({
            xhr: '1',
            xhrId: 'all',
            sid: sid,
            page: 'keyLo',
            no_sidrenew: ''
          }, accessory.context.config.fritzbox.url.hostname, '/data.lua');
          
          Logger.debug(body, accessory.displayName);
           
          if(body && body.data)
            state = body.data.keylock_checked || false;
         
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
       
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
       
        break;
        
      }

      case 'ringlock': {
      
        let state = accessory.getService(service).getCharacteristic(characteristic).value;
         
        try {
         
          let data = await fritzbox.exec('urn:dslforum-org:service:DeviceConfig:1', 'X_AVM-DE_CreateUrlSID');
          let sid = data['NewX_AVM-DE_UrlSID'].split('sid=')[1];
           
          let phonesFormData = [];
          let actives = [];
           
          for(let count = 1; count <= config.DECTphones ; count++)
            phonesFormData.push({
              xhr: '1',
              idx: count.toString(),
              sid: sid,
              no_sidrenew: '',
              popup_url: '',
              oldpage: '/fon_devices/edit_dect_ring_block.lua'
            });
                           
          for(const formdata of phonesFormData){
            
            let body = await lua.request(formdata, accessory.context.config.fritzbox.url.hostname, '/data.lua', 'nightsetting'); 
            
            Logger.debug(body, accessory.displayName);
       
            actives.push((parseInt(body.value) || 0));
            
          }
            
          state = actives.includes(1) ? true : false;
         
        } catch(err) {
        
          state = handleError(accessory, state, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
       
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
       
        break;
        
      }
      
      case 'broadband': {
      
        let state = accessory.getService(service).getCharacteristic(characteristic).value;
        let ul;
        
        try {
         
          let data = await fritzbox.exec('urn:dslforum-org:service:DeviceConfig:1', 'X_AVM-DE_CreateUrlSID');
          let sid = data['NewX_AVM-DE_UrlSID'].split('sid=')[1];
         
          let body = await lua.request({
            xhr: '1',
            xhrId: 'first',
            sid: sid,
            page: 'overview',
            noMenuRef: '1',
            no_sidrenew: ''
          }, accessory.context.config.fritzbox.url.hostname, '/data.lua');
          
          if(body && body.data && body.data.internet){
          
            Logger.debug(body.data.internet, accessory.displayName);
          
            state = parseFloat(body.data.internet.down.replace(',', '.').replace( /^\D+/g, ''));
            ul = parseFloat(body.data.internet.up.replace(',', '.').replace( /^\D+/g, ''));
          
          }
         
        } catch(err) {
        
          handleError(accessory, false, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
       
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
          
        if(ul){
          accessory
            .getService(service)
            .getCharacteristic(api.hap.Characteristic.Upload)
            .updateValue(ul);
        } 
         
        break;
        
      }

      default: {
       
        let state = accessory.getService(service).getCharacteristic(characteristic).value; 
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
        
        break;
       
      }  
        
    }
    
    return;
      
  }
  
  async function set(accessory, service, characteristic, target, config, state, callback) {
  
    let fritzbox = accessory.context.config.fritzbox;
    
    callback(null);
  
    switch (target) {
    
      case 'smarthome-switch-lightbulb': {
      
        let bulbState = accessory.getService(api.hap.Service.Lightbulb).getCharacteristic(api.hap.Characteristic.On).value;
      
        try {
        
          let data = await masterDevice.fritzbox.exec('urn:dslforum-org:service:DeviceConfig:1', 'X_AVM-DE_CreateUrlSID');
          let sid = data['NewX_AVM-DE_UrlSID'].split('sid=')[1];
          let cmd, text;
          
          if(accessory.context.config.group && !accessory.context.config.ain){
          
            if(!smarthomeGroupList)
              await this.refreshSmarthome(false, true);
            
            let device = smarthomeList
              .find(device => device.name.includes(accessory.displayName));
            
            if(device)
              accessory.context.config.ain = device.ain;
          
          }
          
          if(accessory.context.config.ain){

            if(config === 'on'){
            
              cmd = state ? 'setswitchon' : 'setswitchoff';
              text = (state ? 'ON': 'OFF');
               
              await aha.request( masterDevice.fritzbox.url.hostname, accessory.context.config.ain, sid, cmd);
                
              Logger.info(text, accessory.displayName);
            
            } else if(config === 'brightness'){
  
              cmd = 'setlevelpercentage&level=' + state;
              text = ('Setting brightness to ' + state);
              
              await aha.request( masterDevice.fritzbox.url.hostname, accessory.context.config.ain, sid, cmd);
              Logger.info(text + ' (' + target + ')', accessory.displayName);
            
            } else if(config === 'temperature'){
            
              let colorTemperatureMired = state;
              let colorTemperatureKelvin = Math.round(1000000/colorTemperatureMired);
              
              let validColorTemperatureKelvin = colortemp2api(colorTemperatureKelvin);
              let validColorTemperatureMired = Math.round(1000000/validColorTemperatureKelvin);
              
              let color = api.versionGreaterOrEqual && api.versionGreaterOrEqual('v1.3.0-beta.23')
                ? api.hap.ColorUtils.colorTemperatureToHueAndSaturation(validColorTemperatureMired)
                : ColorUtils.colorTemperatureToHueAndSaturation(validColorTemperatureMired);
             
              let hue = color.hue;
              let saturation = color.saturation;
            
              cmd = 'setcolortemperature&temperature=' + validColorTemperatureKelvin + '&duration=100';
              text = ('Setting color temperature to ' + validColorTemperatureKelvin + ' Kelvin');
            
              if(bulbState){
                
                await aha.request( masterDevice.fritzbox.url.hostname, accessory.context.config.ain, sid, cmd);
                Logger.info(text + ' (' + target + ')', accessory.displayName);
                
                accessory.getService(api.hap.Service.Lightbulb).getCharacteristic(api.hap.Characteristic.Hue).updateValue(hue);
                accessory.getService(api.hap.Service.Lightbulb).getCharacteristic(api.hap.Characteristic.Saturation).updateValue(saturation);
              
              }
            
            } else {  //color
            
              let validHueSat = getValidColor(accessory, false, state);
            
              cmd = 'setcolor&hue=' + validHueSat.hue + '&saturation=' + validHueSat.sat + '&duration=100';
              text = ('Setting hue to ' + validHueSat.hue + ' and saturation to ' + validHueSat.sat);
              
              if(bulbState){
                
                await aha.request( masterDevice.fritzbox.url.hostname, accessory.context.config.ain, sid, cmd);
                Logger.info(text + ' (' + target + ')', accessory.displayName);
              
              }
            
            }

          } else {
          
            Logger.warn('Can not switch state! No AIN found/defined!', accessory.displayName);
          
          }
        
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
        
        }
        
        break;
      
      }
    
      case 'smarthome-lightbulb': {
      
        let bulbState = accessory.getService(api.hap.Service.Lightbulb).getCharacteristic(api.hap.Characteristic.On).value;
      
        try {
        
          let data = await masterDevice.fritzbox.exec('urn:dslforum-org:service:DeviceConfig:1', 'X_AVM-DE_CreateUrlSID');
          let sid = data['NewX_AVM-DE_UrlSID'].split('sid=')[1];
          let cmd, text;
          
          if(accessory.context.config.group && !accessory.context.config.ain){
          
            if(!smarthomeGroupList)
              await this.refreshSmarthome(false, true);
            
            let device = smarthomeList
              .find(device => device.name.includes(accessory.displayName));
            
            if(device)
              accessory.context.config.ain = device.ain;
          
          }
          
          if(accessory.context.config.ain){
          
            if(config === 'on'){
            
              cmd = state ? 'setsimpleonoff&onoff=1' : 'setsimpleonoff&onoff=0';
              text = (state ? 'ON': 'OFF');
               
              await aha.request( masterDevice.fritzbox.url.hostname, accessory.context.config.ain, sid, cmd);
                
              Logger.info(text, accessory.displayName);
            
            } else if(config === 'brightness'){
  
              cmd = 'setlevelpercentage&level=' + state;
              text = ('Setting brightness to ' + state);
              
              await aha.request( masterDevice.fritzbox.url.hostname, accessory.context.config.ain, sid, cmd);
              Logger.info(text + ' (' + target + ')', accessory.displayName);
            
            } else if(config === 'temperature'){
            
              let colorTemperatureMired = state;
              let colorTemperatureKelvin = Math.round(1000000/colorTemperatureMired);
              
              let validColorTemperatureKelvin = colortemp2api(colorTemperatureKelvin);
              let validColorTemperatureMired = Math.round(1000000/validColorTemperatureKelvin);
              
              let color = api.versionGreaterOrEqual && api.versionGreaterOrEqual('v1.3.0-beta.23')
                ? api.hap.ColorUtils.colorTemperatureToHueAndSaturation(validColorTemperatureMired)
                : ColorUtils.colorTemperatureToHueAndSaturation(validColorTemperatureMired);
             
              let hue = color.hue;
              let saturation = color.saturation;
            
              cmd = 'setcolortemperature&temperature=' + validColorTemperatureKelvin + '&duration=100';
              text = ('Setting color temperature to ' + validColorTemperatureKelvin + ' Kelvin');
            
              if(bulbState){
                
                await aha.request( masterDevice.fritzbox.url.hostname, accessory.context.config.ain, sid, cmd);
                Logger.info(text + ' (' + target + ')', accessory.displayName);
                
                accessory.getService(api.hap.Service.Lightbulb).getCharacteristic(api.hap.Characteristic.Hue).updateValue(hue);
                accessory.getService(api.hap.Service.Lightbulb).getCharacteristic(api.hap.Characteristic.Saturation).updateValue(saturation);
              
              }
            
            } else {  //color
            
              let validHueSat = getValidColor(accessory, false, state);
            
              cmd = 'setcolor&hue=' + validHueSat.hue + '&saturation=' + validHueSat.sat + '&duration=100';
              text = ('Setting hue to ' + validHueSat.hue + ' and saturation to ' + validHueSat.sat);
              
              if(bulbState){
                
                await aha.request( masterDevice.fritzbox.url.hostname, accessory.context.config.ain, sid, cmd);
                Logger.info(text + ' (' + target + ')', accessory.displayName);
              
              }
            
            }     
          
          } else {
          
            Logger.warn('Can not switch state! No AIN found/defined!', accessory.displayName);
          
          }
        
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
        
        }
        
        break;
      
      }
    
      case 'smarthome-switch': {
      
        try {
        
          let data = await masterDevice.fritzbox.exec('urn:dslforum-org:service:DeviceConfig:1', 'X_AVM-DE_CreateUrlSID');
          let sid = data['NewX_AVM-DE_UrlSID'].split('sid=')[1];
          let cmd = state ? 'setswitchon' : 'setswitchoff';
          
          if(accessory.context.config.group && !accessory.context.config.ain){
          
            if(!smarthomeGroupList)
              await this.refreshSmarthome(false, true);
            
            let device = smarthomeList
              .find(device => device.name.includes(accessory.displayName));
            
            if(device)
              accessory.context.config.ain = device.ain;
          
          }
          
          if(accessory.context.config.ain){
          
            await aha.request( masterDevice.fritzbox.url.hostname, accessory.context.config.ain, sid, cmd);
            Logger.info((state ? 'ON': 'OFF') + ' (' + target + ')', accessory.displayName);          
          
          } else {
          
            Logger.warn('Can not switch state! No AIN found/defined!', accessory.displayName);
          
          }
        
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
        
        }
        
        break;
      
      }
      
      case 'smarthome-thermostat': {
      
        try {
        
          let data = await masterDevice.fritzbox.exec('urn:dslforum-org:service:DeviceConfig:1', 'X_AVM-DE_CreateUrlSID');
          let sid = data['NewX_AVM-DE_UrlSID'].split('sid=')[1];
          let cmd, text;
          
          if(accessory.context.config.group && !accessory.context.config.ain){
          
            if(!smarthomeGroupList)
              await this.refreshSmarthome(false, true);
            
            let device = smarthomeList
              .find(device => device.name.includes(accessory.displayName));
            
            if(device)
              accessory.context.config.ain = device.ain;
          
          }
          
          if(accessory.context.config.ain){
          
            if(config === 'temperature'){
            
              let temp = Math.round((Math.min(Math.max(state, 8), 28) - 8) * 2) + 16;
            
              cmd = 'sethkrtsoll&param='+temp;
              text = ('Setting temperature to ' + state);
          
              /*if(accessory.waitForEndTemp){
                clearTimeout(accessory.waitForEndTemp);
                accessory.waitForEndTemp = false;
              }*/
              
              /*accessory.waitForEndTemp = setTimeout(async () => {
              
                try {
            
                  await aha.request( masterDevice.fritzbox.url.hostname, accessory.context.config.ain, sid, cmd);
                  Logger.info(text + ' (' + target + ')', accessory.displayName);
                
                } catch(err) {
                
                  handleError(accessory, false, target, err, {set: true});
                
                }
              
              }, 500);*/
              
              await aha.request( masterDevice.fritzbox.url.hostname, accessory.context.config.ain, sid, cmd);
              Logger.info(text + ' (' + target + ')', accessory.displayName);
          
            } else {
           
              let targetTemp = accessory.getService(service).getCharacteristic(api.hap.Characteristic.TargetTemperature).value;
              
              let temp = Math.round((Math.min(Math.max(targetTemp, 8), 28) - 8) * 2) + 16;
              
              cmd = state ? 'sethkrtsoll&param=' + temp : 'sethkrtsoll&param=253';
              text = (state ? (state === 1 ? 'HEAT' : 'COOL' ) : 'OFF') + ' (' + target + ')';
              
              await aha.request( masterDevice.fritzbox.url.hostname, accessory.context.config.ain, sid, cmd);
              Logger.info(text + ' (' + target + ')', accessory.displayName);
          
            }        
          
          } else {
          
            Logger.warn('Can not switch state! No AIN found/defined!', accessory.displayName);
          
          }
        
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
        
        }
        
        break;
      
      }
    
      case 'router': {
      
        if(state){
        
          Logger.info('ON not supported!', accessory.displayName);
           
          setTimeout(() => {
          
            accessory
              .getService(service)
              .getCharacteristic(characteristic)
              .updateValue(!state);
         
          }, 1000);
          
        } else {
        
          Logger.info('OFF' + ' (' + target + ')', accessory.displayName);
        
          if(reboot.on && accessory.context.config.master){
          
            try {
            
              await initReboot(reboot.on);
              Logger.info('ON script executed successfully!', accessory.displayName);
           
            } catch(err) {
            
              Logger.error('An error occured during executing ON script!', accessory.displayName);
              Logger.error(err);
          
            }
          
          }
        
          try {
            
            await fritzbox.exec('urn:dslforum-org:service:DeviceConfig:1', 'Reboot');
            
            accessory.context.restart = true;
           
          } catch(err) {
          
            handleError(accessory, false, target, err, {set: true});
             
            setTimeout(() => {
             
              accessory
                .getService(service)
                .getCharacteristic(characteristic)
                .updateValue(!state);
             
            }, 1000);
         
          }
        
        }
         
        break;
        
      }
         
      case 'wol': {
         
        try {
         
          await fritzbox.exec('urn:dslforum-org:service:Hosts:1', 'X_AVM-DE_WakeOnLANByMACAddress', {NewMACAddress: accessory.context.config.address});
          Logger.info((state ? 'ON': 'OFF') + ' (' + target + ')', accessory.displayName);
         
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
       
        } finally {
        
          setTimeout(() => {
           
            accessory
              .getService(service)
              .getCharacteristic(characteristic)
              .updateValue(false);
           
          }, 1000);
        
        }
         
        break;
        
      }
     
      case 'wifi_2ghz': {
         
        try {
         
          await fritzbox.exec('urn:dslforum-org:service:WLANConfiguration:1', 'SetEnable', {NewEnable: state});
          Logger.info((state ? 'ON': 'OFF') + ' (' + target + ')', accessory.displayName);
         
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
           
          setTimeout(() => {
           
            accessory
              .getService(service)
              .getCharacteristic(characteristic)
              .updateValue(!state);
           
          }, 1000);
       
        }
         
        break;
        
      }
         
      case 'wifi_5ghz': {
         
        try {
         
          await fritzbox.exec('urn:dslforum-org:service:WLANConfiguration:2', 'SetEnable', {NewEnable: state});
          Logger.info((state ? 'ON': 'OFF') + ' (' + target + ')', accessory.displayName);
         
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
           
          setTimeout(() => {
           
            accessory
              .getService(service)
              .getCharacteristic(characteristic)
              .updateValue(!state);
           
          }, 1000);
       
        }
         
        break;
        
      }
         
      case 'wifi_guest': {
         
        try {
         
          await fritzbox.exec('urn:dslforum-org:service:WLANConfiguration:3', 'SetEnable', {NewEnable: state});
          Logger.info((state ? 'ON': 'OFF') + ' (' + target + ')', accessory.displayName);
         
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
           
          setTimeout(() => {
           
            accessory
              .getService(service)
              .getCharacteristic(characteristic)
              .updateValue(!state);
           
          }, 1000);
       
        }
         
        break;
        
      }  
         
      case 'wps': {
         
        try {
         
          let status = state ? 'pbc' : 'stop';
         
          await fritzbox.exec('urn:dslforum-org:service:WLANConfiguration:1', 'X_AVM-DE_SetWPSConfig', {'NewX_AVM-DE_WPSMode': status});
          Logger.info((state ? 'ON': 'OFF') + ' (' + target + ')', accessory.displayName);
         
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
           
          setTimeout(() => {
           
            accessory
              .getService(service)
              .getCharacteristic(characteristic)
              .updateValue(!state);
           
          }, 1000);
       
        }
         
        break;
        
      }
      
      case 'dect': {
         
        try {
         
          let data = await fritzbox.exec('urn:dslforum-org:service:DeviceConfig:1', 'X_AVM-DE_CreateUrlSID');
          let sid = data['NewX_AVM-DE_UrlSID'].split('sid=')[1];
          
          let formData;
          
          if(state){
            formData = {
              xhr: '1',
              sid: sid,
              no_sidrenew: '',
              dect_activ: 'on',
              dect_pin: '****',
              dect_eco_modi: '1',
              starthh: '00',
              startmm: '00',
              endhh: '00',
              endmm: '00',
              dect_security: '0',
              protectpin: '',
              protectdiversion: 'on',
              dect_problems: 'on',
              catiq_problems: 'on',
              dect_assi: '0',
              btnSave: '',
              oldpage: '/dect/dect_settings.lua'
            };
          } else {
            formData = {
              xhr: '1',
              sid: sid,
              no_sidrenew: '',
              dect_assi: '0',
              btnSave: '', 
              oldpage: '/dect/dect_settings.lua'
            };
          }
            
          await lua.request(formData, accessory.context.config.fritzbox.url.hostname, '/data.lua');
          
          Logger.info((state ? 'ON': 'OFF') + ' (' + target + ')', accessory.displayName);
         
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
           
          setTimeout(() => {
           
            accessory
              .getService(service)
              .getCharacteristic(characteristic)
              .updateValue(!state);
           
          }, 1000);
       
        }
         
        break;
        
      }
         
      case 'aw': {
         
        try {
         
          await fritzbox.exec('urn:dslforum-org:service:X_AVM-DE_TAM:1', 'SetEnable', {NewIndex: 0, NewEnable: state ? '1' : '0'});
          Logger.info((state ? 'ON': 'OFF') + ' (' + target + ')', accessory.displayName);
         
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
           
          setTimeout(() => {
           
            accessory
              .getService(service)
              .getCharacteristic(characteristic)
              .updateValue(!state);

          }, 1000);
       
        }
         
        break;
        
      }  

      case 'deflection': {
      
        try {
       
          let data = await fritzbox.exec('urn:dslforum-org:service:X_AVM-DE_OnTel:1', 'GetNumberOfDeflections');
          
          if(parseInt(data.NewNumberOfDeflections)) {
           
            try {
             
              await fritzbox.exec('urn:dslforum-org:service:X_AVM-DE_OnTel:1', 'SetDeflectionEnable', {NewDeflectionId: 0, NewEnable: state ? 1 : 0});
              Logger.info((state ? 'ON': 'OFF') + ' (' + target + ')', accessory.displayName);
             
            } catch(err) {
            
              handleError(accessory, false, target, err, {set: true});
               
              setTimeout(() => {
               
                accessory
                  .getService(service)
                  .getCharacteristic(characteristic)
                  .updateValue(!state);
               
              }, 1000);
           
            }
           
          } else {
           
            Logger.error('Can not set state, no deflections' + ' (' + target + ')', accessory.displayName);
             
            setTimeout(() => {
             
              accessory
                .getService(service)
                .getCharacteristic(characteristic)
                .updateValue(!state);
             
            }, 1000);
           
          }
        
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
           
          setTimeout(() => {
           
            accessory
              .getService(service)
              .getCharacteristic(characteristic)
              .updateValue(!state);
           
          }, 1000);
        
        }
       
        break;
        
      }
         
      case 'led': {
         
        try {
         
          let data = await fritzbox.exec('urn:dslforum-org:service:DeviceConfig:1', 'X_AVM-DE_CreateUrlSID');
          let sid = data['NewX_AVM-DE_UrlSID'].split('sid=')[1];
          
          let formData = {
            xhr: '1',
            led_brightness: '2',
            environment_light: '1',
            led_display: '0',
            envLight: '1',
            dimValue: '2',
            ledDisplay: state ? '0': '2',
            apply: '',
            sid: sid,
            page: 'led'
          };
          
          if(accessory.context.config.oldFW){
            formData = {
              xhr: '1',
              led_display: state ? '0' : '2',
              apply: '',
              sid: sid,
              page: 'led'
            };
          }
         
          await lua.request(formData, accessory.context.config.fritzbox.url.hostname, '/data.lua');
          
          Logger.info((state ? 'ON': 'OFF') + ' (' + target + ')', accessory.displayName);
         
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
           
          setTimeout(() => {
           
            accessory
              .getService(service)
              .getCharacteristic(characteristic)
              .updateValue(!state);
           
          }, 1000);
       
        }
         
        break;
        
      }

      case 'lock': {
         
        try {
         
          let data = await fritzbox.exec('urn:dslforum-org:service:DeviceConfig:1', 'X_AVM-DE_CreateUrlSID');
          let sid = data['NewX_AVM-DE_UrlSID'].split('sid=')[1];
         
          await lua.request({
            xhr: '1',
            keylock_enabled: state ? '1' : '0',
            sid: sid,
            menu_active_page: 'keyLo',
            apply: '',
            page: 'keyLo'
          }, accessory.context.config.fritzbox.url.hostname, '/data.lua');
          
          Logger.info((state ? 'ON': 'OFF') + ' (' + target + ')', accessory.displayName);
         
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
           
          setTimeout(() => {
           
            accessory
              .getService(service)
              .getCharacteristic(characteristic)
              .updateValue(!state);
           
          }, 1000);
       
        }
         
        break;
        
      }

      case 'alarm': {
         
        try {
         
          if(state){
           
            await fritzbox.exec('urn:dslforum-org:service:X_VoIP:1', 'X_AVM-DE_DialNumber', {'NewX_AVM-DE_PhoneNumber': config.telNr});
            
            let duration = config.duration || 30;
            
            if(config.duration && parseInt(config.duration) > 0){
            
              if(accessory.context.alarmTimeout){
                clearTimeout(accessory.context.alarmTimeout);
                accessory.context.alarmTimeout = false;
              }
            
              accessory.context.alarmTimeout = setTimeout(() => {
              
                let value = accessory.getService(service).getCharacteristic(characteristic).value;
              
                if(value){
                  accessory
                    .getService(service)
                    .getCharacteristic(characteristic)
                    .setValue(false);
                }
              
              }, duration * 1000);
            
            }
           
          } else {
          
            if(accessory.context.alarmTimeout){
              clearTimeout(accessory.context.alarmTimeout);
              accessory.context.alarmTimeout = false;
            }
           
            await fritzbox.exec('urn:dslforum-org:service:X_VoIP:1', 'X_AVM-DE_DialHangup');
           
          }
          
          Logger.info((state ? 'ON': 'OFF') + ' (' + target + ')', accessory.displayName);
         
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
           
          setTimeout(() => {
           
            accessory
              .getService(service)
              .getCharacteristic(characteristic)
              .updateValue(!state);
           
          }, 1000);
       
        }
         
        break;
        
      }
         
      case 'wakeup': {
         
        try {
         
          if(state){
           
            await fritzbox.exec('urn:dslforum-org:service:X_VoIP:1', 'X_AVM-DE_DialNumber', {'NewX_AVM-DE_PhoneNumber': config.internNr});
           
          } else {
           
            await fritzbox.exec('urn:dslforum-org:service:X_VoIP:1', 'X_AVM-DE_DialHangup');
           
          }
          
          Logger.info((state ? 'ON': 'OFF') + ' (' + target + ')', accessory.displayName);
         
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
           
          setTimeout(() => {
           
            accessory
              .getService(service)
              .getCharacteristic(characteristic)
              .updateValue(!state);
           
          }, 1000);
       
        }
         
        break;
        
      }
         
      case 'ringlock': {
      
        try {
        
          let phonesFormData = [];
          let dayForm;
          
          let today = new Date();
          let now = moment();
          let hour = now.hour();
          let minute = now.minute();
          let endhour = now.add(12,'h');
          let endminute = '00';
    
          if(today.getDay() === 6 || today.getDay() === 0){
            
            dayForm = 'weekend';
         
          } else {
            
            dayForm = 'weekday';
         
          }
       
          if(config.start && config.end){
          
            let s = config.start.split(':');
            let e = config.end.split(':');
            
            hour = s[0];
            minute = s[1];
            endhour = e[0];
            endminute = e[1];
         
          } else {
            
            if(hour < 10 && hour >= 0)
              hour = '0' + hour;
    
            if(minute < 10 && minute >= 0)
              minute = '0' + minute;
            
            if(endhour < 10 && endhour >= 0)
              endhour = '0' + endhour;
            
          }
          
          let data = await fritzbox.exec('urn:dslforum-org:service:DeviceConfig:1', 'X_AVM-DE_CreateUrlSID');
          let sid = data['NewX_AVM-DE_UrlSID'].split('sid=')[1];
          
          for(let count = 1; count <= config.DECTphones ; count++){
            
            if(state){
            
              phonesFormData.push({
                idx: count.toString(),
                xhr: '1',
                nightsetting: '1',
                lockmode: '1',
                lockday: dayForm,
                starthh: hour.toString(),
                startmm: minute.toString(),
                endhh: endhour.toString(),
                endmm: endminute.toString(),
                event: 'on',
                popup_url:'',
                apply: '',
                sid: sid,
                page:'edit_dect_ring_block'
              });
              
            } else {
            
              phonesFormData.push({
                idx: count.toString(),
                xhr: '1',
                popup_url:'',
                apply: '',
                sid: sid,
                page:'edit_dect_ring_block'
              });
            
            }
            
          }
          
          for(const formdata of phonesFormData)
            await lua.request(formdata, accessory.context.config.fritzbox.url.hostname, '/data.lua', 'nightsetting');
            
          Logger.info((state ? 'ON': 'OFF') + ' (' + target + ')', accessory.displayName);
            
        } catch(err) {
        
          handleError(accessory, false, target, err, {set: true});
           
          setTimeout(() => {
           
            accessory
              .getService(service)
              .getCharacteristic(characteristic)
              .updateValue(!state);
           
          }, 1000);
        
        }
       
        break;
        
      }  
      
      case 'phoneBook': {
          
        if(!state){
        
          Logger.info('OFF not supported! (' + target + ')', accessory.displayName);
           
          setTimeout(() => {
          
            accessory
              .getService(service)
              .getCharacteristic(characteristic)
              .updateValue(true);
          
          }, 1000);
          
        } else {
        
          try {
            
            let lkz, okz;
            
            if(masterDevice.countryPrefix){
              
              let prefix = masterDevice.countryPrefix;
              
              if(prefix.includes('+'))
                lkz = prefix.split('+')[1];
                
              if(prefix.includes('00'))
                lkz = prefix.split('00')[1];
                
            } else {
              
              lkz = await fritzbox.exec('urn:dslforum-org:service:X_VoIP:1', 'X_AVM-DE_GetVoIPCommonCountryCode');
              
              lkz = lkz['NewX_AVM-DE_LKZ']; //49 => 0049 => +49
              
            }
            
            if(masterDevice.cityPrefix){
              
              if(masterDevice.cityPrefix.indexOf('0') === 0)
                okz = masterDevice.cityPrefix.replace('0', '');
            
            } else {
              
              okz = await fritzbox.exec('urn:dslforum-org:service:X_VoIP:1', 'X_AVM-DE_GetVoIPCommonAreaCode');
              
              okz = okz['NewX_AVM-DE_OKZ']; //531
              
            }
            
            let lkz1 = '+' + lkz; 
            let lkz2 = '00' + lkz;
            
            let okz1 = '0' + okz;
            
            let blacklists = config.blacklists && config.blacklists.length
              ? config.blacklists
              : []; 
            
            let telBook = [];
            let blackBook = [];
            
            let books = await fritzbox.exec('urn:dslforum-org:service:X_AVM-DE_OnTel:1', 'GetPhonebookList');
            books = books.NewPhonebookList.split(',');
                
            if(!Array.isArray(books))
              books = [books];
              
            Logger.debug('Found ' + books.length + ' phonebook(s). Fetching entries...', accessory.displayName);
              
            for(const id of books){
            
              let data = await fritzbox.exec('urn:dslforum-org:service:X_AVM-DE_OnTel:1', 'GetPhonebook', {NewPhonebookID: id});
              
              let bookName = data.NewPhonebookName;
              let uri = data.NewPhonebookURL;
              
              let book = await requestXml({ uri, rejectUnauthorized: false });
  
              let contacts = book.phonebooks.phonebook.contact;
              
              if(contacts){
              
                for(const contact of contacts){
                
                  let numbers = contact.telephony ? contact.telephony.number : false;
                   
                  if(numbers){
                   
                    if(numbers.length){
                      
                      let telNumbers = [];
                     
                      for(const number of numbers){
                  
                        let telnr = number._;
                    
                        telnr = telnr.replace(/\s/g, '').replace(/\-/g, '').replace(/\–/g, '');
                        
                        telNumbers.push(telnr);
                        
                        if(telnr.startsWith(lkz1) || telnr.startsWith(lkz2)){
                        
                          if(telnr.startsWith(lkz1)){                           //  +49
                            telNumbers.push(telnr.replace(lkz1, '0'));          //    0
                            telNumbers.push(telnr.replace(lkz1, '00' + lkz));   // 0049
                            if(telnr.includes(okz)){
                              telNumbers.push('0' + telnr.split(lkz1)[1]);
                              telNumbers.push(telnr.split(okz)[1]);
                            } /*else {
                              telNumbers.push(telnr.split(lkz1)[0] + okz + telnr.split(lkz1)[1]);
                            }*/
                          }
                          
                          if(telnr.startsWith(lkz2)){                           // 0049
                            telNumbers.push(telnr.replace(lkz2, '0'));          //    0
                            telNumbers.push(telnr.replace(lkz2, '+' + lkz));    //  +49
                            if(telnr.includes(okz)){
                              telNumbers.push('0' + telnr.split(lkz2)[1]);
                              telNumbers.push(telnr.split(okz)[1]);
                            } /*else {
                              telNumbers.push(telnr.split(lkz2)[0] + okz + telnr.split(lkz2)[1]);
                            }*/
                          }
                        
                        } else {
                          
                          if(telnr.startsWith('+'))                             //   +1
                            telNumbers.push(telnr.replace('+', '00'));          //  001
                          
                          if(telnr.startsWith('00'))                            //   +1
                            telNumbers.push(telnr.replace('00', '+'));          //  001
                            
                          if(telnr.startsWith(okz1))
                            telNumbers.push(telnr.replace(okz1, ''));   
                            
                          /*if(!telnr.startsWith('+') && 
                           !telnr.startsWith('00') && 
                           !telnr.startsWith(okz1)){
                            telNumbers.push(okz1 + telnr);
                          }*/
                            
                        }
      
                      }
                      
                      telBook.push({name: contact.person.realName, number: telNumbers});
      
                      if(blacklists.includes(bookName))
                        blackBook.push({name: contact.person.realName, number: telNumbers});
                     
                    } else {
                     
                      let telnr = numbers._;
                    
                      telnr = telnr.replace(/\s/g, '').replace(/\-/g, '').replace(/\–/g, '');
                      
                      let telNumbers = [];
                      
                      telNumbers.push(telnr);
                      
                      if(telnr.startsWith(lkz1) || telnr.startsWith(lkz2)){
                      
                        if(telnr.startsWith(lkz1)){                           //  +49
                          telNumbers.push(telnr.replace(lkz1, '0'));          //    0
                          telNumbers.push(telnr.replace(lkz1, '00' + lkz));   // 0049
                          if(telnr.includes(okz)){
                            telNumbers.push('0' + telnr.split(lkz1)[1]);
                            telNumbers.push(telnr.split(okz)[1]);
                          } /*else {
                            telNumbers.push(telnr.split(lkz1)[0] + okz + telnr.split(lkz1)[1]);
                          }*/
                        }
                        
                        if(telnr.startsWith(lkz2)){                           // 0049
                          telNumbers.push(telnr.replace(lkz2, '0'));          //    0
                          telNumbers.push(telnr.replace(lkz2, '+' + lkz));    //  +49
                          if(telnr.includes(okz)){
                            telNumbers.push('0' + telnr.split(lkz2)[1]);
                            telNumbers.push(telnr.split(okz)[1]);
                          } /*else {
                            telNumbers.push(telnr.split(lkz2)[0] + okz + telnr.split(lkz2)[1]);
                          }*/
                        }
                      
                      } else {
                        
                        if(telnr.startsWith('+'))                             //   +1
                          telNumbers.push(telnr.replace('+', '00'));          //  001
                          
                        if(telnr.startsWith('00'))                            //   +1
                          telNumbers.push(telnr.replace('00', '+'));          //  001
                          
                        if(telnr.startsWith(okz1))
                          telNumbers.push(telnr.replace(okz1, ''));
                          
                        /*if(!telnr.startsWith('+') && 
                           !telnr.startsWith('00') && 
                           !telnr.startsWith(okz1)){
                            telNumbers.push(okz1 + telnr);
                        }*/
                        
                      }
                      
                      telBook.push({name: contact.person.realName, number: telNumbers});
                  
                      if(blacklists.includes(bookName))
                        blackBook.push({name: contact.person.realName, number: telNumbers});
                     
                    }
                   
                  }
                
                }
              
              } else {
              
                Logger.debug('Phonebook [' + id + '] does not contain any contacts. Skipping..', accessory.displayName);  
              
              }
              
              Logger.debug('Phone book [' + id + '] done.', accessory.displayName);
            
            }
            
            Logger.info('Storing phonebook results to ' + configPath + '/fritzbox/phonebook.json', accessory.displayName);
            await fs.ensureFile(configPath + '/fritzbox/phonebook.json');
            await fs.writeJson(configPath + '/fritzbox/phonebook.json', telBook, { spaces: 2 });
            
            if(blackBook.length){
              Logger.info('Storing blackbook results to ' + configPath + '/fritzbox/blackbook.json', accessory.displayName);
              await fs.ensureFile(configPath + '/fritzbox/blackbook.json');
              await fs.writeJson(configPath + '/fritzbox/blackbook.json', blackBook, { spaces: 2 });
            }
            
            Logger.info('Done!', accessory.displayName);
          
          } catch(err) {
          
            handleError(accessory, false, target, err, {set: true});
          
          } finally {
          
            setTimeout(() => {
             
              accessory
                .getService(service)
                .getCharacteristic(characteristic)
                .updateValue(false);
             
            }, 1000);
          
          }
        
        }
       
        break;
    
      }
         
      default: {
       
        Logger.warn('Target (' + target + ') not found!', accessory.displayName);
         
        setTimeout(() => {
          accessory
            .getService(service)
            .getCharacteristic(characteristic)
            .updateValue(!state);
        }, 1000);
         
        break;
        
      }
        
    }
    
    return;
  
  }
  
  async function change(accessory, target, replacer, historyService, value){
  
    if(value.oldValue !== value.newValue){
    
      switch (target) {
      
        case 'smarthome-contact': {
          
          if(value.newValue){
          
            accessory.context.timesOpened = accessory.context.timesOpened || 0;
            accessory.context.timesOpened += 1;
            
            let lastActivation = moment().unix() - historyService.getInitialTime();
            let closeDuration = moment().unix() - historyService.getInitialTime();
            
            accessory
              .getService(api.hap.Service.ContactSensor)
              .getCharacteristic(api.hap.Characteristic.LastActivation)
              .updateValue(lastActivation);
              
            accessory
              .getService(api.hap.Service.ContactSensor)
              .getCharacteristic(api.hap.Characteristic.TimesOpened)
              .updateValue(accessory.context.timesOpened);
            
            accessory
              .getService(api.hap.Service.ContactSensor)
              .getCharacteristic(api.hap.Characteristic.ClosedDuration)
              .updateValue(closeDuration);
          
          } else {
          
            let openDuration = moment().unix() - historyService.getInitialTime();
          
            accessory
              .getService(api.hap.Service.ContactSensor)
              .getCharacteristic(api.hap.Characteristic.ClosedDuration)
              .updateValue(openDuration);
          
          }
            
          historyService.addEntry({time: moment().unix(), status: value.newValue ? 1 : 0});
        
          break;
        
        }
        
        case 'smarthome-window': {
          
          if(value.newValue){
          
            accessory.context.timesOpened = accessory.context.timesOpened || 0;
            accessory.context.timesOpened += 1;
            
            let lastActivation = moment().unix() - historyService.getInitialTime();
            let closeDuration = moment().unix() - historyService.getInitialTime();
            
            accessory
              .getService(api.hap.Service.ContactSensor)
              .getCharacteristic(api.hap.Characteristic.LastActivation)
              .updateValue(lastActivation);
              
            accessory
              .getService(api.hap.Service.ContactSensor)
              .getCharacteristic(api.hap.Characteristic.TimesOpened)
              .updateValue(accessory.context.timesOpened);
            
            accessory
              .getService(api.hap.Service.ContactSensor)
              .getCharacteristic(api.hap.Characteristic.ClosedDuration)
              .updateValue(closeDuration);
          
          } else {
          
            let openDuration = moment().unix() - historyService.getInitialTime();
          
            accessory
              .getService(api.hap.Service.ContactSensor)
              .getCharacteristic(api.hap.Characteristic.ClosedDuration)
              .updateValue(openDuration);
          
          }
            
          historyService.addEntry({time: moment().unix(), status: value.newValue ? 1 : 0});
        
          break;
        
        }
        
        case 'smarthome-temperature': {
        
          historyService.addEntry({time: moment().unix(), temp: value.newValue, humidity: 0, ppm: 0});
        
          break;
        
        }
        
        case 'smarthome-thermostat': {
        
          let currentState = accessory.getService(api.hap.Service.Thermostat).getCharacteristic(api.hap.Characteristic.CurrentHeatingCoolingState).value;  
          let targetState = accessory.getService(api.hap.Service.Thermostat).getCharacteristic(api.hap.Characteristic.TargetHeatingCoolingState).value;  
          let currentTemp = accessory.getService(api.hap.Service.Thermostat).getCharacteristic(api.hap.Characteristic.CurrentTemperature).value; 
          let targetTemp = accessory.getService(api.hap.Service.Thermostat).getCharacteristic(api.hap.Characteristic.TargetTemperature).value; 
            
          let valvePos = currentTemp <= targetTemp && currentState !== api.hap.Characteristic.CurrentHeatingCoolingState.OFF && targetState !== api.hap.Characteristic.TargetHeatingCoolingState.OFF
            ? Math.round(((targetTemp - currentTemp) >= 5 ? 100 : (targetTemp - currentTemp) * 20))
            : 0;
            
          historyService.addEntry({time: moment().unix(), currentTemp: currentTemp, setTemp: targetTemp, valvePosition: valvePos});
        
          break;
        
        } 
        
        case 'smarthome-switch': {
            
          historyService.addEntry({time: moment().unix(), power: value.newValue});
        
          break;
        
        }         
        
        case 'presence': {
        
          if(historyService){
            let lastActivation = moment().unix() - historyService.getInitialTime();
            accessory
              .getService(api.hap.Service.MotionSensor)
              .getCharacteristic(api.hap.Characteristic.LastActivation)
              .updateValue(lastActivation);
            historyService.addEntry({time: moment().unix(), status: value.newValue ? 1 : 0});
          }
        
          let dest = false;
          
          if(value.newValue){
            dest = accessory.displayName === 'Anyone' ? 'anyone_in' : 'user_in';
          } else {
            dest = accessory.displayName === 'Anyone' ? 'anyone_out' : 'user_out';
          }
          
          if(Telegram && !accessory.context.config.blockTelegram)
            Telegram.send('presence', dest, replacer === 'Anyone' ? false : replacer);
        
          break;
        
        }  
        
        case 'network': {
          
          if(Telegram) 
            Telegram.send('network',  value.newValue ? 'on' : 'off', replacer);
        
          break;
          
        }  
          
        case 'alarm': {
  
          if(Telegram)
            Telegram.send('alarm', value.newValue ? 'activated' : 'deactivated');
        
          break;
          
        }
          
        case 'router': {
  
          if(!accessory.context.config.readOnly && Telegram)
            Telegram.send('reboot', value.newValue ? 'finish' : 'start', accessory.displayName);
        
          break;
          
        }  
        
        case 'callmonitor': {
          
          if(value.newValue){
          
            accessory.context.timesOpened = accessory.context.timesOpened || 0;
            accessory.context.timesOpened += 1;
            
            let lastActivation = moment().unix() - historyService.getInitialTime();
            let closeDuration = moment().unix() - historyService.getInitialTime();
            
            accessory
              .getService(api.hap.Service.ContactSensor)
              .getCharacteristic(api.hap.Characteristic.LastActivation)
              .updateValue(lastActivation);
              
            accessory
              .getService(api.hap.Service.ContactSensor)
              .getCharacteristic(api.hap.Characteristic.TimesOpened)
              .updateValue(accessory.context.timesOpened);
            
            accessory
              .getService(api.hap.Service.ContactSensor)
              .getCharacteristic(api.hap.Characteristic.ClosedDuration)
              .updateValue(closeDuration);
          
          } else {
          
            let openDuration = moment().unix() - historyService.getInitialTime();
          
            accessory
              .getService(api.hap.Service.ContactSensor)
              .getCharacteristic(api.hap.Characteristic.ClosedDuration)
              .updateValue(openDuration);
          
          }
            
          historyService.addEntry({time: moment().unix(), status: value.newValue ? 1 : 0});
          
          if(Telegram && !replacer.denyCall){
          
            let dest;
          
            if(value.newValue) {
              dest = replacer.inbound ? 'incoming' : 'outgoing';
            } else {
              dest  = 'disconnected';
            }
          
            Telegram.send('callmonitor', dest, replacer.callerNr, replacer.homeNr);
          }
          
          break;
        
        }
          
        default: {
        
          //fall through
          break;
          
        }
      
      }
    
    }
  
  }
  
  async function poll(accessories){
  
    await refreshDevices(accessories);    
    await refreshHosts(accessories);    
    await refreshSmarthome(accessories);
   
    setTimeout(() => {
      poll(accessories);
    }, polling.timer);
  
  }
  
  async function refreshDevices(accessories){
    
    if(devices.size){
    
      let allDevices = handleCharacteristics(accessories);
         
      for(const [uuid, device] of allDevices){
        
        if(!polling.exclude.includes(device.subtype) && !polling.exclude.includes(device.type) && !polling.exclude.includes(device.name)){
        
          const accessory = accessories.find(curAcc => curAcc.UUID === uuid || (curAcc.UUID + '-' + device.subtype) === uuid);
         
          switch (device.type) {
            
            case 'router':
           
              await get(accessory, api.hap.Service.Switch, api.hap.Characteristic.On, device.type);
           
              break;
           
            case 'extra': {
            
              let characteristic = device.characteristic || api.hap.Characteristic.On;
            
              await get(accessory, api.hap.Service.Switch, characteristic, device.subtype, device.options);
            
              break;
              
            }
              
            default:
              // fall through
              break;
         
          }
        
        }
       
      }
      
    }
    
  }
  
  async function refreshHosts(accessories){
  
    let poll;
  
    for(const [uuid, device] of presence){
      if(!polling.exclude.includes(device.subtype) && !polling.exclude.includes(device.type) && !polling.exclude.includes(device.name)){
        poll = true;
      }
    }
    
    if(poll){
    
      try {
      
        let ssl = masterDevice.fritzbox.options.autoSsl;
      
        const data = await masterDevice.fritzbox.exec('urn:LanDeviceHosts-com:serviceId:Hosts1', 'X_AVM-DE_GetHostListPath');
        const uri = (ssl ? 'https://' : 'http://') + masterDevice.fritzbox.url.hostname + ':' + (ssl ? '49443' : '49000') + data['NewX_AVM-DE_HostListPath'];
        
        const hosts = await requestXml({ uri, rejectUnauthorized: false });
      
        hostList = hosts.List.Item;
        //Logger.debug(hostList, 'Hosts')
        
        for(const [uuid, device] of presence){
     
          if(!polling.exclude.includes(device.subtype) && !polling.exclude.includes(device.type) && !polling.exclude.includes(device.name)){
     
            const accessory = accessories.find(curAcc => curAcc.UUID === uuid || (curAcc.UUID + '-' + device.subtype) === uuid);
            
            if(accessory.displayName !== 'Anyone'){
              let accService = device.accType === 'occupancy' 
                ? api.hap.Service.OccupancySensor
                : api.hap.Service.MotionSensor; 
              let accCharacteristic = device.accType === 'occupancy' 
                ? api.hap.Characteristic.OccupancyDetected
                : api.hap.Characteristic.MotionDetected; 
              await get(accessory, accService, accCharacteristic, device.type);
            }           
     
          }
     
        }
      
      } catch(err) {
      
        handleError({displayName: 'Hosts'}, false, 'hosts', err, {poll: true});
      
      }
    
    }
    
    return;
  
  }
  
  async function refreshSmarthome(accessories, poll){
  
    for(const [uuid, device] of smarthome){
      if(!polling.exclude.includes(device.subtype) && !polling.exclude.includes(device.type) && !polling.exclude.includes(device.name)){
        poll = true;
      }
    }
    
    if(poll){
    
      try {
      
        let data = await masterDevice.fritzbox.exec('urn:dslforum-org:service:DeviceConfig:1', 'X_AVM-DE_CreateUrlSID');
        let sid = data['NewX_AVM-DE_UrlSID'].split('sid=')[1];
        let uri = 'http://' + masterDevice.fritzbox.url.hostname + '/webservices/homeautoswitch.lua?switchcmd=getdevicelistinfos&sid=' + sid;
        
        let smarthomes = await requestXml({ uri, rejectUnauthorized: false });
        let deviceList = smarthomes.devicelist.device; 
        let groupList = smarthomes.devicelist.group; 
                
        if(!Array.isArray(deviceList))
          deviceList = [deviceList];
        
        smarthomeList = deviceList.map(device => {
          const convertTemp = value => {
            value = parseInt(value);
            if (value == 254)
              return 'on';
            else if (value == 253)
              return 'off';
            else {
              return (parseFloat(value) - 16) / 2 + 8;
            }
          };
          if(device['$'].functionbitmask !== '1'){
            let dev = {
              name: device.name,
              id: device['$'].id,
              ain: device['$'].identifier.replace(/\s/g,''),
              online: parseInt(device.present),
              bitmask: device['$'].functionbitmask,
              busy: parseInt(device.txbusy),
              battery: device.battery 
                ? { 
                  value: parseInt(device.battery) || 0, 
                  low: parseInt(device.batterylow) || 0
                }
                : false,
              alert: device.alert
                ? {
                  state: parseInt(device.alert.state) || 0
                }
                : false,  
              temperature: device.temperature
                ? { 
                  value: parseInt(device.temperature.celsius)/10 || 0, 
                  offset: parseInt(device.temperature.offset) || 0 
                }
                : false,
              humidity: device.avmbutton && device.avmbutton.humidity
                ? { 
                  value: parseInt(device.avmbutton.humidity) || 0 
                }
                : false,
              powermeter: device.powermeter
                ? { 
                  voltage: parseInt(device.powermeter.voltage)/1000 || 0,  // >> voltage   = 0.001V = 1V
                  power: parseInt(device.powermeter.power)/1000 || 0,      // >> power     = 0.001W = 1W
                  energy: parseInt(device.powermeter.energy)/1000 || 0     // >> energy    = 1.00Wh = 0.001 kWh
                }
                : false,
              switch: device.switch
                ? {
                  state: parseInt(device.switch.state) || 0
                }
                : false,
              button: device.button
                ? device.button
                : false,    
              thermostat: device.hkr
                ? {
                  current: convertTemp(device.hkr.tist) || 0,
                  target: convertTemp(device.hkr.tsoll) || 0,
                  windowOpen: parseInt(device.hkr.windowopenactiv) || 0
                }
                : false,
              light: device.simpleonoff && !device.switch
                ? {
                  state: parseInt(device.simpleonoff.state) || 0,
                  brightness: device.levelcontrol
                    ? {
                      level: parseInt(device.levelcontrol.level),                        // 0 - 255
                      levelpercentage: parseInt(device.levelcontrol.levelpercentage)     // 0 - 100
                    }
                    : false,
                  color: device.colorcontrol
                    ? {
                      supported_modes: parseInt(device.colorcontrol['$'].supported_modes),
                      current_mode: parseInt(device.colorcontrol['$'].current_mode),
                      hue: parseInt(device.colorcontrol.hue),                            // 0 - 359
                      saturation: parseInt(device.colorcontrol.saturation),              // 0 - 100 (if current_mode === 1)
                      temperature: parseInt(device.colorcontrol.temperature)             // 2700 - 6500 Kelvin
                    }
                    : false
                }
                : false
            };
            return dev;
          }
        
        }).filter(device => device);
        
        //Logger.debug(smarthomeList, 'SmartHome Devices');
        
        if(groupList){
            
          if(!Array.isArray(groupList))
            groupList = [groupList];
          
          smarthomeGroupList = groupList.map(device => {
            const convertTemp = value => {
              value = parseInt(value);
              if (value == 254)
                return 'on';
              else if (value == 253)
                return 'off';
              else {
                return (parseFloat(value) - 16) / 2 + 8;
              }
            };
            if(device['$'].functionbitmask !== '1'){
              let dev = {
                name: device.name,
                id: device['$'].id,
                ain: device['$'].identifier.replace(/\s/g,''),
                associated: device.groupinfo && device.groupinfo.members
                  ? device.groupinfo.members.includes(',') 
                    ? device.groupinfo.members.split(',')
                    : [device.groupinfo.members]
                  : false,
                online: parseInt(device.present),
                bitmask: device['$'].functionbitmask,
                busy: parseInt(device.txbusy),
                battery: device.battery 
                  ? { 
                    value: parseInt(device.battery) || 0, 
                    low: parseInt(device.batterylow) || 0
                  }
                  : false,
                alert: device.alert
                  ? {
                    state: parseInt(device.alert.state) || 0
                  }
                  : false,  
                temperature: device.temperature
                  ? { 
                    value: parseInt(device.temperature.celsius)/10 || 0, 
                    offset: parseInt(device.temperature.offset) || 0 
                  }
                  : false,
                humidity: device.avmbutton && device.avmbutton.humidity
                  ? { 
                    value: parseInt(device.avmbutton.humidity) || 0 
                  }
                  : false,
                powermeter: device.powermeter
                  ? { 
                    voltage: parseInt(device.powermeter.voltage)/1000 || 0,  // >> voltage   = 0.001V = 1V
                    power: parseInt(device.powermeter.power)/1000 || 0,      // >> power     = 0.001W = 1W
                    energy: parseInt(device.powermeter.energy)/1000 || 0     // >> energy    = 1.00Wh = 0.001 kWh
                  }
                  : false,
                switch: device.switch
                  ? {
                    state: parseInt(device.switch.state) || 0
                  }
                  : false,
                button: device.button
                  ? device.button
                  : false,    
                thermostat: device.hkr
                  ? {
                    current: convertTemp(device.hkr.tist) || 0,
                    target: convertTemp(device.hkr.tsoll) || 0,
                    windowOpen: parseInt(device.hkr.windowopenactiv) || 0
                  }
                  : false,
                light: device.simpleonoff
                  ? {
                    state: parseInt(device.simpleonoff.state) || 0,
                    brightness: device.levelcontrol
                      ? {
                        level: parseInt(device.levelcontrol.level),                        // 0 - 255
                        levelpercentage: parseInt(device.levelcontrol.levelpercentage)     // 0 - 100
                      }
                      : false,
                    color: device.colorcontrol
                      ? {
                        supported_modes: parseInt(device.colorcontrol['$'].supported_modes),
                        current_mode: parseInt(device.colorcontrol['$'].current_mode),
                        hue: parseInt(device.colorcontrol.hue),                            // 0 - 359
                        saturation: parseInt(device.colorcontrol.saturation),              // 0 - 100 (if current_mode === 1)
                        temperature: parseInt(device.colorcontrol.temperature)             // 2700 - 6500 Kelvin
                      }
                      : false
                  }
                  : false
              };
              
              if(dev.associated){
              
                let types = [];
              
                dev.associated = dev.associated.map(id => {
                  let foundDevice = smarthomeList.filter(device => { 
                    if(device.id === id){
                      if(device.light && !types.includes('light'))
                        types.push('light');
                      if(device.switch && !types.includes('switch'))
                        types.push('switch');
                      if(device.thermostat && !types.includes('thermostat'))
                        types.push('thermostat');
                      return device;
                    }
                  });
                  
                  if(foundDevice)
                    return foundDevice[0];
                  
                }).filter(device => device);
                
                if(types.length){
                
                  if(types.includes('thermostat')){
                  
                    let batteryValues = dev.associated.map(device => {
                      if(device.battery)
                        return device.battery.value;
                    }).filter(device => !isNaN(device));
                    
                    let batteryLows = dev.associated.map(device => {
                      if(device.battery)
                        return device.battery.low;
                    }).filter(device => !isNaN(device));
                    
                    dev.battery = {
                      value: batteryValues.reduce( ( p, c ) => p + c, 0 ) / batteryValues.length,
                      low: batteryLows.includes(0) ? 0 : 1
                    };
                  
                  }
                
                  if(types.includes('switch') || types.includes('thermostat')){
                  
                    let temps = dev.associated.map(device => {
                      if(device.temperature)
                        return device.temperature.value;
                    }).filter(device => !isNaN(device));
                    
                    let offs = dev.associated.map(device => {
                      if(device.temperature)
                        return device.temperature.offset;
                    }).filter(device => !isNaN(device));
                    
                    let humids = dev.associated.map(device => {
                      if(device.humidity)
                        return device.humidity.value;
                    }).filter(device => !isNaN(device));
                    
                    dev.temperature = {
                      value: temps.reduce( ( p, c ) => p + c, 0 ) / temps.length,
                      offset: offs.reduce( ( p, c ) => p + c, 0 ) / offs.length 
                    };
                    
                    dev.humidity = {
                      value: humids.reduce( ( p, c ) => p + c, 0 ) / humids.length
                    };
                  
                  }
                
                  //brightness
                
                  let levels = dev.associated.map(device => {
                    if(device.light && device.light.brightness)
                      return device.light.brightness.level;
                  }).filter(device => !isNaN(device));
                  
                  let levelpercentages = dev.associated.map(device => {
                    if(device.light && device.light.brightness)
                      return device.light.brightness.levelpercentage;
                  }).filter(device => !isNaN(device));
                  
                  if(levels.length && levelpercentages.length){
                  
                    if(!dev.light)
                      dev.light = {};
                  
                    dev.light.brightness = {
                      level: levels.reduce( ( p, c ) => p + c, 0 ) / levels.length,
                      levelpercentage: levelpercentages.reduce( ( p, c ) => p + c, 0 ) / levelpercentages.length 
                    };
                  
                  }
                  
                  //color
                  
                  let hues = dev.associated.map(device => {
                    if(device.light && device.light.color)
                      return device.light.color.hue;
                  }).filter(device => !isNaN(device));
                  
                  let sats = dev.associated.map(device => {
                    if(device.light && device.light.color)
                      return device.light.color.saturation;
                  }).filter(device => !isNaN(device));
                  
                  let cTemps = dev.associated.map(device => {
                    if(device.light && device.light.color)
                      return device.light.color.temperature;
                  }).filter(device => !isNaN(device));
                  
                  if(hues.length && sats.length){
                  
                    if(!dev.light)
                      dev.light = {};
                  
                    dev.light.color = {
                      hue: hues.reduce( ( p, c ) => p + c, 0 ) / hues.length,
                      saturation: sats.reduce( ( p, c ) => p + c, 0 ) / sats.length,
                      temperature: null 
                    };
                  
                  } else if(cTemps.length) {
                  
                    dev.light.color = {
                      hue: null,
                      saturation: null,
                      temperature: cTemps.reduce( ( p, c ) => p + c, 0 ) / cTemps.length 
                    };
                                                                        
                  }
                
                }
                
              }
              
              return dev;
            }
          
          }).filter(device => device);
  
          //Logger.debug(smarthomeGroupList, 'SmartHome Groups');
          
        }
        
        if(accessories){
        
          for(const [uuid, device] of smarthome){
       
            if(!polling.exclude.includes(device.subtype) && !polling.exclude.includes(device.type) && !polling.exclude.includes(device.name)){
       
              const accessory = accessories.find(curAcc => curAcc.UUID === uuid || (curAcc.UUID + '-' + device.subtype) === uuid);
              
              switch(device.subtype) {
              
                case 'smarthome-switch-lightbulb':
                  await get(accessory, device.energy ? api.hap.Service.Outlet : api.hap.Service.Switch, api.hap.Characteristic.On, device.subtype);
                  break;
              
                case 'smarthome-lightbulb':
                  await get(accessory, api.hap.Service.Lightbulb, api.hap.Characteristic.On, device.subtype);
                  break;
              
                case 'smarthome-switch':
                  await get(accessory, device.energy ? api.hap.Service.Outlet : api.hap.Service.Switch, api.hap.Characteristic.On, device.subtype);
                  break;
                  
                case 'smarthome-temperature':
                  await get(accessory, api.hap.Service.TemperatureSensor, api.hap.Characteristic.CurrentTemperature, device.subtype);
                  break;
                  
                case 'smarthome-contact':
                  await get(accessory, api.hap.Service.ContactSensor, api.hap.Characteristic.ContactSensorState, device.subtype);
                  break;                                                                                                 
                  
                case 'smarthome-thermostat':
                  await get(accessory, api.hap.Service.Thermostat, false, device.subtype);
                  break;
                  
                case 'smarthome-window':
                  await get(accessory, api.hap.Service.ContactSensor, api.hap.Characteristic.ContactSensorState, device.subtype);
                  break;
                  
                default:
                  //fall through
                  break;
              
              }         
       
            }
       
          }
        
        }
      
      } catch(err) {
      
        handleError({displayName: 'Smarthome'}, false, 'smarthome', err, {poll: true});
      
      }
    
    }
    
    return;
  
  }
  
  function handleCharacteristics(accessories){
  
    let currentDevices = devices;
  
    let subtypes = {
      '0026e147-5d51-4f42-b157-6aca6050be8e': {
        name: 'WifiTwo',
        type: 'wifi_2ghz'
      },
      'a72aeeca-c6ce-45ce-b026-5d400aab5fc9': {
        name: 'WifiFive',
        type: 'wifi_5ghz'
      },
      'a87bbf2b-885c-4713-8169-22abdbf0b2a1': {
        name: 'WifiGuest',
        type: 'wifi_guest'
      },
      '991dd58c-7d8c-46b1-acd1-411d8f6902ac': {
        name: 'WifiWPS',
        type: 'wps'
      },
      '1718fc65-453b-403a-ab81-79a1c96ba195': {
        name: 'DECT',
        type: 'dect'
      },
      'd19ef9d5-3bc6-47ac-b6bb-7bdcf0df20b0': {
        name: 'AnsweringMachine',
        type: 'aw'
      },
      '658086c7-274c-4988-bd5e-3c720fa3054d': {
        name: 'Deflection',
        type: 'deflection'
      },
      'fd81f0dc-4324-457e-8164-289743873fb1': {
        name: 'DeviceLED',
        type: 'led'
      },
      '56af4239-46bc-4bae-b55b-dbc5be2d0897': {
        name: 'DeviceLock',
        type: 'lock'
      },
      'cab7d43e-422c-4452-bc9a-11c89454332b': {
        name: 'RingLock',
        type: 'ringlock'
      }
    };
    
    let validUUIDs = Object.keys(subtypes).map(type => type);
  
    accessories.forEach(acc => {
      if(acc.context.config.type === 'router'){
        acc.services.forEach(service => {
          if(service.subtype === 'router'){
            service.characteristics.forEach(characteristic => {
              if(validUUIDs.includes(characteristic.UUID)){
                let extraCharacteristic = {
                  name: acc.displayName + ' ' + characteristic.name,
                  type: 'extra',
                  subtype: subtypes[characteristic.UUID].type,
                  parent: acc.displayName,
                  characteristic: api.hap.Characteristic[subtypes[characteristic.UUID].name],
                  options: false
                };
                currentDevices.set(acc.UUID + '-' + extraCharacteristic.subtype, extraCharacteristic);
              }
            });
          }
        });
      }
    });
      
    return currentDevices;  
  
  }
  
  async function initReboot(file){
  
    let exists = await fs.pathExists(file);
    
    return new Promise((resolve, reject) => {
    
      if(exists){
      
        file = 'sh ' + file;
      
        const exec = require('child_process').exec;
        
        exec(file, (error, stdout, stderr) => {
         
          if (error && error.code > 0)
            return reject(error);
          
          resolve(stdout? stdout : stderr);
         
        });
      
      } else {
      
        reject('File not exists!');
        
      }
    
    });
  
  }
  
  function colortemp2api(param){
    if (param > 6200)
      return 6500;
    else if (param > 5600)
      return 5900;
    else if (param > 5000)
      return 5300;
    else if (param > 4500)
      return 4700;
    else if (param > 4000)
      return 4200;
    else if (param > 3600)
      return 3800;
    else if (param > 3200)
      return 3400;
    else if (param > 2850)
      return 3000;
    else
      return 2700;
  }
  
  function getValidColor(accessory, hue, sat){
  
    hue = hue || accessory.getService(api.hap.Service.Lightbulb).getCharacteristic(api.hap.Characteristic.Hue).value; 
    sat = Math.round((sat || accessory.getService(api.hap.Service.Lightbulb).getCharacteristic(api.hap.Characteristic.Saturation).value) * 2.55);
  
    //               orange        yellow       lime        green       turqoise       cyan        lightblue       blue          purple      magenta        pink           red
    let hues = [       35,          52,          92,         120,         160,          195,          212,          225,          266,         296,          335,          358     ];
    let sats = [ [72,140,214], [51,102,153], [38,79,123], [38,82,160], [41,84,145], [59,118,179], [56,110,169], [67,135,204], [54,110,169], [46,92,140], [51,107,180], [54,112,180] ];
    
    let validHue = hues.reduce((prev, curr) => Math.abs(curr - hue) < Math.abs(prev - hue) ? curr : prev);
    let indexHue = hues.indexOf(validHue);
    let satsByIndex = sats[indexHue];
    let validSat = satsByIndex.reduce((prev, curr) => Math.abs(curr - sat) < Math.abs(prev - sat) ? curr : prev);
    
    return {hue: validHue, sat: validSat};
  
  }
  
  function handleError(accessory, state, target, err, action){
  
    let mode = action.poll ? 'polling' : (action.get ? 'getting' : 'setting');
  
    if((err.code && (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'EHOSTUNREACH' || err.code === 'ECONNRESET')) || (err.message && (err.message.includes('Not Found')))){
      Logger.warn('Device seems to be offline' + ' (' + target + ')', accessory.displayName);
      if(state === 1){
        state = 0;
      } else if(state === 0) {
        state = 1;
      } else if(state === true){
        state = false;
      } else if(state === false) {
        state = true;
      }
    } else if(err.message && err.message.includes('500')){
      Logger.warn('Could not process the request during ' + mode + ' state' + ' (' + target + ')', accessory.displayName);
    } else {
      Logger.error('An error occured during ' + mode + ' state' + ' (' + target + ')', accessory.displayName);
      Logger.error(err);
    }
    
    return state;
  
  }
  
  return {
    get: get,
    set: set,
    change: change,
    poll: poll,
    refreshHosts: refreshHosts,
    refreshSmarthome: refreshSmarthome
  };

};
