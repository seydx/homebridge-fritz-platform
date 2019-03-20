'use strict';

const HomeKitTypes = require('../types/types.js');
const LogUtil = require('../../lib/LogUtil.js');
const packageFile = require('../../package.json');
const moment = require('moment');

var Accessory, Service, Characteristic, UUIDGen, PlatformAccessory;

const pluginName = 'homebridge-fritz-platform';
const platformName = 'FritzPlatform';

class Fritz_Box {
  constructor (platform, parameter, publish) {

    // HB
    PlatformAccessory = platform.api.platformAccessory;
    Accessory = platform.api.hap.Accessory;
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;
    UUIDGen = platform.api.hap.uuid;
    HomeKitTypes.registerWith(platform.api.hap);

    this.platform = platform;
    this.log = platform.log;
    this.logger = new LogUtil(null, platform.log);
    this.api = platform.api;
    this.config = platform.config;
    this.accessories = platform.accessories;
    this.polling = platform.polling;
    this.timeout = platform.timeout;
    this.delay = platform.delay;
    this.onDelay = platform.onDelay;
    this.telegram = platform.telegram;
    this.sendTelegram = platform.sendTelegram;
    this.tcp = platform.tcp;
    this.errorpoll = 60000;
    this.validMAC = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
    this.validIP = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    this.refreshPresence = platform.refreshPresence;

    if(publish){
      this.addAccessory(parameter);
    } else {
      this.getService(parameter);
    }

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Add Accessories
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  addAccessory (parameter) {
    const self = this;
    let name = parameter.name;
    let deviceType = Accessory.Categories.SENSOR;
    let accessoryType = Service.OccupancySensor;

    this.logger.initinfo('Publishing new accessory: ' + name);

    let accessory = this.accessories[name];
    const uuid = UUIDGen.generate(name);

    accessory = new PlatformAccessory(name, uuid, deviceType);
    accessory.addService(accessoryType, name);

    // Setting reachable to true
    accessory.reachable = true;
    accessory.context = {};

    accessory.context.devices = parameter.devices;
    accessory.context.adresse = parameter.adresse;
    accessory.context.polling = self.polling;
    accessory.context.delay = self.delay;
    accessory.context.onDelay = self.onDelay;
    accessory.context.telegram = self.telegram;
    accessory.context.lastState = 0;
    accessory.context.ipmac = '0.0.0.0';
    accessory.context.hostname = 'Unknown';
    accessory.context.type = parameter.type;

    //AccessoryInformation
    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, accessory.displayName)
      .setCharacteristic(Characteristic.Identify, accessory.displayName)
      .setCharacteristic(Characteristic.Manufacturer, 'SeydX')
      .setCharacteristic(Characteristic.Model, 'Occupancy')
      .setCharacteristic(Characteristic.SerialNumber, 'O-1234567890')
      .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

    // Publish
    this.platform.api.registerPlatformAccessories(pluginName, platformName, [accessory]);

    // Cache
    this.accessories[name] = accessory;

    self.getService(accessory);

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService (accessory) {
    const self = this;

    //Refresh AccessoryInformation
    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, accessory.displayName)
      .setCharacteristic(Characteristic.Identify, accessory.displayName)
      .setCharacteristic(Characteristic.Manufacturer, 'SeydX')
      .setCharacteristic(Characteristic.Model, 'Occupancy')
      .setCharacteristic(Characteristic.SerialNumber, 'O-1234567890')
      .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

    accessory.on('identify', function (paired, callback) {
      self.logger.info(accessory.displayName + ': Hi!');
      callback();
    });

    let service = accessory.getService(Service.OccupancySensor);

    service.getCharacteristic(Characteristic.OccupancyDetected)
      .updateValue(accessory.context.lastState)
      .on('change', self.changeOccupany.bind(this,accessory,service));

    service.getCharacteristic(Characteristic.StatusActive)
      .updateValue(true);

    service.getCharacteristic(Characteristic.StatusFault)
      .updateValue(0);

    service.getCharacteristic(Characteristic.StatusTampered)
      .updateValue(0);

    service.getCharacteristic(Characteristic.StatusLowBattery)
      .updateValue(0);

    if (!service.testCharacteristic(Characteristic.Adresse))service.addCharacteristic(Characteristic.Adresse);
    service.getCharacteristic(Characteristic.Adresse)
      .updateValue(accessory.context.ipmac);

    if (!service.testCharacteristic(Characteristic.Host))service.addCharacteristic(Characteristic.Host);
    service.getCharacteristic(Characteristic.Host)
      .updateValue(accessory.context.host);

    this.getStates(accessory,service);

  }
  
  getStates(accessory,service){
    const self = this;
    if(accessory.displayName !== 'Anyone'){
      if(accessory.context.newState===1){
        if(!accessory.context.lastState&&self.onDelay>0){
          if(!self.represenceTime)self.represenceTime=moment().unix();
          if((moment().unix()-self.represenceTime)<=(self.onDelay/1000)){
            accessory.context.lastState = 0;
            if(!self.reinfo){
              self.logger.info(accessory.displayName + ': Presence detected! Re-Presence delay is active.');
              self.logger.info(accessory.displayName + ': Wait ' + (self.onDelay/1000) + ' seconds before switching to presence detected');
              self.reinfo = true;
              self.reretry = true;
            }
          } else {
            accessory.context.lastState = 1;
            if(self.reinfo){
              self.logger.info(accessory.displayName + ': Presence still after ' + (self.onDelay/1000) + ' seconds');
              self.logger.info(accessory.displayName + ': Switching to presence detected');
              //Reset
              self.reinfo = false;
              self.represenceTime = false;
              self.reretry = false;
            }
            if(self.retry){
              self.logger.info(accessory.displayName + ': Presence detected again');
              //Reset
              self.info = false;
              self.presenceTime = false;
              self.retry = false;
            }
          }
        } else {
          accessory.context.lastState = 1;
          if(self.retry){
            self.logger.info(accessory.displayName + ': Presence detected again');
            //Reset
            self.info = false;
            self.presenceTime = false;
            self.retry = false;
          }
        }
      } else {
        if(accessory.context.newState!==undefined){
          if(accessory.context.lastState&&self.delay>0){
            if(!self.presenceTime)self.presenceTime=moment().unix();
            if((moment().unix()-self.presenceTime)<=(self.delay/1000)){
              accessory.context.lastState = 1;
              if(!self.info){
                self.logger.info(accessory.displayName + ': No presence! Presence delay is active.');
                self.logger.info(accessory.displayName + ': Wait ' + (self.delay/1000) + ' seconds before switching to no presence');
                self.info = true;
                self.retry = true;
              }
            } else {
              accessory.context.lastState = 0;
              if(self.info){
                self.logger.info(accessory.displayName + ': No presence after ' + (self.delay/1000) + ' seconds');
                self.logger.info(accessory.displayName + ': Switching to no presence');
                //Reset
                self.info = false;
                self.presenceTime = false;
                self.retry = false;
              }
              if(self.reretry){
                self.logger.info(accessory.displayName + ': Again no presence');
                //Reset
                self.reinfo = false;
                self.represenceTime = false;
                self.reretry = false;
              }
            }
          } else {
            accessory.context.lastState = 0;
            if(self.reretry){
              self.logger.info(accessory.displayName + ': Again no presence');
              //Reset
              self.reinfo = false;
              self.represenceTime = false;
              self.reretry = false;
            }
          }
        }
      }          
    } else {
      let states = [];
      for(const i in self.accessories){
        if(self.accessories[i].context.type == 'presence' && self.accessories[i].displayName !== 'Anyone'){
          states.push(self.accessories[i].context.lastState);
        }
      }
      if(states.includes('1')||states.includes(1)){
        accessory.context.lastState = 1;
      } else {
        accessory.context.lastState = 0;
      }
      accessory.context.hostname = 'Anyone';
      accessory.context.ipmac = '0.0.0.0';    
    }
    service.getCharacteristic(Characteristic.OccupancyDetected).updateValue(accessory.context.lastState);
    service.getCharacteristic(Characteristic.Host).updateValue(accessory.context.hostname);
    service.getCharacteristic(Characteristic.Adresse).updateValue(accessory.context.ipmac); 
    setTimeout(function(){
      self.getStates(accessory, service);
    }, 2000);
  }

  changeOccupany(accessory,service,value){
    const self = this;
    if(accessory.displayName!='Anyone'){
      if(value.newValue){
        if(Object.keys(self.telegram).length&&self.telegram.active&&self.telegram.presence.in){
          let message = self.telegram.presence.in;
          message = message.replace('@', accessory.displayName);
          self.sendTelegram(self.telegram.token,self.telegram.chatID,message); 
          self.logger.info(message);
        } else {
          self.logger.info('Welcome at home ' + accessory.displayName);
        }
      } else {
        if(Object.keys(self.telegram).length&&self.telegram.active&&self.telegram.presence.out){
          let message = self.telegram.presence.out;
          message = message.replace('@', accessory.displayName);
          self.sendTelegram(self.telegram.token,self.telegram.chatID,message); 
          self.logger.info(message);
        } else {
          self.logger.info('Bye Bye ' + accessory.displayName);
        }
      }
    } else {
      if(value.newValue){
        if(Object.keys(self.telegram).length&&self.telegram.active&&self.telegram.presence.anyoneIn){
          self.sendTelegram(self.telegram.token,self.telegram.chatID,self.telegram.presence.anyoneIn); 
          self.logger.info(self.telegram.presence.anyoneIn);
        } else {
          self.logger.info('Presence detected at home!');
        }
      } else {
        if(Object.keys(self.telegram).length&&self.telegram.active&&self.telegram.presence.anyoneOut){
          self.sendTelegram(self.telegram.token,self.telegram.chatID,self.telegram.presence.anyoneOut); 
          self.logger.info(self.telegram.presence.anyoneOut);
        } else {
          self.logger.info('Nobody at home!');
        }
      }
    }
  }

}

module.exports = Fritz_Box;
