'use strict';

const HomeKitTypes = require('../types/types.js');
const EveTypes = require('../types/eve.js');
const LogUtil = require('../../lib/LogUtil.js');
const moment = require('moment');
const store = require('json-fs-store');

var Service, Characteristic, FakeGatoHistoryService;

const timeout = ms => new Promise(res => setTimeout(res, ms));

class CallmonitorAccessory {
  constructor (platform, accessory) {

    // HB
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;
    
    HomeKitTypes.registerWith(platform.api.hap);
    EveTypes.registerWith(platform.api.hap);
    
    FakeGatoHistoryService = require('fakegato-history')(platform.api);

    this.platform = platform;
    this.log = platform.log;
    this.logger = new LogUtil(null, platform.log);
    this.debug = platform.debug;
    this.api = platform.api;
    this.config = platform.config;
    this.accessories = platform.accessories;
    this.HBpath = platform.HBpath;
    this.configPath = platform.configPath;
    this.call = {};
    
    this.cm = platform.cm;
    this.telegram = platform.telegram;

    this.accessory = accessory;
    this.mainService = this.accessory.getService(Service.ContactSensor);
    
    this.getService();

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  async getService () {

    if (!this.mainService.testCharacteristic(Characteristic.Adresse))
      this.mainService.addCharacteristic(Characteristic.Adresse);
    
    this.mainService.getCharacteristic(Characteristic.Adresse)
      .updateValue(this.accessory.context.ip+':'+this.accessory.context.port);

    if (!this.mainService.testCharacteristic(Characteristic.Host))
      this.mainService.addCharacteristic(Characteristic.Host);
    
    this.mainService.getCharacteristic(Characteristic.Host)
      .updateValue('FritzBox');

    if (!this.mainService.testCharacteristic(Characteristic.LastActivation))
      this.mainService.addCharacteristic(Characteristic.LastActivation);
    
    if (!this.mainService.testCharacteristic(Characteristic.TimesOpened))
      this.mainService.addCharacteristic(Characteristic.TimesOpened);
    
    if (!this.mainService.testCharacteristic(Characteristic.OpenDuration))
      this.mainService.addCharacteristic(Characteristic.OpenDuration);
    
    if (!this.mainService.testCharacteristic(Characteristic.ClosedDuration))
      this.mainService.addCharacteristic(Characteristic.ClosedDuration);
    
    if(this.accessory.displayName == 'Callmonitor Incoming'){
      
      if (!this.mainService.testCharacteristic(Characteristic.Caller))
        this.mainService.addCharacteristic(Characteristic.Caller);

    } else {
     
      if (!this.mainService.testCharacteristic(Characteristic.Called))
        this.mainService.addCharacteristic(Characteristic.Called);

    }
    
    this.historyService = new FakeGatoHistoryService('door', this.accessory, {storage:'fs',path:this.HBpath, disableTimer: false, disableRepeatLastData:false});
    this.historyService.log = this.log;

    this.getContactState();
    
    await timeout(2000);
    this.refreshHistory();

  }

  fritzboxDateToUnix(string) {
    
    let d = string.match(/[0-9]{2}/g);
    
    let result = '';
    result += '20' + d[2] + '-' + d[1] + '-' + d[0];
    result += ' ' + d[3] + ':' + d[4] + ':' + d[5];
    
    return Math.floor(new Date(result).getTime() / 1000);
 
  }

  parseMessage(buffer) {

    let message = buffer.toString()
      .toLowerCase()
      .replace(/[\n\r]$/, '')
      .replace(/;$/, '')
      .split(';');
    
    message[0] = this.fritzboxDateToUnix(message[0]);
    
    return message;
  
  }

  getContactState(){
  
    this.client = this.cm.getClient();
    
    if(this.client){
      
      this.debug(this.accessory.displayName + ': Client successfully initialized');
  
      this.client.on('data', async chunk => {
        
        try {
          
          let data = this.parseMessage(chunk);
        
          let text, message;
        
          this.accessory.context.timesOpened = this.accessory.context.timesOpened ? this.accessory.context.timesOpened : 0;
        
          if(this.accessory.displayName == 'Callmonitor Incoming'){
        
            if (data[1] === 'ring') {
            
              this.call[data[2]] = {
                type: 'inbound',
                start: data[0],
                caller: data[3],
                called: data[4]
              };
         
              message = {
                time: data[0],
                caller: data[3],
                called: data[4]
              };
              
              let lastState = 1;
              this.accessory.context.timesOpened += 1;
              let lastActivation = moment().unix() - this.historyService.getInitialTime();
              let closeDuration = moment().unix() - this.historyService.getInitialTime();
                  
              this.mainService.getCharacteristic(Characteristic.ContactSensorState)
                .updateValue(lastState);
                  
              this.mainService.getCharacteristic(Characteristic.LastActivation)
                .updateValue(lastActivation);
                  
              this.mainService.getCharacteristic(Characteristic.ClosedDuration)
                .updateValue(closeDuration);
                  
              this.mainService.getCharacteristic(Characteristic.TimesOpened)
                .updateValue(this.accessory.context.timesOpened);
              
              this.historyService.addEntry({time: moment().unix(), status: lastState});
          
              if(this.accessory.context.incomingTo.length){
              
                this.logger.info(this.accessory.displayName + ': Checking incoming calls only to nr ' + this.accessory.context.incomingTo);
              
                if(this.accessory.context.incomingTo.includes(message.called)){
            
                  this.logger.info(this.accessory.displayName + ': Incoming nr matched!');
                
                  text = 'Incoming call from: ' + message.caller + ' to ' + message.called;
                
                  this.callerNr = message.caller;
                  this.callerName = false;
               
                  let phonebook = await this.loadData('phonebook');
                
                  if(phonebook){
                  
                    for(const entry of phonebook.phonebook){
                
                      if(message.caller === entry.number){
                  
                        text = 'Incoming call from: ' + entry.name + ' ( '+ entry.number + ' ) to ' + message.called;
                        this.callerName = entry.name;
                        this.callerNr = entry.number;
                  
                      }
                
                    }
                    
                  }
                  this.mainService.getCharacteristic(Characteristic.Caller).updateValue(message.caller);
                
                  this.logger.info(text);
                
                  if(this.telegram){
                
                    if(this.telegram.checkTelegram('callmonitor', 'incoming')){
                  
                      this.telegram.sendTelegram('callmonitor', 'incoming', this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr, message.called);
                    
                    }
                
                  }
                
                } else {
             
                  this.logger.info(this.accessory.displayName + ': IncomingTo nr not matched. Receiving new call from ' + message.caller + ' to ' + message.called);
           
                }
         
              } else {
          
                text = 'Incoming call from: ' + message.caller + ' to ' + message.called;
            
                this.callerNr = message.caller;
                this.callerName = false;
              
                let phonebook = await this.loadData('phonebook');          
                
                if(phonebook){
                
                  for(const entry of phonebook.phonebook){
                
                    if(message.caller === entry.number){
                  
                      text = 'Incoming call from: ' + entry.name + ' ( '+ entry.number + ' ) to ' + message.called;
                      this.callerName = entry.name;
                      this.callerNr = entry.number;
                   
                    }
                
                  }
                
                }
            
                this.logger.info(text);
            
                this.mainService.getCharacteristic(Characteristic.Caller).updateValue(message.caller);
            
                if(this.telegram){
                
                  if(this.telegram.checkTelegram('callmonitor', 'incoming')){
                  
                    this.telegram.sendTelegram('callmonitor', 'incoming', this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr, message.called);
                    
                  }
                
                }
            
              }
          
            }
    
          }

          if(this.accessory.displayName == 'Callmonitor Outgoing'){
        
            if (data[1] === 'call') {
          
              this.call[data[2]] = {
                type: 'outbound',
                start: data[0],
                extension: data[3],
                caller: data[4],
                called: data[5]
              };
          
              message = {
                time: data[0],
                extension: data[3],
                caller: data[4],
                called: data[5]
              };
              
              let lastState = 1;
              this.accessory.context.timesOpened += 1;
              let lastActivation = moment().unix() - this.historyService.getInitialTime();
              let closeDuration = moment().unix() - this.historyService.getInitialTime();
              
              this.mainService.getCharacteristic(Characteristic.ContactSensorState)
                .updateValue(lastState);
                  
              this.mainService.getCharacteristic(Characteristic.LastActivation)
                .updateValue(lastActivation);
                 
              this.mainService.getCharacteristic(Characteristic.ClosedDuration)
                .updateValue(closeDuration);
              
              this.historyService.addEntry({time: moment().unix(), status: lastState});
          
              if(this.accessory.context.outgoingFrom.length){
            
                this.logger.info(this.accessory.displayName + ': Checking outgoing calls only from nr ' + this.accessory.context.outgoingFrom);
            
                if(this.accessory.context.outgoingFrom.includes(message.caller)){
              
                  this.logger.info(this.accessory.displayName + ': Outgoing from nr matched!');
              
                  let called = message.called.replace(/\D/g,''); 

                  text = 'Calling: ' + called;
                  this.callerName = false;
                  this.callerNr = called;
                
                  let phonebook = await this.loadData('phonebook');
                
                  if(phonebook){
                  
                    for(const entry of phonebook.phonebook){
                
                      if(called === entry.number){
                  
                        text = 'Calling ' + entry.name + ' ( '+ entry.number + ' )';
                        this.callerName = entry.name;
                        this.callerNr = entry.number;
                  
                      }
                
                    }
                  
                  }
                  this.mainService.getCharacteristic(Characteristic.Called).updateValue(called);
              
                  this.logger.info(text);
            
                } else {
             
                  this.logger.info(this.accessory.displayName + ': OutgoingFrom nr not matched. Calling from ' + message.caller + ' to ' + message.called);
           
                }
         
              } else {
              
                let called = message.called.replace(/\D/g,''); 
            
                text = 'Calling: ' + called;
                this.callerName = false;
                this.callerNr = called;
                
                this.mainService.getCharacteristic(Characteristic.Called).updateValue(called);
               
                let phonebook = await this.loadData('phonebook');
                
                if(phonebook){
                  
                  for(const entry of phonebook.phonebook){
                
                    if(called === entry.number){
                        
                      text = 'Calling ' + entry.name + ' ( '+ entry.number + ' )';
                      this.callerName = entry.name;
                      this.callerNr = entry.number;
                  
                    }
                
                  }
                    
                }
            
                this.logger.info(text);
        
              }
       
            }
      
          }

          if (data[1] === 'connect') {
        
            if(this.call[data[2]]){
          
              this.call[data[2]]['connect'] = data[0];
          
              message = {
                time: data[0],
                extension: this.call[data[2]]['extension'],
                caller: this.call[data[2]]['caller'],
                called: this.call[data[2]]['called']
              };
         
              this.logger.info('Connection established from: ' + message.caller + ' - to: ' + message.called);
        
            }
        
          }

          if (data[1] === 'disconnect') {
          
            let lastState = 0;
            let openDuration = moment().unix() - this.historyService.getInitialTime();
                  
            this.mainService.getCharacteristic(Characteristic.OpenDuration)
              .updateValue(openDuration);
                  
            this.mainService.getCharacteristic(Characteristic.ContactSensorState)
              .updateValue(lastState);
             
            this.historyService.addEntry({time: moment().unix(), status: lastState});    
      
            if(this.call[data[2]]){
          
              this.call[data[2]].disconnect = data[0];
              this.call[data[2]].duration = parseInt(data[3], 10);
          
              let call = this.call[data[2]];
              delete(this.call[data[2]]);
          
              message = call;
          
              if(this.accessory.context.incomingTo.length || this.accessory.context.outgoingFrom.length){
            
                if(this.accessory.context.incomingTo.includes(message.called)||this.accessory.context.outgoingFrom.includes(message.caller)){
             
                  this.logger.info('Call disconnected with ' + (this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr));
                
                  if(this.telegram){
                
                    if(this.telegram.checkTelegram('callmonitor', 'disconnected')){
                  
                      this.telegram.sendTelegram('callmonitor', 'disconnected', this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr);
                    
                    }
                
                  }
            
                } else {
            
                  if(message.type=='inbound'){
              
                    this.logger.info(this.accessory.displayName + ': Incoming to nr not matched. Call disconnected with ' + message.caller);
              
                  } else {
                
                    this.logger.info(this.accessory.displayName + ': Outgoing from nr not matched. Call disconnected with ' + message.called);
             
                  }
           
                }
         
              } else {
            
                this.logger.info('Call disconnected with ' + (this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr));
            
                if(this.telegram){
                
                  if(this.telegram.checkTelegram('callmonitor', 'disconnected')){
                  
                    this.telegram.sendTelegram('callmonitor', 'disconnected', this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr);
                    
                  }
                
                }
          
              }
       
            }
     
          }
          
        } catch(err){
          
          this.logger.error(this.accessory.displayName + ': An error occured while loading phonebook data');
        
          this.debug(JSON.stringify(err, null, 4));
          
        }
    
      });
      
      this.client.on('error', error => {
        
        this.logger.error(this.accessory.displayName + ': An error occured with callmonitor!');
        
        this.debug(error);
    
      });
      
    } else {
    
      setTimeout(this.getContactState.bind(this), 1000);
    
    }
    
  }
  
  refreshHistory(){
    
    let state;
    
    if(Array.isArray(this.historyService.history) && this.historyService.history.length > 1){

      state = this.historyService.history[this.historyService.history.length-1].status || 0;

      this.debug(this.accessory.displayName + ': Adding new entry to avoid gaps - Entry: ' + state);
      
      this.historyService.addEntry({time: moment().unix(), status: state});
      
      setTimeout(this.refreshHistory.bind(this), 5 * 60 * 1000)
    
    } else {
	
      setTimeout(this.refreshHistory.bind(this), 3000)
	    
    }
  
  }
  
  async loadData(data){

    return new Promise(resolve => {
    
      store(this.configPath).load(data, (err, obj) => {
              
        if(err) resolve(false);
              
        resolve(obj);
            
      });
    
    });

  }

}

module.exports = CallmonitorAccessory;
