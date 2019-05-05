'use strict';

class SidHandler {
  constructor (platform, device) {

    this.log = platform.log;
    this.logger = platform.logger;
    this.debug = platform.debug;

    this.device = device;
    
    this.sid = false;
    
  }
  
  async generateSID(){
  
    try{
    
      let sid = this.device.services['urn:dslforum-org:service:DeviceConfig:1']; 
      sid = await sid.actions['X_AVM-DE_CreateUrlSID']();
      
      return this.sid = sid['NewX_AVM-DE_UrlSID'].split('sid=')[1];
    
    } catch(err){
    
      throw err;
    
    }
  
  }
  
  async getSID(newSid){
  
    try {
    
      if(newSid || !this.sid)
        this.sid = await this.generateSID();
        
      return this.sid;
    
    } catch(err){
    
      throw err;
    
    }

  }

}

module.exports = SidHandler;