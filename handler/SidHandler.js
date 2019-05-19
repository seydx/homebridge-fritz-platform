'use strict';

class SidHandler {
  constructor (platform) {

    this.log = platform.log;
    this.logger = platform.logger;
    this.debug = platform.debug;
    
    this.sid = false;
    
    this.deviceHandler = [];
    
  }
  
  async generateSID(device){
  
    try{
    
      let sid = device.services['urn:dslforum-org:service:DeviceConfig:1']; 
      sid = await sid.actions['X_AVM-DE_CreateUrlSID']();
      
      this.deviceHandler[device.deviceInfo.friendlyName] = sid['NewX_AVM-DE_UrlSID'].split('sid=')[1];
      
      return this.deviceHandler[device.deviceInfo.friendlyName];
    
    } catch(err){
    
      throw err;
    
    }
  
  }
  
  async getSID(newSid, device){
  
    try {
    
      if(newSid || !this.deviceHandler[device.deviceInfo.friendlyName])
        this.sid = await this.generateSID(device);
        
      return this.sid;
    
    } catch(err){
    
      throw err;
    
    }

  }

}

module.exports = SidHandler;