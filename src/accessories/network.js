'use strict';

const Logger = require('../helper/logger.js');

const { Fritzbox } = require('@ulfalfa/fritzbox');

class watchNetwork {

  constructor (devices, telegram, masterDevice, polling) {
    
    this.devices = devices;
    this.Telegram = telegram;
    this.polling = polling;
    
    const fb_options = {
      host: masterDevice.host,
      port: masterDevice.port || 49000,
      username: masterDevice.username,
      password: masterDevice.password,
      ssl: true
    };
    
    this.timer = 60;
    
    //const url = (fb_options.ssl ? 'https://' : 'http://') + fb_options.host + ':' + (fb_options.ssl ? 49443 : fb_options.port) + '/tr64desc.xml';
    const url = 'https://' + fb_options.host + ':49443/tr64desc.xml'; 
    
    this.fritzbox = new Fritzbox({ username: fb_options.username, password: fb_options.password, url: url });
    
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
        
        let data = await this.fritzbox.exec('urn:dslforum-org:service:Hosts:1', service, input);
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
        
        Logger.debug(data, device.name)
      
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