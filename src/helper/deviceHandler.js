'use strict';

const Logger = require('./logger.js');
const lua = require('./lua.js');

const fs = require('fs-extra');
const moment = require('moment');
const ping = require('ping');
const speedTest = require('speedtest-net');

const { requestXml } = require('@seydx/fritzbox/dist/lib/request');

module.exports = (api, devices, configPath, Telegram, presenceOptions, polling, reboot) => {

  async function get(accessory, service, characteristic, target, config, callback){
    
    Logger.debug((typeof callback !== 'function' ? 'Polling' : 'Getting') + ' state (' + target + ')...', accessory.displayName); 
  
    let fritzbox = accessory.context.config.fritzbox;
    
    if(typeof callback === 'function')
      callback(null, accessory.getService(service).getCharacteristic(characteristic).value);
  
    switch (target) {
    
      case 'smarthome-contact': {
      
        //not implemented yet
        break;
      
      }
      
      case 'smarthome-switch': {
      
        //not implemented yet
        break;
      
      }
      
      case 'smarthome-thermostat': {
      
        //not implemented yet
        break;
      
      }
    
      case 'presence': {
      
        let state = accessory.getService(service).getCharacteristic(characteristic).value ? 1 : 0; 
         
        try {

          let validMAC = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
          let service = 'X_AVM-DE_GetSpecificHostEntryByIP';
          let input = {NewIPAddress: accessory.context.config.address};
          
          if(validMAC.test(accessory.context.config.address)){
            service = 'GetSpecificHostEntry';
            input = {NewMACAddress: accessory.context.config.address};
          }
          
          let data = await fritzbox.exec('urn:dslforum-org:service:Hosts:1', service, input);
          Logger.debug(data, accessory.displayName);
         
          let newState = parseInt(data.NewActive);
          
          if(newState === state && accessory.context.config.ping){
            
            let threshold = !isNaN(accessory.context.config.threshold) ? accessory.context.config.threshold : 15;

            let address = data.NewIPAddress ? data.NewIPAddress : accessory.context.config.address;
              
            let res = await ping.promise.probe(address, { timeout: 3 });
            res.alive = res.alive ? 1 : 0;
            
            if(res.alive !== newState){
            
              if(res.alive){ 
              
                accessory.context.lastSeen = Date.now(); 
                newState = res.alive;
                
                Logger.debug('Ping and FritzBox states are not equal.', accessory.displayName);
                Logger.debug('Taking the value of Ping.', accessory.displayName);
           
              } else { 
              
                if(accessory.context.lastSeen){
                
                  let lastSeenMoment = moment(accessory.context.lastSeen);
                  let activeThreshold = moment().subtract(threshold, 'm');
                  
                  newState = lastSeenMoment.isAfter(activeThreshold) ? 1 : 0;
                  
                  Logger.debug('Ping and FritzBox states are not equal.', accessory.displayName);
                  Logger.debug('Taking the value of Ping.', accessory.displayName);
             
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
         
          let body = await lua.requestLUA({
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
         
          let body = await lua.requestLUA({
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
         
          let body = await lua.requestLUA({
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
            
            let body = await lua.requestLUA(formdata, accessory.context.config.fritzbox.url.hostname, '/data.lua', 'nightsetting'); 
            
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
        
        try {
         
          let data = await speedTest({
            acceptLicense: true,
            acceptGdpr: true
          });
          
          Logger.debug(data, accessory.displayName);
           
          let dl = (data.download.bandwidth * 8 / 1000 / 1000).toFixed(1);
          let ul = (data.upload.bandwidth * 8/ 1000 / 1000).toFixed(1);
          let ping = data.ping.latency.toFixed(0);
          
          accessory
            .getService(service)
            .getCharacteristic(api.hap.Characteristic.Download)
            .updateValue(dl);
           
          accessory
            .getService(service)
            .getCharacteristic(api.hap.Characteristic.Upload)
            .updateValue(ul);
             
          accessory
            .getService(service)
            .getCharacteristic(api.hap.Characteristic.Ping)
            .updateValue(ping);
         
        } catch(err) {
        
          handleError(accessory, false, target, err, typeof callback === 'function' ? {get: true} : {poll: true});
       
        }
        
        accessory
          .getService(service)
          .getCharacteristic(characteristic)
          .updateValue(state);
         
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
    
    callback(null, state);
  
    switch (target) {
    
      case 'smarthome-contact': {
      
        //not implemented yet
        break;
      
      }
      
      case 'smarthome-switch': {
      
        //not implemented yet
        break;
      
      }
      
      case 'smarthome-thermostat': {
      
        //not implemented yet
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
          
        } else if(accessory.context.config.readOnly){
        
          Logger.info('Can not be switched OFF! "readOnly" is active!', accessory.displayName);
        
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
            
          await lua.requestLUA(formData, accessory.context.config.fritzbox.url.hostname, '/data.lua');
          
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
         
          await fritzbox.exec('urn:dslforum-org:service:X_AVM-DE_TAM:1', 'SetEnable', {NewIndex: 0, NewEnable: state});
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
         
          await lua.requestLUA(formData, accessory.context.config.fritzbox.url.hostname, '/data.lua');
          
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
         
          await lua.requestLUA({
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
            await lua.requestLUA(formdata, accessory.context.config.fritzbox.url.hostname, '/data.lua', 'nightsetting');
            
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
         
      case 'broadband': {
      
        Logger.info((state ? 'ON' : 'OFF') + ' not supported!' + ' (' + target + ')', accessory.displayName);
       
        setTimeout(() => {
          accessory
            .getService(service)
            .getCharacteristic(characteristic)
            .updateValue(false);
        }, 1000);
         
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
          
            /*let okz = fritzbox.exec('urn:dslforum-org:service:X_VoIP:1', 'X_AVM-DE_GetVoIPCommonAreaCode');
            okz = okz['NewX_AVM-DE_OKZPrefix'] + okz['NewX_AVM-DE_OKZ'];
            okz = parseInt(okz);  //05341 */
            
            let lkz = fritzbox.exec('urn:dslforum-org:service:X_VoIP:1', 'X_AVM-DE_GetVoIPCommonCountryCode');
            lkz = parseInt(lkz['NewX_AVM-DE_LKZ']); //49 => 0049 => +49      
            
            
            let blacklists = config.blacklists &&
                             config.blacklists.length
              ? config.blacklists.map(ex => ex.name).filter(ex => ex && ex.length)
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
                     
                      for(const number of numbers){
                  
                        let telnr = number._;
                    
                        telnr = telnr.replace(/\s/g, '');    
                        
                        let nr = '+' + lkz;
                        let nr2 = '00' + lkz;
                      
                        if(telnr.includes(nr) || telnr.includes(nr2)){
                      
                          telnr = telnr.replace(nr, '0').replace(nr2, '0').replace(/[^a-zA-Z0-9]/g,'');
                   
                        } else {
                       
                          telnr = telnr.replace('+', '00').replace(/[^a-zA-Z0-9]/g,'');
                    
                        }
                      
                        telBook.push({name: contact.person.realName,number:telnr});
      
                        if(blacklists.includes(bookName))
                          blackBook.push({name: contact.person.realName,number:telnr});
      
                      }
                     
                    } else {
                     
                      let nr = '+' + lkz;
                      let nr2 = '00' + lkz;
                      let telnr = numbers._;
                   
                      telnr = telnr.replace(/\s/g, '');
                           
                      if(telnr.includes(nr) || telnr.includes(nr2)){
                      
                        telnr = telnr.replace(nr, '0').replace(nr2, '0').replace(/[^a-zA-Z0-9]/g,'');
                    
                      } else {
                      
                        telnr = telnr.replace('+', '00').replace(/[^a-zA-Z0-9]/g,'');
                    
                      }
                    
                      telBook.push({name: contact.person.realName,number:telnr});
                  
                      if(blacklists.includes(bookName))
                        blackBook.push({name: contact.person.realName,number:telnr});
                     
                    }
                   
                  }
                
                }
              
              } else {
              
                Logger.debug('Phonebook [' + id + '] does not contain any contacts. Skipping..', accessory.displayName);  
              
              }
              
              Logger.debug('Phone book [' + id + '] done.', accessory.displayName);
            
            }
            
            Logger.info('Storing phonebook results to ' + configPath + '/phonebook.json', accessory.displayName);
            await fs.ensureFile(configPath + '/phonebook.json');
            await fs.writeJson(configPath + '/phonebook.json', telBook, { spaces: 2 });
            
            if(blackBook.length){
              Logger.info('Storing blackbook results to ' + configPath + '/blackbook.json', accessory.displayName);
              await fs.ensureFile(configPath + '/blackbook.json');
              await fs.writeJson(configPath + '/blackbook.json', blackBook, { spaces: 2 });
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
  
    switch (target) {
    
      case 'smarthome-contact': {

        //not implemented yet
        break;
        
      }  
      
      case 'smarthome-switch': {

        //not implemented yet
        break;
        
      } 
      
      case 'smarthome-thermostat': {

        //not implemented yet
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
        
        Telegram.send('presence', dest, replacer === 'Anyone' ? false : replacer);
      
        break;
      
      }  
      
      case 'network': {
        
        Telegram.send('network',  value.newValue ? 'on' : 'off', replacer);
      
        break;
        
      }  
        
      case 'alarm': {

        Telegram.send('alarm', value.newValue ? 'activated' : 'deactivated');
      
        break;
        
      }
        
      case 'router': {

        if(!accessory.context.config.readOnly)
          Telegram.send('reboot', value.newValue ? 'finish' : 'start', accessory.displayName);
      
        break;
        
      }  
        
      case 'callmonitor': {

        Telegram.send('callmonitor', value.state, replacer);
      
        break;
       
      }
        
      default: {
      
        //fall through
        break;
        
      }
    
    }
    
    return;
  
  }
  
  async function poll(accessories){
  
    if(devices.size){
      
      let allDevices = handleCharacteristics(accessories);
       
      for(const [uuid, device] of allDevices){
        
        if(!polling.exclude.includes(device.subtype) && !polling.exclude.includes(device.type) && !polling.exclude.includes(device.name)){
        
          const accessory = accessories.find(curAcc => curAcc.UUID === uuid || (curAcc.UUID + '-' + device.subtype) === uuid);
         
          switch (device.type) {
            
            case 'router': {
           
              await get(accessory, api.hap.Service.Switch, api.hap.Characteristic.On, device.type);
           
              break;
              
            }
           
            case 'extra': {
            
              let characteristic = device.characteristic || api.hap.Characteristic.On;
            
              await get(accessory, api.hap.Service.Switch, characteristic, device.subtype, device.options);
            
              break;
              
            }
            
            case 'presence': {
            
              if(accessory.displayName !== 'Anyone'){
                let accService = device.accType === 'occupancy' 
                  ? api.hap.Service.OccupancySensor
                  : api.hap.Service.MotionSensor; 
                let accCharacteristic = device.accType === 'occupancy' 
                  ? api.hap.Characteristic.OccupancyDetected
                  : api.hap.Characteristic.MotionDetected; 
                await get(accessory, accService, accCharacteristic, device.type);
              } 
            
              break;
              
            }
            
            case 'smarthome-contact': {
              
              //not implemented yet
              break;
            
            }
            
            case 'smarthome-switch': {
              
              //not implemented yet
              break;
            
            }
            
            case 'smarthome-thermostat': {
              
              //not implemented yet
              break;
            
            }
              
            default: {
            
              // fall through
              break;
           
            }
         
          }
        
        }
       
      }
     
      setTimeout(() => {
        poll(accessories);
      }, polling.timer);
    
    }
  
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
  
  function handleError(accessory, state, target, err, action){
  
    let mode = action.poll ? 'polling' : (action.get ? 'getting' : 'setting');
  
    if((err.code && (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'EHOSTUNREACH' || err.code === 'ECONNRESET')) || (err.message && (err.message.includes('Not Found')))){
      Logger.warn('Device seems to be offline' + ' (' + target + ')', accessory.displayName);
      if(typeof state === 'number'){
        state = 0;
      } else if(typeof state === 'boolean'){
        state = false;
      } else {
        state = state ? !state : state;
      }
    } else if(err.message && err.message.includes('500')){
      Logger.warn('FritzBox could not process the request', accessory.displayName);
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
    poll: poll
  };

};