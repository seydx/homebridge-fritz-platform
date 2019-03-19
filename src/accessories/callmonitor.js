'use strict';

const HomeKitTypes = require('../types/types.js');
const EveTypes = require('../types/eve.js');
const LogUtil = require('../../lib/LogUtil.js');
const packageFile = require('../../package.json');
const moment = require('moment');

var Accessory, Service, Characteristic, UUIDGen, PlatformAccessory, FakeGatoHistoryService;

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
    EveTypes.registerWith(platform.api.hap);
    FakeGatoHistoryService = require('fakegato-history')(platform.api);

    this.platform = platform;
    this.log = platform.log;
    this.logger = new LogUtil(null, platform.log);
    this.api = platform.api;
    this.config = platform.config;
    this.accessories = platform.accessories;
    this.telegram = platform.telegram;
    this.client = platform.client;
    this.sendTelegram = platform.sendTelegram;
    this.call = {};
    this.HBpath = platform.HBpath;

    this.storage = require('node-persist');
    this.storage.initSync({
      dir: platform.HBpath
    });

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
    //const self = this;
    let name = parameter.name;
    let deviceType = Accessory.Categories.SENSOR;
    let accessoryType = Service.ContactSensor;

    this.logger.initinfo('Publishing new accessory: ' + name);

    let accessory = this.accessories[name];
    const uuid = UUIDGen.generate(name);

    accessory = new PlatformAccessory(name, uuid, deviceType);
    accessory.addService(accessoryType, name);

    // Setting reachable to true
    accessory.reachable = true;
    accessory.context = {};

    accessory.context.devices = parameter.devices;
    accessory.context.type = parameter.type;
    accessory.context.active = parameter.config.active;
    accessory.context.ip = parameter.config.ip;
    accessory.context.port = parameter.config.port;
    accessory.context.config = parameter.config;
    accessory.context.incomingTo = parameter.incomingTo;
    accessory.context.outgoingFrom = parameter.outgoingFrom;
    accessory.context.lastState = 0;

    accessory.context.caller = 'No entry';
    accessory.context.called = 'No entry';

    //EVE
    accessory.context.lastActivation = 0;
    accessory.context.timesOpened = 0;
    accessory.context.closeDuration = 0;
    accessory.context.openDuration = 0;

    let serial, model;
    if(accessory.displayName == 'Callmonitor Incoming'){
      serial = 'CI-123456780';
      model = 'Incoming';
    } else {
      serial = 'CO-1234567890';
      model = 'Outgoing';
    }

    //AccessoryInformation
    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, accessory.displayName)
      .setCharacteristic(Characteristic.Identify, accessory.displayName)
      .setCharacteristic(Characteristic.Manufacturer, 'SeydX')
      .setCharacteristic(Characteristic.Model, model)
      .setCharacteristic(Characteristic.SerialNumber, serial)
      .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

    // Publish
    this.platform.api.registerPlatformAccessories(pluginName, platformName, [accessory]);

    // Cache
    this.accessories[name] = accessory;

    this.getService(accessory);


  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService (accessory) {
    const self = this;

    let serial, model;
    if(accessory.displayName == 'Callmonitor Incoming'){
      serial = 'CI-123456780';
      model = 'Incoming';
    } else {
      serial = 'CO-1234567890';
      model = 'Outgoing';
    }

    //Refresh AccessoryInformation
    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, accessory.displayName)
      .setCharacteristic(Characteristic.Identify, accessory.displayName)
      .setCharacteristic(Characteristic.Manufacturer, 'SeydX')
      .setCharacteristic(Characteristic.Model, model)
      .setCharacteristic(Characteristic.SerialNumber, serial)
      .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

    accessory.on('identify', function (paired, callback) {
      self.logger.info(accessory.displayName + ': Hi!');
      callback();
    });
    
    this.historyService = new FakeGatoHistoryService('door', accessory, {storage:'fs',path:self.HBpath, disableTimer: false, disableRepeatLastData:false});

    let service = accessory.getService(Service.ContactSensor);

    if (!service.testCharacteristic(Characteristic.Adresse))service.addCharacteristic(Characteristic.Adresse);
    service.getCharacteristic(Characteristic.Adresse)
      .updateValue(accessory.context.ip+':'+accessory.context.port);

    if (!service.testCharacteristic(Characteristic.Host))service.addCharacteristic(Characteristic.Host);
    service.getCharacteristic(Characteristic.Host)
      .updateValue('FritzBox');

    if (!service.testCharacteristic(Characteristic.LastActivation))service.addCharacteristic(Characteristic.LastActivation);
    service.getCharacteristic(Characteristic.LastActivation)
      .updateValue(accessory.context.lastActivation);


    if (!service.testCharacteristic(Characteristic.TimesOpened))service.addCharacteristic(Characteristic.TimesOpened);
    service.getCharacteristic(Characteristic.TimesOpened)
      .updateValue(accessory.context.timesOpened);

    if (!service.testCharacteristic(Characteristic.OpenDuration))service.addCharacteristic(Characteristic.OpenDuration);
    service.getCharacteristic(Characteristic.OpenDuration)
      .updateValue(accessory.context.openDuration);

    if (!service.testCharacteristic(Characteristic.ClosedDuration))service.addCharacteristic(Characteristic.ClosedDuration);
    service.getCharacteristic(Characteristic.ClosedDuration)
      .updateValue(accessory.context.closeDuration);

    service.getCharacteristic(Characteristic.ContactSensorState)
      .updateValue(accessory.context.lastState);

    if(accessory.displayName == 'Callmonitor Incoming'){
      if (!service.testCharacteristic(Characteristic.Caller))service.addCharacteristic(Characteristic.Caller);
      service.getCharacteristic(Characteristic.Caller)
        .updateValue(accessory.context.caller);
    }

    if(accessory.displayName == 'Callmonitor Outgoing'){
      if (!service.testCharacteristic(Characteristic.Called))service.addCharacteristic(Characteristic.Called);
      service.getCharacteristic(Characteristic.Called)
        .updateValue(accessory.context.called);
    }

    this.getContactState(accessory, service);

  }

  fritzboxDateToUnix(string) {
    let d = string.match(/[0-9]{2}/g);
    let result = '';
    result += '20' + d[2] + '-' + d[1] + '-' + d[0];
    result += ' ' + d[3] + ':' + d[4] + ':' + d[5];
    return Math.floor(new Date(result).getTime() / 1000);
  }

  parseMessage(buffer) {
    const self = this;
    let message = buffer.toString()
      .toLowerCase()
      .replace(/[\n\r]$/, '')
      .replace(/;$/, '')
      .split(';');
    message[0] = self.fritzboxDateToUnix(message[0]);
    return message;
  }

  getContactState(accessory, service){
    const self = this;
    self.client.on('error', err => {
      self.logger.errorinfo(accessory.displayName + ': ' + err);
    });

    self.client.on('data', chunk => {

      let data = self.parseMessage(chunk);
      let text;
      let message;

      if(accessory.displayName == 'Callmonitor Incoming'){
        if (data[1] === 'ring') {
          self.call[data[2]] = {
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
          
          if(accessory.context.incomingTo){
            self.logger.info(accessory.displayName + ': Checking incoming calls only to Nr ' + accessory.context.incomingTo);
            if(accessory.context.incomingTo.includes(message.called)){
              self.logger.info(accessory.displayName + ': Incoming nr matched!');
              accessory.context.lastState = 1;
              accessory.context.timesOpened += 1;
              accessory.context.lastActivation = moment().unix() - self.historyService.getInitialTime();
              accessory.context.closeDuration = moment().unix() - self.historyService.getInitialTime();
              service.getCharacteristic(Characteristic.ContactSensorState).updateValue(accessory.context.lastState);
              service.getCharacteristic(Characteristic.LastActivation).updateValue(accessory.context.lastActivation);
              service.getCharacteristic(Characteristic.ClosedDuration).updateValue(accessory.context.closeDuration);
              service.getCharacteristic(Characteristic.TimesOpened).updateValue(accessory.context.timesOpened);
              self.historyService.addEntry({time: moment().unix(), status: accessory.context.lastState});
              if(self.storage.getItem('PhoneBook.js')){
                let phonebook = self.storage.getItem('PhoneBook.js');
                let skip = false;
                for(const i in phonebook){
                  if(message.caller == phonebook[i].number){
                    text = 'Incoming call from: ' + phonebook[i].name + ' ( '+ phonebook[i].number + ' ) to ' + message.called;
                    self.callerName = phonebook[i].name;
                    self.callerNr = phonebook[i].number;
                    skip = true;
                  }
                }
                if(!skip){
                  text = 'Incoming call from: ' + message.caller + ' to ' + message.called;
                  self.callerNr = message.caller;
                  self.callerName = false;
                }
              } else {
                text = 'Incoming call from: ' + message.caller + ' to ' + message.called;
                self.callerNr = message.caller;
                self.callerName = false;
              }
              self.logger.info(text);
              accessory.context.caller = message.caller;
              service.getCharacteristic(Characteristic.Caller).updateValue(accessory.context.caller);
              if(Object.keys(self.telegram).length&&self.telegram.active&&self.telegram.callmonitor.incoming){
                let parseInfo = (self.callerName?self.callerName:'Unknown') + ' ( ' + (self.callerNr?self.callerNr:'unknown nr') + ' )';
                text = self.telegram.callmonitor.incoming;
                text = text.replace('@', parseInfo).replace('%', message.called);
                self.sendTelegram(self.telegram.token,self.telegram.chatID,text); 
              }
            } else {
              self.logger.info(accessory.displayName + ': Incoming to nr not matched. Receiving new call from ' + message.caller + ' to ' + message.called);
            }
          } else {
            accessory.context.lastState = 1;
            accessory.context.timesOpened += 1;
            accessory.context.lastActivation = moment().unix() - self.historyService.getInitialTime();
            accessory.context.closeDuration = moment().unix() - self.historyService.getInitialTime();
            service.getCharacteristic(Characteristic.ContactSensorState).updateValue(accessory.context.lastState);
            service.getCharacteristic(Characteristic.LastActivation).updateValue(accessory.context.lastActivation);
            service.getCharacteristic(Characteristic.ClosedDuration).updateValue(accessory.context.closeDuration);
            service.getCharacteristic(Characteristic.TimesOpened).updateValue(accessory.context.timesOpened);
            self.historyService.addEntry({time: moment().unix(), status: accessory.context.lastState});
            if(self.storage.getItem('PhoneBook.js')){
              let phonebook = self.storage.getItem('PhoneBook.js');
              let skip = false;
              for(const i in phonebook){
                if(message.caller == phonebook[i].number){
                  text = 'Incoming call from: ' + phonebook[i].name + ' ( '+ phonebook[i].number + ' ) to ' + message.called;
                  self.callerName = phonebook[i].name;
                  self.callerNr = phonebook[i].number;
                  skip = true;
                }
              }
              if(!skip){
                text = 'Incoming call from: ' + message.caller + ' to ' + message.called;
                self.callerNr = message.caller;
                self.callerName = false;
              }
            } else {
              text = 'Incoming call from: ' + message.caller + ' to ' + message.called;
              self.callerNr = message.caller;
              self.callerName = false;
            }
            self.logger.info(text);
            accessory.context.caller = message.caller;
            service.getCharacteristic(Characteristic.Caller).updateValue(accessory.context.caller);
            if(Object.keys(self.telegram).length&&self.telegram.active&&self.telegram.callmonitor.incoming){
              let parseInfo = (self.callerName?self.callerName:'Unknown') + ' ( ' + (self.callerNr?self.callerNr:'unknown nr') + ' )';
              text = self.telegram.callmonitor.incoming;
              text = text.replace('@', parseInfo).replace('%', message.called);
              self.sendTelegram(self.telegram.token,self.telegram.chatID,text); 
            }
          }
          
        }
      }

      if(accessory.displayName == 'Callmonitor Outgoing'){
        if (data[1] === 'call') {
          self.call[data[2]] = {
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
          
          if(accessory.context.outgoingFrom){
            self.logger.info(accessory.displayName + ': Checking outgoing calls only from Nr ' + accessory.context.outgoingFrom);
            if(accessory.context.outgoingFrom.includes(message.caller)){
              self.logger.info(accessory.displayName + ': Outgoing from nr matched!');
              accessory.context.lastState = 1;
              accessory.context.timesOpened += 1;
              accessory.context.lastActivation = moment().unix() - self.historyService.getInitialTime();
              accessory.context.closeDuration = moment().unix() - self.historyService.getInitialTime();
              service.getCharacteristic(Characteristic.ContactSensorState).updateValue(accessory.context.lastState);
              service.getCharacteristic(Characteristic.LastActivation).updateValue(accessory.context.lastActivation);
              service.getCharacteristic(Characteristic.ClosedDuration).updateValue(accessory.context.closeDuration);
              self.historyService.addEntry({time: moment().unix(), status: accessory.context.lastState});
              let called = message.called.replace(/\D/g,''); 
              if(self.storage.getItem('PhoneBook.js')){
                let phonebook = self.storage.getItem('PhoneBook.js');
                let skip = false;
                for(const i in phonebook){
                  if(called == phonebook[i].number){
                    text = 'Calling: ' + phonebook[i].name + ' ( '+ phonebook[i].number + ' )';
                    self.callerName = phonebook[i].name;
                    self.callerNr = phonebook[i].number;
                    skip = true;
                  }
                }
                if(!skip){
                  text = 'Calling: ' + called;
                  self.callerName = false;
                  self.callerNr = called;
                }
              } else {
                text = 'Calling: ' + called;
                self.callerName = false;
                self.callerNr = called;
              }
              accessory.context.called = called;
              service.getCharacteristic(Characteristic.Called).updateValue(accessory.context.called);
              self.logger.info(text);
            } else {
              self.logger.info(accessory.displayName + ': Outgoing from nr not matched. Calling from ' + message.caller + ' to ' + message.called);
            }
          } else {
            accessory.context.lastState = 1;
            accessory.context.timesOpened += 1;
            accessory.context.lastActivation = moment().unix() - self.historyService.getInitialTime();
            accessory.context.closeDuration = moment().unix() - self.historyService.getInitialTime();
            service.getCharacteristic(Characteristic.ContactSensorState).updateValue(accessory.context.lastState);
            service.getCharacteristic(Characteristic.LastActivation).updateValue(accessory.context.lastActivation);
            service.getCharacteristic(Characteristic.ClosedDuration).updateValue(accessory.context.closeDuration);
            self.historyService.addEntry({time: moment().unix(), status: accessory.context.lastState});
            let called = message.called.replace(/\D/g,''); 
            if(self.storage.getItem('PhoneBook.js')){
              let phonebook = self.storage.getItem('PhoneBook.js');
              let skip = false;
              for(const i in phonebook){
                if(called == phonebook[i].number){
                  text = 'Calling: ' + phonebook[i].name + ' ( '+ phonebook[i].number + ' )';
                  self.callerName = phonebook[i].name;
                  self.callerNr = phonebook[i].number;
                  skip = true;
                }
              }
              if(!skip){
                text = 'Calling: ' + called;
                self.callerName = false;
                self.callerNr = called;
              }
            } else {
              text = 'Calling: ' + called;
              self.callerName = false;
              self.callerNr = called;
            }
            accessory.context.called = called;
            service.getCharacteristic(Characteristic.Called).updateValue(accessory.context.called);
            self.logger.info(text);
          }
        }
      }

      if (data[1] === 'connect') {
        if(self.call[data[2]]){
          self.call[data[2]]['connect'] = data[0];
          message = {
            time: data[0],
            extension: self.call[data[2]]['extension'],
            caller: self.call[data[2]]['caller'],
            called: self.call[data[2]]['called']
          };
          self.logger.info('Connection established from: ' + message.caller + ' - to: ' + message.called);
        }
      }

      if (data[1] === 'disconnect') {
        if(self.call[data[2]]){
          self.call[data[2]].disconnect = data[0];
          self.call[data[2]].duration = parseInt(data[3], 10);
          let call = self.call[data[2]];
          delete(self.call[data[2]]);
          message = call;
          if(accessory.context.incomingTo||accessory.context.outgoingFrom){
            if(accessory.context.incomingTo.includes(message.called)||accessory.context.outgoingFrom.includes(message.caller)){
              accessory.context.lastState = 0;
              service.getCharacteristic(Characteristic.ContactSensorState).updateValue(accessory.context.lastState);
              self.logger.info('Call disconnected');
              if(Object.keys(self.telegram).length&&self.telegram.active&&self.telegram.callmonitor.disconnected){
                let parseInfo = (self.callerName?self.callerName:'Unknown') + ' ( ' + (self.callerNr?self.callerNr:'unknown nr') + ' )';
                text = self.telegram.callmonitor.disconnected;
                text = text.replace('@', parseInfo).replace('%', message.called);
                self.sendTelegram(self.telegram.token,self.telegram.chatID,text); 
              }
              accessory.context.openDuration = moment().unix() - self.historyService.getInitialTime();
              service.getCharacteristic(Characteristic.OpenDuration).updateValue(accessory.context.openDuration);
              self.historyService.addEntry({time: moment().unix(), status: accessory.context.lastState});
            } else {
              if(message.type=='inbound'){
                self.logger.info(accessory.displayName + ': Incoming to nr not matched. Call disconnected with from ' + message.caller + ' to ' + message.called);
              } else {
                self.logger.info(accessory.displayName + ': Outgoing from nr not matched. Call disconnected with from ' + message.caller + ' to ' + message.called);
              }
            }
          } else {
            accessory.context.lastState = 0;
            service.getCharacteristic(Characteristic.ContactSensorState).updateValue(accessory.context.lastState);
            self.logger.info('Call disconnected');
            if(Object.keys(self.telegram).length&&self.telegram.active&&self.telegram.callmonitor.disconnected){
              let parseInfo = (self.callerName?self.callerName:'Unknown') + ' ( ' + (self.callerNr?self.callerNr:'unknown nr') + ' )';
              text = self.telegram.callmonitor.disconnected;
              text = text.replace('@', parseInfo).replace('%', message.called);
              self.sendTelegram(self.telegram.token,self.telegram.chatID,text); 
            }
            accessory.context.openDuration = moment().unix() - self.historyService.getInitialTime();
            service.getCharacteristic(Characteristic.OpenDuration).updateValue(accessory.context.openDuration);
            self.historyService.addEntry({time: moment().unix(), status: accessory.context.lastState});
          }
        }
      }

    });

    self.client.on('end', () => {
      accessory.context.lastState = 0;
      service.getCharacteristic(Characteristic.ContactSensorState).updateValue(accessory.context.lastState);
      self.client.end();
    });
  }

}

module.exports = Fritz_Box;
