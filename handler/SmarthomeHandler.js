'use strict';

const axios = require('axios');
const parseString = require('xml2js').parseString;

class SmarthomeHandler {
  constructor (platform, config, device) {

    this.log = platform.log;
    this.logger = platform.logger;
    this.debug = platform.debug;
    this.platform = platform;
    this.sid = platform.sid;

    this.config = config;
    this.device = device;
    
    this.generateSmarthomeList();
    
  }
  
  async generateSmarthomeList(refresh){
  
    try {
        
      let sid = await this.sid.getSID(refresh, this.device);
    
      let cmd = 'getdevicelistinfos';
      let url = 'http://' + this.config.host + '/webservices/homeautoswitch.lua?switchcmd=' + cmd + '&sid=' + sid;
        
      let smList = await axios(url);  
      let smListXML = await this.xmlParser(smList.data);
        
      let devices = smListXML.devicelist.device;
        
      if(!Array.isArray(devices))
        devices = [devices];

      devices = devices.map( device => {
  
        return {
          ain: device['$'].identifier.replace(/ /g, ''),
          name: device.name[0],
          present: parseInt(device.present[0]),
          options: {
            switch: device.switch ? { 
              ...device.switch[0]
            } : {},
            powermeter: device.powermeter ? {
              ...device.powermeter[0]
            } : {},
            hkr: device.hkr ? {
              ...device.hkr[0]
            } : {},
            temperature: device.temperature ? {
              ...device.temperature[0]
            } : {},
            alert: device.alert ? {
              ...device.alert[0]
            } : {}
          }
        };
  
      }).filter( dev => {
  
        for(const value in dev.options)
          if(!Object.keys(dev.options[value]).length)
            delete dev.options[value];
        
        if(!Object.keys(dev.options).length)
          delete dev.options;
        
        if(dev.options)
          return dev;
  
      }).filter( dev => {
        
        dev.ain = dev.ain.split('-')[0];
        return dev;
        
      });
        
      this.smarthome = devices;
        
      setTimeout(this.generateSmarthomeList.bind(this), this.platform.config.polling * 1000);
    
    } catch(error){
      
      if(error.response)
        error = {
          status: error.response.status,
          message: error.response.statusText,
          config: error.config,
          data: error.response.data
        };
    
      if(error.status === 403){
        
        this.debug('Smarthome List: Requesting new SID...');
        
        setTimeout(this.generateSmarthomeList.bind(this, true), 500);
      
      } else {
        
        this.logger.error('Smarthome List: An error occured while generating smarthome list!');
        
        if(error instanceof TypeError){
          console.log(error);
        } else {
          this.debug(error);
        }
        
        setTimeout(this.generateSmarthomeList.bind(this), 15000);
      
      }
    
    }
  
  }
  
  xmlParser(xml){
  
    return new Promise((resolve, reject) => {
    
      parseString(xml, (err, result) => err ? reject(err) : resolve(result) );
   
    });
    
  }
  
  async sendCommand(name, ain, cmd, refresh){
  
    try {
    
      let device = await this.getDevice(ain);
      
      if(device){
        
        let sid = await this.sid.getSID(refresh, this.device);
    
        let url = 'http://' + this.config.host + '/webservices/homeautoswitch.lua?ain=' + ain + '&switchcmd=' + cmd + '&sid=' + sid;
        
        await axios(url);
        
        return;  
        
      }
      
    } catch(error){
    
      if(error.response)
        error = {
          status: error.response.status,
          message: error.response.statusText,
          config: error.config,
          data: error.response.data
        };
 
      if(error.status === 403){
        
        this.debug('Smarthome List: Requesting new SID...');
        
        setTimeout(this.sendCommand.bind(this, name, ain, cmd, true), 500);
      
      } else {
        
        throw error;
      
      }
      
    }
  
  }
  
  getSmarthomeList(){
  
    return this.smarthome||false;
  
  }
  
  async getDevice(ain){
      
    if(this.smarthome)    
      for(const device of this.smarthome)
        if(ain === device.ain)
          return device;
    
    return false;
  
  }
  
  async getAllDevices(){
  
    return this.smarthome||false;
  
  }

}

module.exports = SmarthomeHandler;