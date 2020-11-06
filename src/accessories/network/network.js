'use strict';

const Logger = require('../../helper/logger.js');

class WatchNetworkService {

  constructor (devices, telegram, polling) {
    
    this.devices = devices;
    this.Telegram = telegram;
    this.polling = polling;
    
    for(const [uuid, device] of this.devices)
      this.start(device);

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  async start (device) {
  
    let validMAC = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
    let timer = !isNaN(parseInt(device.timer)) ? (device.timer < 10 ? 10 : device.timer) : 10;
  
    try {
      
      let service = 'X_AVM-DE_GetSpecificHostEntryByIP';
      let input = {NewIPAddress: device.address};
      
      if(validMAC.test(device.address)){
        service = 'GetSpecificHostEntry';
        input = {NewMACAddress: device.address};
      }
      
      let data = await device.fritzbox.exec('urn:dslforum-org:service:Hosts:1', service, input);
      Logger.debug(data, device.name);
      
      let newState = parseInt(data.NewActive);
      
      device.passed = false;
      
      if(device.state !== undefined){
      
        if(device.onDelay || device.offDelay){
        
          if(device.state !== newState){
          
            if(device.changedOn){
            
              let millis = Date.now() - device.changedOn;
              let secElapsed = Math.floor(millis / 1000);
              
              if(newState){
              
                if(device.onDelay){
                
                  if(secElapsed > device.onDelay){
                    device.passed = true;
                  }
                
                } else {
                
                  //no onDelay in config
                  device.passed = true;
                
                }
                
              } else {
              
                if(device.offDelay){
                
                  if(secElapsed > device.offDelay){
                    device.passed = true;
                  }
                
                } else {
                
                  //no offDelay in config
                  device.passed = true;
                
                }
              
              }  
              
            } else {
            
              if((newState && device.onDelay) || (!newState && device.offDelay)){
                device.changedOn = Date.now();
              }
              
              if(device.changedOn){
                Logger.info('State changed to ' + (newState ? 'DETECTED' : 'NOT DETECTED'), device.name);
                
                device.informed = true;
                
                if(newState){
                  Logger.info('Wait ' + device.onDelay + 's before switching state!', device.name);
                } else {
                  Logger.info('Wait ' + device.offDelay + 's before switching state!', device.name);
                }
              } else {
                device.passed = true;
              }
            
            }
          
          } else {
          
            if(device.informed && device.changedOn){
            
              device.informed = false;
              device.changedOn = false;
               
              Logger.info('State switched back to ' + (newState ? 'DETECTED' : 'NOT DETECTED'), device.name);
               
            }
          
          }
        
        } else {
        
          //no off/on delay in config
          if(device.state !== newState){
            device.passed = true;
          }
        
        }
      
      } else {
      
        //first call
        device.state = newState;
      
      }
      
      if(device.passed){
        device.state = newState;
        device.changedOn = false;
        if(newState){
          if(this.Telegram)
            this.Telegram.send('network', 'on', device.name);
        } else {
          if(this.Telegram)
            this.Telegram.send('network', 'off', device.name);
        }
      }
    
    } catch(err) {
   
      Logger.error('An error occured during polling network device!', device.name);
      Logger.error(err);
   
    } finally {
  
      setTimeout(() => {
        this.start(device);
      }, timer * 1000);
  
    }
    
  }

}

module.exports = WatchNetworkService;
