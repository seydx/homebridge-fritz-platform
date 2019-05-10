'use strict';

const axios = require('axios');
const parseString = require('xml2js').parseString;

class SmarthomeHandler {
  constructor (platform, config, device, sid) {

    this.log = platform.log;
    this.logger = platform.logger;
    this.debug = platform.debug;
    this.tcp = platform.tcp;
    this.platform = platform;

    this.config = config;
    this.device = device;
    this.sid = sid;
    
    this.generateSmarthomeList();
    
  }
  
  async generateSmarthomeList(){
  
    try {
    
      let ping = await this.tcp('Smarthome List', this.config.host, this.config.port);
      
      if(ping){
        
        let sid = await this.sid.getSID();
    
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
    
      } else {
      
        this.debug('Smarthome List: Network currently not available!');
        setTimeout(this.generateSmarthomeList.bind(this), 30000);
      
      }
    
    } catch(error){
    
      if(error.response)
        error = {
          status: error.response.status,
          message: error.response.statusText,
          config: error.config,
          data: error.response.data
        };
      
      this.logger.error('Smarthome List: An error occured while genersting smarthome list!');
      this.debug(JSON.stringify(error,null,4));
      
      setTimeout(this.generateSmarthomeList.bind(this), 15000);
    
    }
  
  }
  
  xmlParser(xml){
  
    return new Promise((resolve, reject) => {
    
      parseString(xml, (err, result) => err ? reject(err) : resolve(result) );
   
    });
    
  }
  
  async sendCommand(name, ain, cmd){
  
    try {
  
      let ping = await this.tcp(name, this.config.host, this.config.port);
      let device = await this.getDevice(ain);
      
      if(ping && device){
        
        let sid = await this.sid.getSID();
    
        let url = 'http://' + this.config.host + '/webservices/homeautoswitch.lua?ain=' + ain + '&switchcmd=' + cmd + '&sid=' + sid;
        
        await axios(url);  
        
      } else {
      
        throw('Network currently not available!');
       
      }
      
    } catch(error){
    
      if(error.response)
        error = {
          status: error.response.status,
          message: error.response.statusText,
          config: error.config,
          data: error.response.data
        };
      
      throw error;
      
      
    }
  
  }
  
  getSmarthomeList(){
  
    if(this.smarthome)
      return this.smarthome;
      
    return false;
  
  }
  
  getDevice(ain){
  
    if(!this.smarthome) 
      return false;
      
    for(const device of this.smarthome){
      if(ain === device.ain)
        return device;
    }
    
    return false;
  
  }

}

module.exports = SmarthomeHandler;