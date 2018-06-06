'use strict';

const tr = require('@seydx/tr064');
const moment = require('moment');
const async = require('async');
const speedTest = require('speedtest-net');
const exec = require('child_process').exec;
const http = require('http');
const https = require('https');
const cheerio = require('cheerio');
const querystring = require('querystring');
const parseString = require('xml2js').parseString;
const HomeKitTypes = require('./types.js');
const LogUtil = require('../lib/LogUtil.js');
const packageFile = require('../package.json');

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
    FakeGatoHistoryService = require('fakegato-history')(platform.api);

    const self = this;
    this.platform = platform;
    this.log = platform.log;
    this.logger = new LogUtil(null, platform.log);
    this.api = platform.api;
    this.config = platform.config;
    this.types = platform.types;
    this.accessories = platform.accessories;
    this.device = platform.device;
    this.HBpath = platform.HBpath;
    this.tr = platform.tr;
    this.polling = platform.polling;
    this.error = {};
    this.client = platform.client;
    this.call = {};

    //Sleep function
    this.sleep = function(time) {
      return new Promise((resolve) => setTimeout(resolve, time));
    };

    this.storage = require('node-persist');
    this.storage.initSync({
      dir: self.HBpath
    });

    if(publish){
      this.addAccessory(parameter);
    } else {
      let accessory = parameter;
      accessory.context.type==this.types.repeater ? this.logTR064(parameter) : this.getService(parameter);
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Add Accessories
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  addAccessory (parameter) {
    const self = this;
    let accessory;
    let name = parameter.name;
    let type = parameter.type;
    let deviceType;
    let accessoryType;

    switch(type){
      case 1:
        deviceType = Accessory.Categories.SWITCH;
        accessoryType = Service.Switch;
        break;
      case 2:
        deviceType = Accessory.Categories.SENSOR;
        accessoryType = Service.MotionSensor;
        break;
      case 3:
        deviceType = Accessory.Categories.SWITCH;
        accessoryType = Service.Switch;
        break;
      case 4:
        deviceType = Accessory.Categories.SWITCH;
        accessoryType = Service.Switch;
        break;
      case 5:
        deviceType = Accessory.Categories.SENSOR;
        accessoryType = Service.ContactSensor;
        break;
      default:
        break;
    }

    this.logger.info('Publishing new accessory: ' + name);

    accessory = this.accessories[name];
    const uuid = UUIDGen.generate(name);

    accessory = new PlatformAccessory(name, uuid, deviceType);
    accessory.addService(accessoryType, name);

    // Setting reachable to true
    accessory.reachable = true;
    accessory.context = {};

    accessory.context.type = parameter.type;
    accessory.context.serialNo = parameter.serialNo;
    accessory.context.model = parameter.model;
    accessory.context.fakegato = parameter.fakegato;
    accessory.context.options = {
      host: self.config.host||'fritz.box',
      port: self.config.port||49000,
      username: self.config.username,
      password: self.config.password,
      timeout: self.config.timeout*1000||5000
    };

    switch(type){
      case 1:
        accessory.context.lastSwitchState = false;
        break;
      case 2:
        accessory.context.lastMotionState = [];
        accessory.context.lastActivation = 0;
        accessory.context.mac = parameter.mac;
        break;
      case 3:
        accessory.context.mac = parameter.mac;
        break;
      case 4:
        if(Object.keys(self.platform.presence).length)accessory.context.lastMotionState = false;
        accessory.context.lastSwitchState = false;
        accessory.context.disable = parameter.disable;
        accessory.context.host = parameter.host;
        accessory.context.username = parameter.username;
        accessory.context.password = parameter.password;
        accessory.context.wifi2 = parameter.wifi2;
        accessory.context.wifi5 = parameter.wifi5;
        accessory.context.wifiGuest = parameter.wifiGuest;
        accessory.context.options = {
          host: parameter.host,
          port: parameter.port||49000,
          username: parameter.username,
          password: parameter.password,
          timeout: self.config.timeout*1000||5000
        };
        break;
      case 5:
        accessory.context.lastContactSensorState = false;
        break;
      default:
        break;
    }

    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, parameter.name)
      .setCharacteristic(Characteristic.Identify, parameter.name)
      .setCharacteristic(Characteristic.Manufacturer, 'SeydX')
      .setCharacteristic(Characteristic.Model, parameter.model)
      .setCharacteristic(Characteristic.SerialNumber, parameter.serialNo)
      .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

    //FakeGato
    if(accessory.context.fakegato){
      accessory.context.fakegato = parameter.fakegato;
      accessory.context.fakegatoType = parameter.fakegatoType; 
      accessory.context.fakegatoTimer = parameter.fakegatoTimer;
      accessory.context.fakegatoOptions = {storage:'fs',path:self.HBpath, disableTimer: accessory.context.fakegatoTimer};
      accessory.context.fakegatoService = new FakeGatoHistoryService(accessory.context.fakegatoType,accessory,accessory.context.fakegatoOptions);
      accessory.context.fakegatoService.subtype = parameter.serialNo;
      accessory.context.fakegatoService.log = self.log;
    }

    // Publish
    this.platform.api.registerPlatformAccessories(pluginName, platformName, [accessory]);

    // Cache
    this.accessories[name] = accessory;

    type != self.types.repeater ? self.getService(accessory) : self.logTR064(accessory);

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Repeater: init tr064
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  logTR064 (accessory) {
    const self = this;
    this.tr064 = new tr.TR064(accessory.context.options); 
    this.tr064.initDevice('TR064')
      .then(result => {
        self.logger.info('Repeater initialized: ' + result.meta.friendlyName);
        result.startEncryptedCommunication()
          .then(device => {
            self.logger.info('Encrypted communication started with: ' + result.meta.friendlyName); 
            self.device = device;
            self.device.login(accessory.context.options.username, accessory.context.options.password);
            self.getService(accessory);
          })
          .catch(err => {
            self.logger.error('An error occured by starting encypted communication with: ' + result.meta.friendlyName);
            self.logger.error(JSON.stringify(err,null,4));
            setTimeout(function(){
              self.logTR064(accessory);
            }, 15000);
          });
      })
      .catch(err => {
        self.logger.error('An error occured by initializing repeater: ' + accessory.displayName);
        self.logger.error(JSON.stringify(err,null,4));
        setTimeout(function(){
          self.logTR064(accessory);
        }, 15000);
      });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService (accessory) {
    const self = this;
    let type = accessory.context.type;

    //Refresh AccessoryInformation
    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, accessory.displayName)
      .setCharacteristic(Characteristic.Identify, accessory.displayName)
      .setCharacteristic(Characteristic.Manufacturer, 'SeydX')
      .setCharacteristic(Characteristic.Model, accessory.context.model)
      .setCharacteristic(Characteristic.SerialNumber, accessory.context.serialNo)
      .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

    accessory.on('identify', function (paired, callback) {
      self.logger.info(accessory.displayName + ': Hi!');
      callback();
    });

    let service;

    switch(type){
      case 1:
        service = accessory.getService(Service.Switch);

        if(self.platform.wifi['2.4ghz']){
          if (!service.testCharacteristic(Characteristic.WifiTwo)){
            self.logger.info('Adding WIFI 2.4 Ghz Characteristic to ' + accessory.displayName);
            accessory.context.lastWifiTwoState = false;
            service.addCharacteristic(Characteristic.WifiTwo);
          }
          service.getCharacteristic(Characteristic.WifiTwo)
            .updateValue(accessory.context.lastWifiTwoState)
            .on('set', self.setWifiTwo.bind(this, accessory, service))
            .on('get', self.checkWifiTwo.bind(this, accessory, service));
        } else {
          if(service.testCharacteristic(Characteristic.WifiTwo)){
            self.logger.info('Removing WIFI 2.4 Ghz from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.WifiTwo));
          }
        }

        if(self.platform.wifi['5ghz']){
          if(self.device.services['urn:dslforum-org:service:WLANConfiguration:3']){
            if (!service.testCharacteristic(Characteristic.WifiFive)){
              self.logger.info('Adding WIFI 5 Ghz Characteristic to ' + accessory.displayName);
              accessory.context.lastWifiFiveState = false;
              service.addCharacteristic(Characteristic.WifiFive);
            }
            service.getCharacteristic(Characteristic.WifiFive)
              .updateValue(accessory.context.lastWifiFiveState)
              .on('set', self.setWifiFive.bind(this, accessory, service))
              .on('get', self.checkWifiFive.bind(this, accessory, service));
          } else {
            self.logger.warn(accessory.displayName + ': Can not add WIFI 5 Ghz, not supported by this device!');
          }
        } else {
          if(service.testCharacteristic(Characteristic.WifiFive)){
            self.logger.info('Removing WIFI 5 Ghz from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.WifiFive));
          }
        }

        if(self.platform.wifi.guest){
          if (!service.testCharacteristic(Characteristic.WifiGuest)){
            self.logger.info('Adding WIFI Guest Characteristic to ' + accessory.displayName);
            accessory.context.lastWifiGuestState = false;
            service.addCharacteristic(Characteristic.WifiGuest);
          }
          service.getCharacteristic(Characteristic.WifiGuest)
            .updateValue(accessory.context.lastWifiGuestState)
            .on('set', self.setWifiGuest.bind(this, accessory, service))
            .on('get', self.checkWifiGuest.bind(this, accessory, service));
        } else {
          if(service.testCharacteristic(Characteristic.WifiGuest)){
            self.logger.info('Removing WIFI Guest from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.WifiGuest));
          }
        }

        if(self.platform.wifi.wps){
          if (!service.testCharacteristic(Characteristic.WifiWPS)){
            self.logger.info('Adding WIFI WPS Characteristic to ' + accessory.displayName);
            accessory.context.lastWifiWPSState = false;
            service.addCharacteristic(Characteristic.WifiWPS);
          }
          service.getCharacteristic(Characteristic.WifiWPS)
            .updateValue(accessory.context.lastWifiWPSState)
            .on('set', self.setWifiWPS.bind(this, accessory, service))
            .on('get', self.checkWifiWPS.bind(this, accessory, service));
        } else {
          if(service.testCharacteristic(Characteristic.WifiWPS)){
            self.logger.info('Removing WIFI WPS from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.WifiWPS));
          }
        }

        if(Object.keys(self.platform.reboot).length&&!self.platform.reboot.disable){
          if (!service.testCharacteristic(Characteristic.Reboot)){
            self.logger.info('Adding Reboot Characteristic to ' + accessory.displayName);
            service.addCharacteristic(Characteristic.Reboot);
          }
          service.getCharacteristic(Characteristic.Reboot)
            .updateValue(false)
            .on('set', self.setReboot.bind(this, accessory, service));
        } else {
          if(service.testCharacteristic(Characteristic.Reboot)){
            self.logger.info('Removing Reboot from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.Reboot));
          }
        }

        if(self.platform.options.answeringMachine){
          if (!service.testCharacteristic(Characteristic.AnsweringMachine)){
            self.logger.info('Adding Answering Machine Characteristic to ' + accessory.displayName);
            accessory.context.lastAWState = false;
            service.addCharacteristic(Characteristic.AnsweringMachine);
          } 
          service.getCharacteristic(Characteristic.AnsweringMachine)
            .updateValue(accessory.context.lastAWState)
            .on('set', self.setAW.bind(this, accessory, service))
            .on('get', self.checkAW.bind(this, accessory, service));
        } else {
          if(service.testCharacteristic(Characteristic.AnsweringMachine)){
            self.logger.info('Removing Answering Machine from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.AnsweringMachine));
          }
        }

        if(self.platform.options.debug){
          if (!service.testCharacteristic(Characteristic.Debug)){
            self.logger.info('Adding Debug Characteristic to ' + accessory.displayName);
            service.addCharacteristic(Characteristic.Debug);
          } 
          service.getCharacteristic(Characteristic.Debug)
            .updateValue(false)
            .on('set', function(state, callback){
              if(state){
                self.device.meta.servicesInfo.forEach(function(serviceType) {
                  let service = self.device.services[serviceType];
                  console.log('---> ' + service.meta.serviceType + ' <---');
                  service.meta.actionsInfo.forEach(function(action) {
                    console.log(' # ' + action.name + '()');
                    action.inArgs.forEach(function(arg) {
                      console.log(' IN : ' + arg);
                    });
                    action.outArgs.forEach(function(arg) {
                      console.log(' OUT: ' + arg);
                    });
                  });
                });
                setTimeout(function(){service.getCharacteristic(Characteristic.Debug).updateValue(false);},500);
                callback(null, false);
              }else{
                callback(null, false);
              }
            });
        } else {
          if(service.testCharacteristic(Characteristic.Debug)){
            self.logger.info('Removing Debug from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.Debug));
          }
        }

        if(self.platform.options.deflection){
          if (!service.testCharacteristic(Characteristic.Deflection)){
            self.logger.info('Adding Deflection Characteristic to ' + accessory.displayName);
            service.addCharacteristic(Characteristic.Deflection);
            accessory.context.lastDeflectiontate = false;
          }
          service.getCharacteristic(Characteristic.Deflection)
            .updateValue(accessory.context.lastDeflectiontate)
            .on('set', self.setDeflection.bind(this, accessory, service))
            .on('get', self.checkDeflection.bind(this, accessory, service));
        } else {
          if(service.testCharacteristic(Characteristic.Deflection)){
            self.logger.info('Removing Deflection from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.Deflection));
          }
        }

        if(Object.keys(self.platform.broadband).length&&!self.platform.broadband.disable){
          if (!service.testCharacteristic(Characteristic.DownloadSpeed)){
            self.logger.info('Adding Download Speed Characteristic to ' + accessory.displayName);
            service.addCharacteristic(Characteristic.DownloadSpeed);
            accessory.context.lastDLSpeed = 0;
          }
          if (!service.testCharacteristic(Characteristic.UploadSpeed)){
            self.logger.info('Adding Upload Speed Characteristic to ' + accessory.displayName);
            service.addCharacteristic(Characteristic.UploadSpeed);
            accessory.context.lastULSpeed = 0;
          }
          if (!service.testCharacteristic(Characteristic.Ping)){
            self.logger.info('Adding Ping Characteristic to ' + accessory.displayName);
            service.addCharacteristic(Characteristic.Ping);
            accessory.context.lastPing = 0;
          }
          accessory.context.maxTime = self.platform.broadband.maxTime*1000||5000;
          accessory.context.broadbandPolling = self.platform.broadband.polling*60*1000||60*60*1000;
          service.getCharacteristic(Characteristic.DownloadSpeed)
            .updateValue(accessory.context.lastDLSpeed);
          service.getCharacteristic(Characteristic.UploadSpeed)
            .updateValue(accessory.context.lastULSpeed);
          service.getCharacteristic(Characteristic.Ping)
            .updateValue(accessory.context.lastPing);
          self.getMeasurement(accessory, service);
        } else {
          if(service.testCharacteristic(Characteristic.DownloadSpeed)){
            self.logger.info('Removing Download Speed from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.DownloadSpeed));
          }
          if(service.testCharacteristic(Characteristic.UploadSpeed)){
            self.logger.info('Removing Upload Speed from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.UploadSpeed));
          }
          if(service.testCharacteristic(Characteristic.Ping)){
            self.logger.info('Removing Ping from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.Ping));
          }
        }

        if(self.platform.options.devicelock){
          if (!service.testCharacteristic(Characteristic.DeviceLock)){
            self.logger.info('Adding Device Lock Characteristic to ' + accessory.displayName);
            service.addCharacteristic(Characteristic.DeviceLock);
            accessory.context.lastDeviceLock = false;
          }
          service.getCharacteristic(Characteristic.DeviceLock)
            .updateValue(accessory.context.lastDeviceLock)
            .on('set', self.setDeviceLock.bind(this, accessory, service))
            .on('get', self.checkDeviceLock.bind(this, accessory, service));
        } else {
          if(service.testCharacteristic(Characteristic.DeviceLock)){
            self.logger.info('Removing Device Lock from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.DeviceLock));
          }
        }

        if(Object.keys(self.platform.wakeup).length){
          if(self.platform.wakeup.internNr){
            if (!service.testCharacteristic(Characteristic.WakeUp)){
              self.logger.info('Adding Wake Up Characteristic to ' + accessory.displayName);
              service.addCharacteristic(Characteristic.WakeUp);
            }
            accessory.context.wakeupDuration = self.platform.wakeup.duration*1000||30000;
            accessory.context.internNr = self.platform.wakeup.internNr;
            service.getCharacteristic(Characteristic.WakeUp)
              .updateValue(false)
              .on('set', self.setWakeUp.bind(this, accessory, service));
          } else {
            if(service.testCharacteristic(Characteristic.WakeUp)){
              self.logger.info('Removing Wake Up from ' + accessory.displayName);
              service.removeCharacteristic(service.getCharacteristic(Characteristic.WakeUp));
            }
          }
        } else {
          if(service.testCharacteristic(Characteristic.WakeUp)){
            self.logger.info('Removing Wake Up from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.WakeUp));
          }
        }

        if(Object.keys(self.platform.alarm).length){
          if(self.platform.alarm.telNr){
            if (!service.testCharacteristic(Characteristic.DialAlarm)){
              self.logger.info('Adding Alarm Characteristic to ' + accessory.displayName);
              service.addCharacteristic(Characteristic.DialAlarm);
            }
            accessory.context.alarmDuration = self.platform.alarm.duration*1000||30000;
            accessory.context.alarmNumber = self.platform.alarm.telNr;
            service.getCharacteristic(Characteristic.DialAlarm)
              .updateValue(false)
              .on('set', self.setAlarm.bind(this, accessory, service));
          } else {
            if(service.testCharacteristic(Characteristic.DialAlarm)){
              self.logger.info('Removing Alarm from ' + accessory.displayName);
              service.removeCharacteristic(service.getCharacteristic(Characteristic.DialAlarm));
            }
          }
        } else {
          if(service.testCharacteristic(Characteristic.DialAlarm)){
            self.logger.info('Removing Alarm from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.DialAlarm));
          }
        }

        if(self.platform.options.phoneBook){
          if (!service.testCharacteristic(Characteristic.PhoneBook)){
            self.logger.info('Adding Phone Book Characteristic to ' + accessory.displayName);
            service.addCharacteristic(Characteristic.PhoneBook);
          }
          service.getCharacteristic(Characteristic.PhoneBook)
            .updateValue(false)
            .on('set', self.setPhoneBook.bind(this, accessory, service));
        } else {
          if(service.testCharacteristic(Characteristic.PhoneBook)){
            self.logger.info('Removing Phone Book from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.PhoneBook));
          }
        }

        service.getCharacteristic(Characteristic.On)
          .updateValue(accessory.context.lastSwitchState)
          .on('get', function(callback){
            let dsl = self.device.services['urn:dslforum-org:service:WANPPPConnection:1'];
            if(!accessory.context.stopPolling){
              dsl.actions.GetStatusInfo(function(err, result) {
                if(!err){
                  if(result.NewConnectionStatus == 'Connected'){
                    accessory.context.lastSwitchState = true;
                    callback(null, true);
                  } else {
                    accessory.context.lastSwitchState = true;
                    callback(null, true);
                  }
                } else {
                  self.logger.error(accessory.displayName + 'An error occured by getting device state!');
                  self.logger.error(JSON.stringify(err,null,4));
                  callback(null, accessory.context.lastSwitchState);
                }
              });
            } else {
              callback(null, false);
            }
          })
          .on('set', function(state, callback) {
            let reconnect = self.device.services['urn:dslforum-org:service:WANPPPConnection:1'];
            if(state){
              self.logger.info(accessory.displayName + ': Please wait a moment, internet is reconnecting...');
              setTimeout(function(){service.getCharacteristic(Characteristic.On).updateValue(false);},500);
              callback(null, false);
            } else {
              reconnect.actions.ForceTermination(function(err) {
                if(!err){
                  self.logger.warn(accessory.displayName + ': Reconnecting internet...');
                  accessory.context.lastSwitchState = false;
                  callback(null, false);
                } else {
                  self.logger.warn(accessory.displayName + ': Reconnecting internet...');
                  accessory.context.lastSwitchState = true;
                  callback(null, false);
                }
              });
            }
          });
        if(self.platform.options.reboot&&self.platform.options.reboot.telegram&&self.platform.options.reboot.chatID&&self.platform.options.reboot.token&&accessory.context.reboot){
          let message = 'Network reboot completed!';
          if(self.platform.options.reboot.messages&&self.platform.options.reboot.messages.off){
            message = self.platform.options.reboot.messages.off;
          }
          accessory.context.reboot = false;
          self.sendTelegram(self.platform.options.reboot.token,self.platform.options.reboot.chatID,message); 
        }
        break;
      case 2:
        service = accessory.getService(Service.MotionSensor);
        service.getCharacteristic(Characteristic.MotionDetected)
          .updateValue(accessory.context.lastMotionState)
          .on('change', self.changeValue.bind(this, accessory, service, type, 'motion'));

        if (!service.testCharacteristic(Characteristic.EveMotionLastActivation))service.addCharacteristic(Characteristic.EveMotionLastActivation);
        service.getCharacteristic(Characteristic.EveMotionLastActivation)
          .updateValue(accessory.context.lastActivation);

        if(Object.keys(self.platform.presence).length){
          if(accessory.displayName == 'Anyone'){
            self.getMotionLastActivation(accessory, service);
            setTimeout(function(){self.getAnyoneMotionDetected(accessory, service);},3000);
          } else {
            for(const i of Object.keys(self.platform.presence)){
              if(accessory.displayName == i){
                self.getMotionLastActivation(accessory, service);
                setTimeout(function(){self.getMotionDetected(accessory, service);},1000); 
              }
            }
          }
        }
        break;
      case 3:
        service = accessory.getService(Service.Switch);
        service.getCharacteristic(Characteristic.On)
          .updateValue(false)
          .on('set', function(state, callback) {
            if(state){
              let wol = self.device.services['urn:dslforum-org:service:Hosts:1'];
              wol.actions['X_AVM-DE_WakeOnLANByMACAddress']([{name:'NewMACAddress', value:accessory.context.mac}],function(err) {
                if(!err){
                  self.logger.info('Turning on ' + accessory.displayName);
                } else {
                  self.logger.error('An error occured by turning on ' + accessory.displayName);
                  self.logger.error(JSON.stringify(err,null,4));
                }
                setTimeout(function(){service.getCharacteristic(Characteristic.On).updateValue(false);},500);
                callback(null, false);
              });
            } else {
              callback(null, false);
            }
          });
        break;
      case 4:
        service = accessory.getService(Service.Switch);
        if(accessory.context.wifi2){ 
          if (!service.testCharacteristic(Characteristic.WifiTwo)){
            self.logger.info('Adding WIFI 2.4 Ghz Characteristic to ' + accessory.displayName);
            accessory.context.lastWifiTwoState = false;
            service.addCharacteristic(Characteristic.WifiTwo);
          }
          service.getCharacteristic(Characteristic.WifiTwo)
            .updateValue(accessory.context.lastWifiTwoState)
            .on('set', self.setWifiTwo.bind(this, accessory, service))
            .on('get', self.checkWifiTwo.bind(this, accessory, service));
        } else {
          if(service.testCharacteristic(Characteristic.WifiTwo)){
            self.logger.info('Removing WIFI 2.4 Ghz Characteristic from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.WifiTwo));
          }
        }

        if(accessory.context.wifi5){
          if(self.device.services['urn:dslforum-org:service:WLANConfiguration:3']){
            if (!service.testCharacteristic(Characteristic.WifiFive)){
              self.logger.info('Adding WIFI 5 Ghz Characteristic to ' + accessory.displayName);
              accessory.context.lastWifiFiveState = false;
              service.addCharacteristic(Characteristic.WifiFive);
            }
            service.getCharacteristic(Characteristic.WifiFive)
              .updateValue(accessory.context.lastWifiFiveState)
              .on('set', self.setWifiFive.bind(this, accessory, service))
              .on('get', self.checkWifiFive.bind(this, accessory, service));
          } else {
            self.logger.warn(accessory.displayName + ': Can not add WIFI 5 Ghz, not supported by this device!');
          }
        } else {
          if(service.testCharacteristic(Characteristic.WifiFive)){
            self.logger.info('Removing WIFI 5 Ghz Characteristic from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.WifiFive));
          }
        }

        if(accessory.context.wifiGuest){
          if (!service.testCharacteristic(Characteristic.WifiGuest)){
            self.logger.info('Adding WIFI Guest Characteristic to ' + accessory.displayName);
            accessory.context.lastWifiGuestState = false;
            service.addCharacteristic(Characteristic.WifiGuest);
          }
          service.getCharacteristic(Characteristic.WifiGuest)
            .updateValue(accessory.context.lastWifiGuestState)
            .on('set', self.setWifiGuest.bind(this, accessory, service))
            .on('get', self.checkWifiGuest.bind(this, accessory, service));
        } else {
          if(service.testCharacteristic(Characteristic.WifiGuest)){
            self.logger.info('Removing WIFI Guest from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.WifiGuest));
          }
        }

        if(accessory.context.led){
          if (!service.testCharacteristic(Characteristic.DeviceLED)){
            self.logger.info('Adding LED Characteristic to ' + accessory.displayName);
            service.addCharacteristic(Characteristic.DeviceLED);
            accessory.context.lastLEDState = false;
          }
          service.getCharacteristic(Characteristic.DeviceLED)
            .updateValue(accessory.context.lastLEDState)
            .on('set', self.setDeviceLED.bind(this, accessory, service))
            .on('get', self.checkDeviceLED.bind(this, accessory, service));
        } else {
          if(service.testCharacteristic(Characteristic.DeviceLED)){
            self.logger.info('Removing LED from ' + accessory.displayName);
            service.removeCharacteristic(service.getCharacteristic(Characteristic.DeviceLED));
          }
        }

        service.getCharacteristic(Characteristic.On)
          .updateValue(accessory.context.lastSwitchState)
          .on('get', function(callback){
            let adress = parseInt(accessory.context.host);
            if(isNaN(adress)) {
              self.logger.warn(accessory.displayName + ': Setted value for ip in config ist not an numerical ip adress! Can not get repeater state!');
              accessory.context.lastSwitchState = false;
              setTimeout(function(){service.getCharacteristic(Characteristic.On).updateValue(false);},500);
              callback(null, false);
            } else {
              let host = self.device.services['urn:dslforum-org:service:Hosts:1'];
              if(!accessory.context.stopPolling){
                host.actions['X_AVM-DE_GetSpecificHostEntryByIP']([{name:'NewIPAddress', value:accessory.context.host}],function(err, result){
                  if(!err){
                    if(result.NewActive == '1'){
                      accessory.context.lastSwitchState = true;
                      callback(null, true);
                    } else {
                      accessory.context.lastSwitchState = false;
                      callback(null, false);
                    }
                  } else {
                    self.logger.error(accessory.displayName + ': An error occured by getting device state!');
                    self.logger.error(JSON.stringify(err,null,4));
                    callback(null, accessory.context.lastSwitchState);
                  }
                });
              } else {
                callback(null, false);
              }
            }
          })
          .on('set', function(state, callback) {
            if(state){
              self.logger.info(accessory.displayName + ': Turning on is not supported');
              setTimeout(function(){service.getCharacteristic(Characteristic.On).updateValue(false);},500);
              callback(null, false);
            } else {
              self.logger.info(accessory.displayName + ': Turning off is not supported');
              setTimeout(function(){service.getCharacteristic(Characteristic.On).updateValue(true);},500);
              callback(null, true);
            }
          });
        break;
      case 5:
        service = accessory.getService(Service.ContactSensor);
        service.getCharacteristic(Characteristic.ContactSensorState)
          .updateValue(accessory.context.lastContactSensorState);
        if(!self.config.callmonitor.disable)self.getContactState(accessory, service);
        break;
      default:
        break;
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // FritzBox LUA
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  fetchSID(accessory, callback){
    const self = this;
    let getSID = self.device.services['urn:dslforum-org:service:DeviceConfig:1'];
    getSID.actions['X_AVM-DE_CreateUrlSID'](function(err, result) {
      if(!err){
        let sid = result['NewX_AVM-DE_UrlSID'].split('sid=')[1];
        callback(null, sid);
      } else {
        callback(err, null);
      }
    });
  }

  parseOutput(accessory, service, data, type, callback){
    let $ = cheerio.load(data);
    let form = $('form');
    $('input', form).each(function(i, elem) {
      let name = $(elem).attr('name');
      if (!name) callback('No name defined!',null);
      switch ($(elem).attr('type')) {
        case 'checkbox':
          if(type == 'keylock'){
            if (name == 'keylock_enabled'){
              if ($(elem).attr('checked') === 'checked') {
                accessory.context.lastDeviceLock = true;
                callback(null, true);
              } else {
                accessory.context.lastDeviceLock = false;
                callback(null, false);
              }
            }
          }
          break;
        case 'radio':
          if(type == 'led_one'){
            if (name == 'led_display'){
              if($(elem).attr('value') === '0'){
                if ($(elem).attr('checked') === 'checked') {
                  accessory.context.lastLEDState = true;
                  callback(null, true);
                } else {
                  accessory.context.lastLEDState = false;
                  callback(null, false);
                }
              }
            }
          }
          break;
        default:
      }
    });
  }

  setDeviceLock(accessory, service, state, callback){
    const self = this;
    let formData;
    self.fetchSID(accessory, function(err, result){
      if(!err){
        let sid = result;
        if(state){
          self.logger.info(accessory.displayName + ': Turning on Device Lock');
          formData = querystring.stringify({
            xhr: '1',
            sid: sid,
            lang: 'de',
            no_sidrenew: '',
            keylock_enabled: '1',
            apply: '',
            oldpage: '/system/keylock.lua'
          });
        } else {
          self.logger.info(accessory.displayName + ': Turning off Device Lock');
          formData = querystring.stringify({
            xhr: '1',
            sid: sid,
            lang: 'de',
            no_sidrenew: '',
            apply: '',
            oldpage: '/system/keylock.lua'
          });
        }
        let post_options = {
          host: accessory.context.options.host,
          port: '80',
          path: '/data.lua?sid='+sid,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(formData)
          }
        };
        // Set up the request
        let post_req = http.request(post_options, function(res) {
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            self.parseOutput(accessory, service, chunk,'keylock', function(err, result){
              if(!err){
                callback(null, result);
              } else {
                self.logger.error(accessory.displayName + ':An error occured by setting Device Lock state!');
                self.logger.error(JSON.stringify(err,null,4));
                setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLock).updateValue(accessory.context.lastDeviceLock);}, 500);
                callback(null, accessory.context.lastDeviceLock);
              }
            });
          });
        });
        // post the data
        post_req.write(formData);
        post_req.end();

      } else {
        self.logger.error(accessory.displayName + ': An error occured by fetching new SID!');
        self.logger.error(JSON.stringify(err,null,4));
        setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLock).updateValue(accessory.context.lastDeviceLock);}, 500);
        callback(null, accessory.context.lastDeviceLock);
      }
    });
  }

  checkDeviceLock(accessory, service, callback){
    const self = this; 
    self.fetchSID(accessory, function(err, result){
      if(!err){
        let sid = result;
        http.request({host:accessory.context.options.host, path:'/system/keylock.lua?sid='+sid},function(response){
          let data = '';
          response.on('data', function (chunk) {
            data += chunk;
          });
          response.on('end', function () {
            self.parseOutput(accessory, service, data,'keylock', function(err, result){
              if(!err){
                callback(null, result);
              } else {
                self.logger.error(accessory.displayName + ':An error occured by getting Device Lock state!');
                self.logger.error(JSON.stringify(err,null,4));
                setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLock).updateValue(accessory.context.lastDeviceLock);}, 500);
                callback(null, accessory.context.lastDeviceLock);
              }
            });
          });
        }).end();
      } else {
        self.logger.error(accessory.displayName + ': An error occured by fetching new SID!');
        self.logger.error(JSON.stringify(err,null,4));
        setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLock).updateValue(accessory.context.lastDeviceLock);}, 500);
        callback(null, accessory.context.lastDeviceLock);
      }
    });
  }

  setDeviceLED(accessory, service, state, callback){
    const self = this;
    let formData;
    self.fetchSID(accessory, function(err, result){
      if(!err){
        let sid = result;
        if(state){
          self.logger.info(accessory.displayName + ': Turning on LEDs');
          formData = querystring.stringify({
            xhr: '1',
            sid: result,
            lang: 'de',
            no_sidrenew: '',
            led_display: '0',
            apply: '',
            oldpage: '/system/led_display.lua'
          });
        } else {
          self.logger.info(accessory.displayName + ': Turning off LEDs');
          formData = querystring.stringify({
            xhr: '1',
            sid: result,
            lang: 'de',
            no_sidrenew: '',
            led_display: '2',
            apply: '',
            oldpage: '/system/led_display.lua'
          });
        }
        let post_options = {
          host: accessory.context.options.host,
          port: '80',
          path: '/data.lua?sid='+sid,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(formData)
          }
        };
        // Set up the request
        let post_req = http.request(post_options, function(res) {
          res.setEncoding('utf8');
          callback(null, state);
        });
        // post the data
        post_req.write(formData);
        post_req.end();

      } else {
        self.logger.error(accessory.displayName + ': An error occured by fetching new SID!');
        self.logger.error(JSON.stringify(err,null,4));
        setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLED).updateValue(accessory.context.lastLEDState);}, 500);
        callback(null, accessory.context.lastLEDState);
      }
    });
  }

  checkDeviceLED(accessory, service, callback){
    const self = this; 
    self.fetchSID(accessory, function(err, result){
      if(!err){
        let sid = result;
        http.request({host:accessory.context.options.host, path:'/system/led_display.lua?sid='+sid},function(response){
          let data = '';
          response.on('data', function (chunk) {
            data += chunk;
          });
          response.on('end', function () {
            self.parseOutput(accessory, service, data,'led_one', function(err, result){
              if(!err){
                callback(null, result);
              } else {
                self.logger.error(accessory.displayName + ':An error occured by getting LED state!');
                self.logger.error(JSON.stringify(err,null,4));
                setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLED).updateValue(accessory.context.lastLEDState);}, 500);
                callback(null, accessory.context.lastLEDState);
              }
            });
          });
        }).end();
      } else {
        self.logger.error(accessory.displayName + ': An error occured by fetching new SID!');
        self.logger.error(JSON.stringify(err,null,4));
        setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLED).updateValue(accessory.context.lastLEDState);}, 500);
        callback(null, accessory.context.lastLEDState);
      }
    });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Callmonitor
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

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

  sendTelegram(token,chatID,text){
    const self = this;
    let options = {
      host: 'api.telegram.org',
      path: '/bot' + token + '/sendMessage',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    let post_data = JSON.stringify(
      {
        'chat_id': chatID,
        'text': text
      }
    );

    let req = https.request(options, function(res) {
      if(res){
        self.logger.info('Successfully send telegram notification!');
      }
    });
    req.on('error', function(err) {
      self.logger.error('An error occured by sending telegram notification!');
      self.logger.error(JSON.stringify(err,null,4));
    });
    req.write(post_data);
    req.end();
  }

  getContactState(accessory, service){
    const self = this;
    self.client.on('error', () => {
      accessory.context.lastContactSensorState = false;
      service.getCharacteristic(Characteristic.ContactSensorState).updateValue(accessory.context.lastContactSensorState);
    });

    self.client.on('data', chunk => {

      let data = self.parseMessage(chunk);
      let text;
      let message;
      let callerName;
      let callerNr;

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
          accessory.context.lastContactSensorState = true;
          service.getCharacteristic(Characteristic.ContactSensorState).updateValue(accessory.context.lastContactSensorState); 
          if(self.storage.getItem('PhoneBook.js')){
            let phonebook = self.storage.getItem('PhoneBook.js');
            let skip = false;
            for(const i in phonebook){
              if(message.caller == phonebook[i].number){
                text = 'Incoming call from: ' + phonebook[i].name + ' ( '+ phonebook[i].number + ' )';
                callerName = phonebook[i].name;
                callerNr = phonebook[i].number;
                skip = true;
              }
            }
            if(!skip){
              text = 'Incoming call from: ' + message.caller;
              callerNr = message.caller;
            }
          } else {
            text = 'Incoming call from: ' + message.caller;
            callerNr = message.caller;
          }
          self.logger.info(text);
          if(self.platform.callmonitor.telegram&&self.platform.callmonitor.chatID&&self.platform.callmonitor.token){
            if(self.platform.callmonitor.message){
              let parseInfo;
              (callerName&&callerNr) ? parseInfo = callerName + ' ( ' + callerNr + ' )' : parseInfo = callerNr + ' ( No name )';
              text = self.platform.callmonitor.message;
              text = message.replace('@', parseInfo);
            }
            self.sendTelegram(self.platform.alarm.token,self.platform.alarm.chatID,text); 
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
          accessory.context.lastContactSensorState = true;
          service.getCharacteristic(Characteristic.ContactSensorState).updateValue(accessory.context.lastContactSensorState);
          service.getCharacteristic(Characteristic.ContactSensorState).updateValue(accessory.context.lastContactSensorState);
          let called = message.called.replace(/\D/g,''); 
          if(self.storage.getItem('PhoneBook.js')){
            let phonebook = self.storage.getItem('PhoneBook.js');
            let skip = false;
            for(const i in phonebook){
              if(called == phonebook[i].number){
                text = 'Calling: ' + phonebook[i].name + ' ( '+ phonebook[i].number + ' )';
                skip = true;
              }
            }
            if(!skip){
              text = 'Calling: ' + called;
            }
          } else {
            text = 'Calling: ' + called;
          }
          self.logger.info(text);
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
          accessory.context.lastContactSensorState = true;
          service.getCharacteristic(Characteristic.ContactSensorState).updateValue(accessory.context.lastContactSensorState);
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
          accessory.context.lastContactSensorState = false;
          service.getCharacteristic(Characteristic.ContactSensorState).updateValue(accessory.context.lastContactSensorState);
          self.logger.info('Call disconnected');
        }
      }

    });

    self.client.on('end', () => {
      accessory.context.lastContactSensorState = false;
      service.getCharacteristic(Characteristic.ContactSensorState).updateValue(accessory.context.lastContactSensorState);
      self.client.end();
    });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Extra Characteristics // Sets
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  setPhoneBook(accessory, service, state, callback){
    const self = this;
    let book = self.device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1'];
    !self.entryID ? self.entryID = 0 : self.entryID;
    !self.bookIDs ? self.bookIDs = [] : self.bookIDs;
    !self.currentID ? self.currentID = 0 : self.currentID;
    !self.telBook ? self.telBook = [] : self.telBook;
    if(state){
      self.logger.info('Refreshing phone book...');
      book.actions.GetPhonebookList(function(err, res) {
        if(!err){
          self.bookIDs = res.NewPhonebookList.split(',');
          self.logger.info('Found ' + self.bookIDs.length + ' books! Fetching entries...');
          self.storeEntries(accessory,service);
        } else {
          self.logger.error('An error occured by getting phone books!');
          self.logger.error(JSON.stringify(err,null,4));
        }
      });
      setTimeout(function(){service.getCharacteristic(Characteristic.PhoneBook).setValue(false);},500);
      callback(null, false);
    } else {
      callback(null, false);
    }
  }

  storeEntries(accessory, service){
    const self = this;
    let book = self.device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1'];
    book.actions.GetPhonebookEntry([{name:'NewPhonebookID',value:self.currentID},{name:'NewPhonebookEntryID',value:self.entryID}],function(err, res) {
      if(!err&&res){
        parseString(res.NewPhonebookEntryData,{explicitArray: false,}, function (error, result) {
          if(!error){
            let numbers = result.contact.telephony.number;
            if(numbers.length){
              for(const i in numbers){
                let telnr = numbers[i]._.replace('+49', '0').replace(/\D/g,'');
                self.telBook.push({name: result.contact.person.realName,number:telnr});
              }
            } else {
              let telnr = numbers._.replace('+49', '0').replace(/\D/g,'');
              self.telBook.push({name: result.contact.person.realName,number:telnr});
            }
            self.entryID += 1;
            setTimeout(function(){self.storeEntries(accessory,service);},500);
          } else {
            self.logger.error(accessory.displayName + ': An error occured by fetching phone book!');
            self.logger.error(JSON.stringify(error,null,4));
            self.telBook = [];
            self.entryID = 0;
            self.bookIDs = [];
            self.currentID = 0;
          }
        });
      } else {
        if(err.tr064code == '713'){
          self.entryID = 0;
          if(self.currentID < self.bookIDs.length){
            self.logger.info('Phone book [' + self.currentID + '] done. Looking for another books!');
            setTimeout(function(){self.storeEntries(accessory, service);},500);
            self.currentID += 1;
          } else if (self.currentID == self.bookIDs.length){
            self.logger.info('Found ' + self.telBook.length + ' entries in phone book [' + self.bookIDs + ']. Setting it to storage!');
            self.storage.setItem('PhoneBook.js', self.telBook);
            self.currentID = 0;
            self.telBook = [];
          }
        } else {
          self.logger.error(accessory.displayName + ': An error occured by getting phone book!');
          self.logger.error(JSON.stringify(err,null,4));
          self.telBook = [];
          self.entryID = 0;
          self.bookIDs = [];
          self.currentID = 0;
        }
      }
    });
  }

  setWifiTwo(accessory, service, state, callback){
    const self = this;
    let wlan = self.device.services['urn:dslforum-org:service:WLANConfiguration:1'];
    let status;
    state ? status = 1 : status = 0;
    wlan.actions.SetEnable([{name:'NewEnable', value:status}],function(err) {
      if(!err){
        state ? self.logger.info(accessory.displayName + ': Turning on WIFI 2.4 Ghz') : self.logger.info(accessory.displayName + ': Turning off WIFI 2.4 Ghz');
        accessory.context.lastWifiTwoState = state;
        callback(null, state);
      } else {
        state ? self.logger.error(accessory.displayName + ': An error occured by turning on WIFI 2.4 Ghz') : self.logger.error(accessory.displayName + ': An error occured by turning off WIFI 2.4 Ghz');
        self.logger.error(JSON.stringify(err,null,4));
        accessory.context.lastWifiTwoState = state ? false : true;
        setTimeout(function(){service.getCharacteristic(Characteristic.WifiTwo).updateValue(accessory.context.lastWifiTwoState);},500);
        callback(null, accessory.context.lastWifiTwoState);
      }
    });
  }

  setWifiFive(accessory, service, state, callback){
    const self = this;
    let wlan = self.device.services['urn:dslforum-org:service:WLANConfiguration:2'];
    let status;
    state ? status = 1 : status = 0;
    wlan.actions.SetEnable([{name:'NewEnable', value:status}],function(err) {
      if(!err){
        state ? self.logger.info(accessory.displayName + ': Turning on WIFI 5 Ghz') : self.logger.info(accessory.displayName + ': Turning off WIFI 5 Ghz');
        accessory.context.lastWifiFiveState = state;
        callback(null, state);
      } else {
        state ? self.logger.error(accessory.displayName + ': An error occured by turning on WIFI 5 Ghz') : self.logger.error(accessory.displayName + ': An error occured by turning off WIFI 5 Ghz');
        self.logger.error(JSON.stringify(err,null,4));
        accessory.context.lastWifiFiveState = state ? false : true;
        setTimeout(function(){service.getCharacteristic(Characteristic.WifiFive).updateValue(accessory.context.lastWifiFiveState);},500);
        callback(null, accessory.context.lastWifiFiveState);
      }
    });
  }

  setWifiGuest(accessory, service, state, callback){
    const self = this;
    let wlan;
    if(self.device.services['urn:dslforum-org:service:WLANConfiguration:3']){
      wlan = self.device.services['urn:dslforum-org:service:WLANConfiguration:3'];
    } else {
      wlan = self.device.services['urn:dslforum-org:service:WLANConfiguration:2'];
    }
    let status;
    state ? status = 1 : status = 0;
    wlan.actions.SetEnable([{name:'NewEnable', value:status}],function(err) {
      if(!err){
        state ? self.logger.info(accessory.displayName + ': Turning on WIFI Guest') : self.logger.info(accessory.displayName + ': Turning off WIFI Guest');
        accessory.context.lastWifiGuestState = state;
        callback(null, state);
      } else {
        state ? self.logger.error(accessory.displayName + ': An error occured by turning on WIFI Guest') : self.logger.error(accessory.displayName + ': An error occured by turning off WIFI Guest');
        self.logger.error(JSON.stringify(err,null,4));
        accessory.context.lastWifiGuestState = state ? false : true;
        setTimeout(function(){service.getCharacteristic(Characteristic.WifiGuest).updateValue(accessory.context.lastWifiGuestState);},500);
        callback(null, accessory.context.lastWifiGuestState);
      }
    });
  }

  setWifiWPS(accessory, service, state, callback){
    const self = this;
    let wlan = self.device.services['urn:dslforum-org:service:WLANConfiguration:1'];
    let status;
    state ? status = 'pbc' : status = 'stop';
    self.wpsTimer = moment().unix();
    wlan.actions['X_AVM-DE_SetWPSConfig']([{name:'NewX_AVM-DE_WPSMode', value:status},{name:'NewX_AVM-DE_WPSClientPIN',value:''}],function(err) {
      if(!err){
        state ? self.logger.info(accessory.displayName + ': Turning on WIFI WPS for 2 minutes!') : self.logger.info(accessory.displayName + ': Turning off WIFI WPS');
        accessory.context.lastWifiWPSState = state;
        callback(null, state);
      } else {
        state ? self.logger.error(accessory.displayName + ': An error occured by turning on WIFI WPS') : self.logger.error(accessory.displayName + ': An error occured by turning off WIFI WPS');
        self.logger.error(JSON.stringify(err,null,4));
        accessory.context.lastWifiWPSState = state ? false : true;
        setTimeout(function(){service.getCharacteristic(Characteristic.WifiWPS).updateValue(accessory.context.lastWifiWPSState);},500);
        callback(null, accessory.context.lastWifiWPSState);
      }
    });
  }

  setAW(accessory, service, state, callback){
    const self = this;
    let aw = self.device.services['urn:dslforum-org:service:X_AVM-DE_TAM:1'];
    let status;
    state ? status = 1 : status = 0;
    aw.actions.SetEnable([{name:'NewIndex', value:'0'},{name:'NewEnable', value:status}],function(err) {
      if(!err){
        state ? self.logger.info(accessory.displayName + ': Turn on Answering Machine') : self.logger.info(accessory.displayName + ': Turn off Answering Machine');
        accessory.context.lastAWState = state;
        callback(null, state);
      } else {
        state ? self.logger.error(accessory.displayName + ': An error occured by turning on Answering Machine') : self.logger.error(accessory.displayName + ': An error occured by turning off Answering Machine');
        self.logger.error(JSON.stringify(err,null,4));
        accessory.context.lastAWState = state ? false : true;
        setTimeout(function(){service.getCharacteristic(Characteristic.AnsweringMachine).updateValue(accessory.context.lastAWState);},500);
        callback(null, accessory.context.lastAWState);
      }
    });
  }

  setReboot(accessory, service, state, callback){
    const self = this;
    if(state){
      if(self.platform.reboot.cmd_on&&self.platform.reboot.cmd_off){
        self.logger.info(accessory.displayName + ': Initialising reboot...');
        accessory.context.stopPolling = true;
        for(const i in self.accessories){
          self.accessories[i].context.stopPolling = true;
        }
        self.logger.info(accessory.displayName + ': Polling were stopped!');
        exec(self.platform.reboot.cmd_on, function (error, stdout, stderr) {
          if(!error){
            if(stdout == 1){
              self.logger.info(accessory.displayName + ': All homebridge instances were stopped! Preparing for reboot...');
              let reboot = self.device.services['urn:dslforum-org:service:DeviceConfig:1'];
              reboot.actions.Reboot(function() {
                if(self.platform.options.reboot&&self.platform.options.reboot.telegram&&self.platform.options.reboot.chatID&&self.platform.options.reboot.token){
                  let message = 'Network reboot started!';
                  if(self.platform.options.reboot.messages&&self.platform.options.reboot.messages.on){
                    message = self.platform.options.reboot.messages.on;
                  }
                  accessory.context.reboot = true;
                  self.sendTelegram(self.platform.options.reboot.token,self.platform.options.reboot.chatID,message); 
                }
                for(const i in self.accessories){
                  if(self.accessories[i].context.type == self.types.repeater){
                    let tr064Repeater = new tr.TR064(self.accessories[i].context.options); 
                    tr064Repeater.initDevice('TR064')
                      .then(result => {
                        result.startEncryptedCommunication()
                          .then(device => {
                            device.login(self.accessories[i].context.options.username, self.accessories[i].context.options.password);
                            let reboot2 = device.services['urn:dslforum-org:service:DeviceConfig:1'];
                            reboot2.actions.Reboot(function() {
                              self.logger.info(self.accessories[i].displayName + ': Rebooting...'); 
                            });
                          })
                          .catch(sslerr => {
                            self.logger.error('No reboot possible! An error occured by starting encrypted communication with ' + self.accessories[i].displayName);
                            self.logger.error(JSON.stringify(sslerr,null,4));
                          });
                      })
                      .catch(err => {
                        self.logger.error('No reboot possible! An error occured by initializing repeater: ' + self.accessories[i].displayName);
                        self.logger.error(JSON.stringify(err,null,4));
                      });
                  }
                }
                self.logger.info(accessory.displayName + ': Homebridge instances will be restarted automatically in 5 minutes!');
                self.logger.info(accessory.displayName + ': Rebooting...'); 
                exec(self.platform.reboot.cmd_off, function (error, stdout, stderr) {
                  if(!error){
                    self.logger.info(accessory.displayName + ': All homebridge instances were restarted!');
                    error = null;
                  } else {
                    self.logger.error(accessory.displayName + ': An error occured by executing the OFF script Please restart manually all your homebridge instances!');
                    self.logger.error(stderr);
                  }
                });
              });
            } else {
              self.logger.warn('Can not continue with rebooting! Please add \'echo 1\' at the end of your ON script!');
              accessory.context.stopPolling = false;
              for(const i in self.accessories){
                if(self.accessories[i].context.type==self.types.repeater||self.accessories[i].context.type==self.types.presence){
                  self.accessories[i].context.stopPolling = false;
                }
              }
            }
            error = null;
          } else {
            self.logger.error(accessory.displayName + ': An error occured by executing the ON script!');
            self.logger.error(stderr);
            setTimeout(function(){service.getCharacteristic(Characteristic.Reboot).updateValue(false);},500);
            accessory.context.stopPolling = false;
            for(const i in self.accessories){
              if(self.accessories[i].context.type==self.types.repeater||self.accessories[i].context.type==self.types.presence){
                self.accessories[i].context.stopPolling = false;
              }
            }
          }
        });
      } else {
        let reboot = self.device.services['urn:dslforum-org:service:DeviceConfig:1'];
        self.logger.info('Polling werde stopped!');
        accessory.context.stopPolling = true;
        reboot.actions.Reboot(function() {
          for(const i in self.accessories){
            self.accessories[i].context.stopPolling = true;
            if(self.accessories[i].context.type == self.types.repeater){
              let tr064Repeater = new tr.TR064(self.accessories[i].context.options); 
              tr064Repeater.initDevice('TR064')
                .then(result => {
                  result.startEncryptedCommunication()
                    .then(device => {
                      device.login(self.accessories[i].context.options.username, self.accessories[i].context.options.password);
                      let reboot2 = device.services['urn:dslforum-org:service:DeviceConfig:1'];
                      reboot2.actions.Reboot(function() {
                        self.logger.info(self.accessories[i].displayName + ': Rebooting...'); 
                      });
                    })
                    .catch(sslerr => {
                      self.logger.error('An error occured by starting encrypted communication with ' + self.accessories[i].displayName);
                      self.logger.error(JSON.stringify(sslerr,null,4));
                    });
                })
                .catch(err => {
                  self.logger.error('An error occured by initializing repeater: ' + self.accessories[i].displayName);
                  self.logger.error(JSON.stringify(err,null,4));
                });
            }
          }
          self.logger.info(accessory.displayName + ': Rebooting...');
        });
      }

      setTimeout(function(){service.getCharacteristic(Characteristic.Reboot).updateValue(false);},500);
      callback(null, false);
    } else {
      setTimeout(function(){service.getCharacteristic(Characteristic.Reboot).updateValue(false);},500);
      callback(null, false);
    }
  }

  setDeflection(accessory, service, state, callback){
    const self = this;
    let deflection = self.device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1'];
    let status;
    deflection.actions.GetNumberOfDeflections(function(err, result) {
      if(!err){
        if(result.NewNumberOfDeflections != 0){
          state ? status = 1 : status = 0;
          deflection.actions.SetDeflectionEnable([{name:'NewDeflectionId',value:'0'}, {name:'NewEnable',value:status}],function(err) {
            if(!err){
              state ? self.logger.info(accessory.displayName + ': Turning on Deflection') : self.logger.info(accessory.displayName + ': Turning off Deflection');
              accessory.context.lastDeflectionState = state;
              callback(null, state);
            } else {
              state ? self.logger.error(accessory.displayName + ': An error occured by turning on Deflection') : self.logger.error(accessory.displayName + ': An error occured by turning off Deflection');
              self.logger.error(JSON.stringify(err,null,4));
              accessory.context.lastDeflectiontate = state ? false : true;
              setTimeout(function(){service.getCharacteristic(Characteristic.Deflection).updateValue(accessory.context.lastDeflectionState);},500);
              callback(null, accessory.context.lastDeflectionState);
            }
          });

        } else {
          state ? self.logger.warn('Cant turn on declection, no deflections setted up in fritz.box settings!') : self.logger.warn('Cant turn off declection, no deflections setted up in fritz.box settings!');
          let backState = state ? false : true;
          setTimeout(function(){service.getCharacteristic(Characteristic.Deflection).updateValue(backState);},500);
          callback(null, backState);
        }
      } else {
        self.logger.error(accessory.displayName + ': An error occured by setting deflections! Trying again...');
        self.logger.error(JSON.stringify(err,null,4));
        let backState = state ? false : true;
        setTimeout(function(){service.getCharacteristic(Characteristic.Deflection).updateValue(backState);},500);
        callback(null, backState);
      }
    });
  }

  setWakeUp(accessory, service, state, callback){
    const self = this;
    let wakeup = self.device.services['urn:dslforum-org:service:X_VoIP:1'];
    if(state){
      wakeup.actions['X_AVM-DE_DialNumber']([{name:'NewX_AVM-DE_PhoneNumber',value:accessory.context.internNr}],function(err, result) {
        if(!err||result){
          self.logger.info(accessory.displayName + ': Calling ' + accessory.context.internNr + ' for ' + accessory.context.wakeupDuration/1000 + ' seconds');
          self.sleep(accessory.context.wakeupDuration).then(() => {
            service.getCharacteristic(Characteristic.WakeUp).setValue(false);
          });
          callback(null, true);
        } else {
          self.logger.error(accessory.displayName + ': An error occured by turning on \'Wake Up\'!');
          self.logger.error(JSON.stringify(err,null,4));
          setTimeout(function(){service.getCharacteristic(Characteristic.WakeUp).updateValue(false);},500);
          callback(null, false);
        }
      });
    } else {
      wakeup.actions['X_AVM-DE_DialHangup'](function(err, result) {
        if(!err||result){
          self.logger.info(accessory.displayName + ': Stop calling. Turning off \'Wake Up\'');
          callback(null, false);
        } else {
          self.logger.error(accessory.displayName + ': An error occured by turning off \'Wake Up\'!');
          self.logger.error(JSON.stringify(err,null,4));
          setTimeout(function(){service.getCharacteristic(Characteristic.WakeUp).updateValue(true);},500);
          callback(null, true);
        }
      });
    }
  }

  setAlarm(accessory, service, state, callback){
    const self = this;
    let alarm = self.device.services['urn:dslforum-org:service:X_VoIP:1'];
    if(state){
      alarm.actions['X_AVM-DE_DialNumber']([{name:'NewX_AVM-DE_PhoneNumber',value:accessory.context.alarmNumber}],function(err, result) {
        if(!err||result){
          let message = 'Alarm activated! Calling ' + accessory.context.alarmNumber + ' for ' + accessory.context.alarmDuration/1000 + ' seconds';
          self.logger.info(accessory.displayName + ': ' + message);
          if(self.platform.alarm.telegram&&self.platform.alarm.chatID&&self.platform.alarm.token){
            if(self.platform.alarm.messages && typeof self.platform.alarm.messages.activated != 'undefined'){
              message = self.platform.alarm.messages.activated;
              message = message.replace('@', accessory.context.alarmNumber);
            }
            self.sendTelegram(self.platform.alarm.token,self.platform.alarm.chatID,message); 
          }
          self.sleep(accessory.context.alarmDuration).then(() => {
            service.getCharacteristic(Characteristic.DialAlarm).setValue(false);
          });
          callback(null, true);
        } else {
          self.logger.error(accessory.displayName + ': An error occured by turning on \'Alarm\'!');
          self.logger.error(JSON.stringify(err,null,4));
          setTimeout(function(){service.getCharacteristic(Characteristic.DialALarm).updateValue(false);},500);
          callback(null, false);
        }
      });
    } else {
      alarm.actions['X_AVM-DE_DialHangup'](function(err, result) {
        if(!err||result){
          let message = 'Stop calling. Turning off \'Alarm\'';
          self.logger.info(accessory.displayName + ': ' + message);
          if(self.platform.alarm.telegram&&self.platform.alarm.chatID&&self.platform.alarm.token){
            if(self.platform.alarm.messages && typeof self.platform.alarm.messages.deactivated != 'undefined')message = self.platform.alarm.messages.deactivated;
            self.sendTelegram(self.platform.alarm.token,self.platform.alarm.chatID,message); 
          }
          callback(null, false);
        } else {
          self.logger.error(accessory.displayName + ': An error occured by turning off \'Alarm\'!');
          self.logger.error(JSON.stringify(err,null,4));
          setTimeout(function(){service.getCharacteristic(Characteristic.DialAlarm).updateValue(true);},500);
          callback(null, true);
        }
      });
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Extra Characteristics // Gets
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  checkWifiTwo(accessory, service, callback){
    const self = this;
    let wlan = self.device.services['urn:dslforum-org:service:WLANConfiguration:1'];
    if(!accessory.context.stopPolling){
      wlan.actions.GetInfo(function(err, result) {
        if(!err){
          if(result.NewEnable == '1'){
            accessory.context.lastWifiTwoState = true;
          } else {
            accessory.context.lastWifiTwoState = false;
          }
        } else {
          self.logger.error(accessory.displayName + ': An error occured by getting WIFI 2.4 Ghz state!');
          self.logger.error(JSON.stringify(err,null,4));
        }
        callback(null, accessory.context.lastWifiTwoState);
      });
    } else {
      callback(null, accessory.context.lastWifiTwoState);
    }
  }

  checkWifiFive(accessory, service, callback){
    const self = this;
    let wlan = self.device.services['urn:dslforum-org:service:WLANConfiguration:2'];
    if(!accessory.context.stopPolling){
      wlan.actions.GetInfo(function(err, result) {
        if(!err){
          if(result.NewEnable == '1'){
            accessory.context.lastWifiFiveState = true;
          } else {
            accessory.context.lastWifiFiveState = false;
          }
        } else {
          self.logger.error(accessory.displayName + ': An error occured by getting WIFI 5 Ghz state!');
          self.logger.error(JSON.stringify(err,null,4));
        }
        callback(null, accessory.context.lastWifiFiveState);
      });
    } else {
      callback(null, accessory.context.lastWifiFiveState);
    }
  }

  checkWifiGuest(accessory, service, callback){
    const self = this;
    let wlan;
    if(self.device.services['urn:dslforum-org:service:WLANConfiguration:3']){
      wlan = self.device.services['urn:dslforum-org:service:WLANConfiguration:3'];
    } else {
      wlan = self.device.services['urn:dslforum-org:service:WLANConfiguration:2'];
    }
    if(!accessory.context.stopPolling){
      wlan.actions.GetInfo(function(err, result) {
        if(!err){
          if(result.NewEnable == '1'){
            accessory.context.lastWifiGuestState = true;
          } else {
            accessory.context.lastWifiGuestState = false;
          }
        } else {
          self.logger.error(accessory.displayName + ': An error occured by getting WIFI Guest state!');
          self.logger.error(JSON.stringify(err,null,4));
        }
        callback(null, accessory.context.lastWifiGuestState);
      });
    } else {
      callback(null, accessory.context.lastWifiGuestState);
    }
  }

  checkWifiWPS(accessory, service, callback){
    const self = this;
    let wlan = self.device.services['urn:dslforum-org:service:WLANConfiguration:1'];
    if(!accessory.context.stopPolling){
      self.sleep(1000).then(() => {
        wlan.actions['X_AVM-DE_GetWPSInfo'](function(err, result) {
          if(!err){
            if(result['NewX_AVM-DE_WPSStatus'] == 'active'){
              accessory.context.lastWifiWPSState = true;
            } else {
              if((moment().unix()-self.wpsTimer)>=120){
                self.wpsTimer = undefined;
                self.logger.info('2 minutes are over. Turning off WIFI WPS!');
              }
              accessory.context.lastWifiWPSState = false;
            }
          } else {
            self.logger.error(accessory.displayName + ': An error occured by getting WIFI WPS state!');
            self.logger.error(JSON.stringify(err,null,4));
          }
          callback(null, accessory.context.lastWifiWPSState);
        });
      });
    } else {
      callback(null, accessory.context.lastWifiWPSState);
    }
  }

  checkAW(accessory, service, callback){
    const self = this;
    let aw = self.device.services['urn:dslforum-org:service:X_AVM-DE_TAM:1']; 
    if(!accessory.context.stopPolling){
      aw.actions.GetInfo([{name:'NewIndex',value:'0'}],function(err, result) {
        if(!err){
          if(result.NewEnable == '1'){
            accessory.context.lastAWState = true;
          } else {
            accessory.context.lastAWState = false;
          }
        } else {
          self.logger.error(accessory.displayName + ': An error occured by getting Answering Machine state!');
          self.logger.error(JSON.stringify(err,null,4));
        }
        callback(null, accessory.context.lastAWState);
      });
    } else {
      callback(null, accessory.context.lastAWState);
    }
  }

  checkDeflection(accessory, service, callback){
    const self = this;
    let deflection = self.device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1'];
    if(!accessory.context.stopPolling){
      deflection.actions.GetNumberOfDeflections(function(err, result) {
        if(!err){
          if(result.NewNumberOfDeflections != 0){
            let deflection = self.device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1'];

            deflection.actions.GetDeflection([{name:'NewDeflectionId',value:'0'}],function(err, result) {
              if(!err){
                if(result.NewEnable == '1'){
                  accessory.context.lastDeflectiontate = true;
                } else {
                  accessory.context.lastDeflectiontate = false;
                }
              } else {
                self.logger.error(accessory.displayName + ': An error occured by getting Deflection state!');
                self.logger.error(JSON.stringify(err,null,4));
              }
              callback(null, accessory.context.lastDeflectiontate);
            });
          } else {
            callback(null, accessory.context.lastDeflectiontate);
            self.logger.warn('Cant check declection state, no deflections setted up in fritz.box settings!');
            accessory.context.lastDeflectiontate = false;
            self.ignorePosted = 1;
            service.getCharacteristic(Characteristic.Deflection).updateValue(accessory.context.lastDeflectiontate);
            setTimeout(function(){
              self.checkDeflection(accessory, service);
            }, (Math.random() * ((self.polling+5) - self.polling) + self.polling)*1000);
          }
        } else {
          callback(null, accessory.context.lastDeflectiontate);
          self.logger.error(accessory.displayName + ': An error occured by getting Number of Deflactions!');
          self.logger.error(JSON.stringify(err,null,4));
        }
      });

    } else {
      callback(null, accessory.context.lastDeflectiontate);
    }
  }

  getMeasurement(accessory, service){
    const self = this;
    self.logger.info('Starting broadband measurement...');
    speedTest({
      maxTime: accessory.context.maxTime
    })
      .on('data', data => {
        accessory.context.lastDLSpeed = data.speeds.download;
        accessory.context.lastULSpeed = data.speeds.upload;
        accessory.context.lastPing = data.server.ping;
        self.logger.info('Download: ' + accessory.context.lastDLSpeed + ' Mbps');
        self.logger.info('Upload: ' + accessory.context.lastULSpeed + ' Mbps');
        self.logger.info('Ping: ' + accessory.context.lastPing + ' ms');
        self.logger.info('Next measurement in ' + accessory.context.broadbandPolling + ' minutes');
        service.getCharacteristic(Characteristic.DownloadSpeed).updateValue(accessory.context.lastDLSpeed);
        service.getCharacteristic(Characteristic.UploadSpeed).updateValue(accessory.context.lastULSpeed);
        service.getCharacteristic(Characteristic.Ping).updateValue(accessory.context.lastPing);
        setTimeout(function() {
          self.getMeasurement(accessory, service);
        }, accessory.context.broadbandPolling); //60 minutes
      })
      .on('error', err => {
        self.logger.error(accessory.displayName + ': An error occured by checking broadband');
        self.logger.error(JSON.stringify(err,null,4));
        service.getCharacteristic(Characteristic.DownloadSpeed).updateValue(accessory.context.lastDLSpeed);
        service.getCharacteristic(Characteristic.UploadSpeed).updateValue(accessory.context.lastULSpeed);
        service.getCharacteristic(Characteristic.Ping).updateValue(accessory.context.lastPing);
        setTimeout(function() {
          self.getMeasurement(accessory, service);
        }, 60 * 1000); //1minutes
      });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // MotionSensor
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getAnyoneMotionDetected(accessory, service){
    const self = this;
    let allAccessories = self.accessories;
    let motion = 0;
    for(const i in allAccessories){
      if(allAccessories[i].context.type == self.types.presence && allAccessories[i].displayName != 'Anyone'){
        let state = allAccessories[i].getService(Service.MotionSensor).getCharacteristic(Characteristic.MotionDetected).value;
        if(state){
          motion += 1;
        }
      }
    }
    if(motion > 0){
      accessory.context.lastMotionState = true;
    } else {
      accessory.context.lastMotionState = false;
    }
    service.getCharacteristic(Characteristic.MotionDetected).updateValue(accessory.context.lastMotionState);
    setTimeout(function(){self.getAnyoneMotionDetected(accessory, service);},1000);
  }

  getMotionDetected(accessory, service){
    const self = this;
    let allAccessories = self.accessories;
    let repeater = [];
    let user = self.device.services['urn:dslforum-org:service:Hosts:1'];
    if(!accessory.context.stopPolling){
      user.actions.GetSpecificHostEntry([{name:'NewMACAddress', value:accessory.context.mac}],function(err, result) {
        if(!err){
          if(result.NewActive == '1'){
            accessory.context.lastMotionState = true;
            service.getCharacteristic(Characteristic.MotionDetected).updateValue(accessory.context.lastMotionState);
            setTimeout(function(){
              self.getMotionDetected(accessory, service);
            }, (Math.random() * ((self.polling+5) - self.polling) + self.polling)*1000);
          } else { 
            for(const i in allAccessories){
              if(allAccessories[i].context.type == self.types.repeater){
                repeater.push([{
                  host: allAccessories[i].context.options.host,
                  port: allAccessories[i].context.options.port,
                  username: allAccessories[i].context.options.username,
                  password: allAccessories[i].context.options.password,
                  timeout: allAccessories[i].context.options.timeout,
                }]);
              }
            }
            let checkPresenceFunction = function(options, callback){
              options = options[0];
              if(!accessory.context.stopPolling){
                let tr064Repeater = new tr.TR064(options); 
                tr064Repeater.initDevice('TR064')
                  .then(result => {
                    result.startEncryptedCommunication()
                      .then(device => {
                        device.login(options.username, options.password);
                        let userRepeater = device.services['urn:dslforum-org:service:Hosts:1'];
                        userRepeater.actions.GetSpecificHostEntry([{name:'NewMACAddress', value:accessory.context.mac}],function(err, res) {
                          if(!err){
                            if(res.NewActive == '1'){
                              callback(null, true);
                            } else {
                              callback(null, false);
                            }
                          } else {
                            callback(err, null);
                          }
                        });
                      })
                      .catch(sslerr => {
                        callback(sslerr, null);
                      });
                  })
                  .catch(err => {
                    callback(err, null);
                  });
              } else {
                callback(null, accessory.context.lastMotionState);
              }
            };
            async.concat(repeater, checkPresenceFunction, function(err, values) {
              if(!err){
                if(values.includes(true)){
                  accessory.context.lastMotionState = true;
                  service.getCharacteristic(Characteristic.MotionDetected).updateValue(accessory.context.lastMotionState);
                } else {
                  accessory.context.lastMotionState = false;
                  service.getCharacteristic(Characteristic.MotionDetected).updateValue(accessory.context.lastMotionState);
                }
              } else {
                self.logger.error('An error occured by checking presence state from repeater!');
              }
              if(!accessory.context.stopPolling){
                setTimeout(function(){
                  self.getMotionDetected(accessory, service);
                }, (Math.random() * ((self.polling+5) - self.polling) + self.polling)*1000);
              }
            });
          }
          self.error.presence = 0;
        } else {
          !self.error.presence ? self.error.presence = 0 : self.error.presence;
          if(self.error.presence > 5){
            self.error.presence = 0;
            self.logger.error(accessory.displayName + ': An error occured by getting presence state, trying again...');
            self.logger.error(JSON.stringify(err,null,4));
          } else {
            self.error.presence += 1;
          }
          service.getCharacteristic(Characteristic.MotionDetected).updateValue(accessory.context.lastMotionState);
          setTimeout(function(){
            self.getMotionDetected(accessory, service);
          }, (Math.random() * ((self.polling+5) - self.polling) + self.polling)*1000);
        }
      });
    } else {
      service.getCharacteristic(Characteristic.MotionDetected).updateValue(accessory.context.lastMotionState);
      setTimeout(function(){
        self.getMotionDetected(accessory, service);
      }, (Math.random() * ((self.polling+5) - self.polling) + self.polling)*1000);
    }
  }

  getMotionLastActivation(accessory, service){
    const self = this;
    const totallength = accessory.context.fakegatoService.history.length - 1;
    const latestTime = accessory.context.fakegatoService.history[totallength].time;
    const state = accessory.context.lastMotionState ? 1:0;
    state == 1 ? accessory.context.lastActivation = moment().unix() : accessory.context.lastActivation = latestTime - accessory.context.fakegatoService.getInitialTime();
    service.getCharacteristic(Characteristic.EveMotionLastActivation).updateValue(accessory.context.lastActivation);
    setTimeout(function(){
      self.getMotionLastActivation(accessory, service);
    }, 1000);
  }

  changeValue(accessory, service, type, subtype, value){
    const self = this;
    value.context = subtype;
    switch (type) {
      case 2:
        if(accessory.displayName != 'Anyone'){
          if(value.newValue){
            let message = 'Welcome at home ' + accessory.displayName;
            self.logger.info(message);
            if(self.platform.presence&&self.platform.presence.telegram&&self.platform.presence.chatID&&self.platform.presence.token){
              if(self.platform.presence.messages && typeof self.platform.presence.messages.anyone != 'undefined'){
                message = self.platform.presence.messages.anyone;
                message = message.replace('@', accessory.displayName);
              }
              self.sendTelegram(self.platform.presence.token,self.platform.presence.chatID,message); 
            }
          } else {
            self.logger.info('Bye bye ' + accessory.displayName);
          }
        } else {
          if(!value.newValue){
            let message = 'No one at home!';
            self.logger.info(message);
            if(self.platform.presence&&self.platform.presence.telegram&&self.platform.presence.chatID&&self.platform.presence.token){
              if(self.platform.presence.messages && typeof self.platform.presence.messages.noone != 'undefined'){
                message = self.platform.presence.messages.noone;
              }
              self.sendTelegram(self.platform.presence.token,self.platform.presence.chatID,message); 
            }
          }
        }
        accessory.context.fakegatoService.addEntry({
          time: moment().unix(),
          status: value.newValue ? 1:0
        });
        break;
      default:
        break;
    }
  }

}

module.exports = Fritz_Box;
