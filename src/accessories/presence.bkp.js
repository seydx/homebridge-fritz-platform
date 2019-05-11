'use strict';

const api = require('../../lib/TR064.js');

const moment = require('moment');
const axios = require('axios');
const parseString = require('xml2js').parseString;

var Service, Characteristic;

class PresenceAccessory {
  constructor (platform, accessory, hosts) {

    // HB
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;

    this.platform = platform;
    this.log = platform.log;
    this.logger = platform.logger;
    this.debug = platform.debug;
    this.api = platform.api;
    this.config = platform.config;
    this.accessories = platform.accessories;
    
    this.devices = []; //without mesh
    
    this.tcp = platform.tcp;
    this.telegram = platform.telegram;
    this.hosts = hosts;
    
    this.accessory = accessory;
    this.mainService = this.accessory.getService(Service.OccupancySensor);
    
    this.getService();
    
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService () {
  
    this.mainService.getCharacteristic(Characteristic.OccupancyDetected)
      .on('change', this.changeOccupany.bind(this));

    this.mainService.getCharacteristic(Characteristic.StatusActive)
      .updateValue(true);

    this.mainService.getCharacteristic(Characteristic.StatusFault)
      .updateValue(0);

    this.mainService.getCharacteristic(Characteristic.StatusTampered)
      .updateValue(0);

    this.mainService.getCharacteristic(Characteristic.StatusLowBattery)
      .updateValue(0);

    this.getStates();

  }
  
  async getStates(){
  
    let hosts;
    
    try {
    
      if(this.hosts){ //mesh
      
        hosts = this.hosts.getHostList();
      
      } else { //no mesh
    
        hosts = true;
    
      }
    
      if(hosts){
    
        if(this.accessory.displayName !== 'Anyone'){
      
          //mesh
    
          if(this.hosts){
    
            hosts.map( host => {

              if(this.accessory.context.address == host.MACAddress[0] || this.accessory.context.address == host.IPAddress[0]){
          
                this.accessory.context.lastState = this.mainService.getCharacteristic(Characteristic.OccupancyDetected).value;
                this.accessory.context.newState = parseInt(host.Active[0]);
          
              }
      
            });
          
          } else { //no mesh
        
            let devices = [];
            let hostList = [];
        
            for(const accessory of this.accessories){
          
              if(accessory.context.type === 'dsl' || accessory.context.type === 'cable' || accessory.context.type === 'repeater'){
            
                devices.push({
                  name: accessory.displayName,
                  host: accessory.context.host,
                  port: accessory.context.port,
                  username: accessory.context.username,
                  password: accessory.context.password,
                  timeout: accessory.context.timeout,
                  type: accessory.context.type
                });
            
              }
          
            }
          
            for(const config of devices){
          
              if(!this.devices[config.name]){
            
                let dev = await this.generateApi(config);
                this.devices.push(dev);
            
              }
         
            }
          
            for(const device of this.devices){
            
              let list = await this.getHosts(device);
            
              if(list)
                hostList.concat(list);
         
            }
          
            hostList.map( host => {

              if(this.accessory.context.address == host.MACAddress[0] || this.accessory.context.address == host.IPAddress[0]){
          
                this.accessory.context.lastState = this.mainService.getCharacteristic(Characteristic.OccupancyDetected).value;
                this.accessory.context.newState = parseInt(host.Active[0]);
          
              }
      
            });
        
          }
      
          if(this.accessory.context.newState === 1){
       
            if(!this.accessory.context.lastState && this.accessory.context.onDelay>0){
       
              if(!this.represenceTime)
                this.represenceTime = moment().unix();
          
              if((moment().unix() - this.represenceTime) <= (this.accessory.context.onDelay/1000)){
            
                this.accessory.context.lastState = 0;
            
                if(!this.reinfo){
             
                  this.logger.info(this.accessory.displayName + ': Presence detected! Re-Presence delay is active.');
            
                  this.logger.info(this.accessory.displayName + ': Wait ' + (this.accessory.context.onDelay/1000) + ' seconds before switching to presence detected');
             
                  this.reinfo = true;
                  this.reretry = true;
            
                }
         
              } else {
            
                this.accessory.context.lastState = 1;
            
                if(this.reinfo){
             
                  this.logger.info(this.accessory.displayName + ': Presence still after ' + (this.accessory.context.onDelay/1000) + ' seconds');
             
                  this.logger.info(this.accessory.displayName + ': Switching to presence detected');
             
                  //Reset
                  this.reinfo = false;
                  this.represenceTime = false;
                  this.reretry = false;
          
                }
          
                if(this.retry){
             
                  this.logger.info(this.accessory.displayName + ': Presence detected again');
              
                  //Reset
                  this.info = false;
                  this.presenceTime = false;
                  this.retry = false;
          
                }
         
              }
      
            } else {
          
              this.accessory.context.lastState = 1;
          
              if(this.retry){
            
                this.logger.info(this.accessory.displayName + ': Presence detected again');
            
                //Reset
                this.info = false;
                this.presenceTime = false;
                this.retry = false;
          
              }
       
            }
    
          } else {
        
            if(this.accessory.context.newState !== undefined){
          
              if(this.accessory.context.lastState && this.accessory.context.offDelay>0){
           
                if(!this.presenceTime)
                  this.presenceTime = moment().unix();
           
                if((moment().unix() - this.presenceTime) <= (this.accessory.context.offDelay/1000)){
             
                  this.accessory.context.lastState = 1;
            
                  if(!this.info){
              
                    this.logger.info(this.accessory.displayName + ': No presence! Presence delay is active.');
             
                    this.logger.info(this.accessory.displayName + ': Wait ' + (this.accessory.context.offDelay/1000) + ' seconds before switching to no presence');
             
                    this.info = true;
                    this.retry = true;
           
                  }
          
                } else {
            
                  this.accessory.context.lastState = 0;
             
                  if(this.info){
             
                    this.logger.info(this.accessory.displayName + ': No presence after ' + (this.accessory.context.offDelay/1000) + ' seconds');
               
                    this.logger.info(this.accessory.displayName + ': Switching to no presence');
              
                    //Reset
                    this.info = false;
                    this.presenceTime = false;
                    this.retry = false;
             
                  }
            
                  if(this.reretry){
            
                    this.logger.info(this.accessory.displayName + ': Again no presence');
               
                    //Reset
                    this.reinfo = false;
                    this.represenceTime = false;
                    this.reretry = false;
             
                  }
          
                }
       
              } else {
            
                this.accessory.context.lastState = 0;
          
                if(this.reretry){
             
                  this.logger.info(this.accessory.displayName + ': Again no presence');
            
                  //Reset
                  this.reinfo = false;
                  this.represenceTime = false;
                  this.reretry = false;
          
                }
        
              }
       
            }
    
          }          
   
        } else {
      
          let states = [];
      
          this.accessories.map( accessory => {
      
            if(accessory.context.type == 'presence' && accessory.displayName !== 'Anyone')
              states.push(accessory.context.lastState);
      
          });
     
          if(states.includes(1)){
        
            this.accessory.context.lastState = 1;
     
          } else {
       
            this.accessory.context.lastState = 0;
    
          }
  
        }
        this.mainService.getCharacteristic(Characteristic.OccupancyDetected).updateValue(this.accessory.context.lastState);
    
      }
    
    } catch(err){
    
      this.logger.info(this.accessory.displayName + ': An error occured while fetching devices for presence');
      this.debug(JSON.stringify(err, null, 4));
    
    } finally {
    
      if(!hosts || hosts !== true){
      
        setTimeout(this.getStates.bind(this), 1000);
        
      } else {
        
        setTimeout(this.getStates.bind(this), this.accessory.context.polling);
      
      }
    
    }
    
  }

  changeOccupany(value){

    if(this.accessory.displayName !== 'Anyone'){
      
      if(value.newValue){
        
        if(this.telegram){
                
          if(this.telegram.checkTelegram('presence', 'in')){
                  
            this.telegram.sendTelegram('presence', 'in', this.accessory.displayName);
                    
          }
                
        }
        
        this.logger.info('Welcome at home ' + this.accessory.displayName);
      
      } else {
      
        if(this.telegram){
                
          if(this.telegram.checkTelegram('presence', 'out')){
                  
            this.telegram.sendTelegram('presence', 'out', this.accessory.displayName);
                    
          }
                
        }
        
        this.logger.info('Bye Bye ' + this.accessory.displayName);
    
      }
   
    } else {
     
      if(value.newValue){
      
        if(this.telegram){
                
          if(this.telegram.checkTelegram('presence', 'anyoneIn')){
                  
            this.telegram.sendTelegram('presence', 'anyoneIn');
                    
          }
                
        }
        
        this.logger.info('Presence detected at home!');
    
      } else {
      
        if(this.telegram){
                
          if(this.telegram.checkTelegram('presence', 'anyoneOut')){
                  
            this.telegram.sendTelegram('presence', 'anyoneOut');
                    
          }
                
        }
        
        this.logger.info('Nobody at home!');
      
      }
  
    }

  }
  
  async generateApi(config){
  
    try{
    
      let TR064 = new api.TR064(config, this.logger);  
      TR064 = await TR064.initDevice();
        
      let device = await TR064.startEncryptedCommunication();
    
      return device;
    
    } catch(err){
    
      throw err;
    
    }

  }
  
  async getHosts(device){
  
    try {
    
      let hosts = device.services['urn:dslforum-org:service:Hosts:1'];
      hosts = await hosts.actions['X_AVM-DE_GetHostListPath']();
      
      let list = await this.generateHostList(hosts['NewX_AVM-DE_HostListPath'], device);
      
      return list;
    
    } catch(err){
    
      throw err;
    
    }
  
  }
  
  async generateHostList(endpoint, device){
  
    try {
    
      let ping = await this.tcp('Presence', device.config.host, device.config.port);
      
      if(ping){
    
        let url = 'http://' + device.config.host + ':' + device.config.port + endpoint;
        let hostArray = [];
      
        let hostList = await axios(url);  
        let hostListXML = await this.xmlParser(hostList.data);
        
        hostArray = hostArray.concat(hostListXML.List.Item);
        
        return hostArray;
        
      } else {
      
        this.debug('Presence: Network currently not available!');
        return false;
        
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
  
  xmlParser(xml){
  
    return new Promise((resolve, reject) => {
    
      parseString(xml, (err, result) => err ? reject(err) : resolve(result) );
   
    });
    
  }

}

module.exports = PresenceAccessory;
