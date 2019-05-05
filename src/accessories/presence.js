'use strict';

const moment = require('moment');

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
  
  getStates(){
  
    let hosts = this.hosts.getHostList();
    
    if(hosts){
    
      if(this.accessory.displayName !== 'Anyone'){
    
        hosts.map( host => {
      
          if(this.accessory.context.address == host.MACAddress || this.accessory.context.address == host.IPAddress){
          
            this.accessory.context.lastState = this.mainService.getCharacteristic(Characteristic.OccupancyDetected).value;
            this.accessory.context.newState = parseInt(host.Active);
          
          }
      
        });
      
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
   
      setTimeout(this.getStates.bind(this), 1000);
    
    } else {
    
      setTimeout(this.getStates.bind(this), 1000);
    
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

}

module.exports = PresenceAccessory;
