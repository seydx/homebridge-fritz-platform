'use strict';

const Logger = require('../helper/logger.js');

class watchNetwork {

  constructor (devices, telegram, polling) {
    
    this.devices = devices;
    this.Telegram = telegram;
    this.polling = polling;
    
    this.timer = 60;
    
    this.start();

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  async start () {
  
    let validMAC = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
  
    try {
    
      for(const [uuid, device] of this.devices){
      
        //let state = false;
        let service = 'X_AVM-DE_GetSpecificHostEntryByIP';
        let input = {NewIPAddress: device.address};
        
        if(validMAC.test(device.address)){
          service = 'GetSpecificHostEntry';
          input = {NewMACAddress: device.address};
        }
        
        let data = await device.fritzbox.exec('urn:dslforum-org:service:Hosts:1', service, input);
        let state = parseInt(data.NewActive);
        
        if(state) {
        
          if(this.state === undefined){
          
            this.state = state;
          
          } else {
          
            if(this.state !== state){
            
              this.state = state;
              this.Telegram.send('network', 'on', device.name);
            
            }
          
          }
        
        } else {
        
          if(this.state === undefined){
          
            this.state = state;
          
          } else {
          
            if(this.state !== state){
            
              this.state = state;
              this.Telegram.send('network', 'off', device.name);
            
            }
          
          }
        
        }
        
        Logger.debug(data, device.name);
      
      }
    
    } catch(err) {
   
      Logger.error('An error occured during polling network devices!');
      Logger.error(err);
   
    } finally {
  
      setTimeout(() => {
        this.start();
      }, this.timer * 1000);
  
    }
    
  }

}

module.exports = watchNetwork;
