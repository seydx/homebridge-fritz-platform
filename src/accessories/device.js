'use strict';

const HomeKitTypes = require('../types/types.js');
const LogUtil = require('../../lib/LogUtil.js');
const packageFile = require('../../package.json');
const parseString = require('xml2js').parseString;
const request = require('request');
const moment = require('moment');
const cheerio = require('cheerio');
const querystring = require('querystring');
const ccodes = require('../../lib/ccodes.js');
const speedTest = require('speedtest-net');
const exec = require('child_process').exec;
const c = new ccodes.CODES();

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
    this.telegram = platform.telegram;
    this.sendTelegram = platform.sendTelegram;
    this.readOnlySwitches = platform.readOnlySwitches;
    this.errorpoll = 60000;
    this.validMAC = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
    this.validIP = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

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
    const self = this;
    let name = parameter.name;
    let deviceType = Accessory.Categories.SWITCH;
    let accessoryType = Service.Switch;

    this.logger.initinfo('Publishing new accessory: ' + name);

    let accessory = this.accessories[name];
    const uuid = UUIDGen.generate(name);

    accessory = new PlatformAccessory(name, uuid, deviceType);
    accessory.addService(accessoryType, name);

    // Setting reachable to true
    accessory.reachable = true;
    accessory.context = {};

    accessory.context.devices = parameter.devices;
    accessory.context.polling = self.polling;
    accessory.context.delay = self.delay;
    accessory.context.telegram = self.telegram;
    accessory.context.lastState = false;
    accessory.context.type = parameter.type;
    accessory.context.alarm = parameter.alarm;
    accessory.context.wakeup = parameter.wakeup;
    accessory.context.boxType = parameter.boxType;
    accessory.context.wifi2 = parameter.wifi2;
    accessory.context.wifi5 = parameter.wifi5;
    accessory.context.wifiGuest = parameter.wifiGuest;
    accessory.context.wps = parameter.wps;
    accessory.context.phoneBook = parameter.phoneBook;
    accessory.context.aw = parameter.aw;
    accessory.context.deflection = parameter.deflection;
    accessory.context.led = parameter.led;
    accessory.context.lock = parameter.lock;
    accessory.context.ringlock = parameter.ringlock;
    accessory.context.broadband = parameter.broadband;
    accessory.context.beta = parameter.beta;
    accessory.context.extReboot = parameter.extReboot;
    accessory.context.mesh = parameter.mesh;
    accessory.context.master = parameter.master;

    //AccessoryInformation
    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, accessory.displayName)
      .setCharacteristic(Characteristic.Identify, accessory.displayName)
      .setCharacteristic(Characteristic.Manufacturer, 'SeydX')
      .setCharacteristic(Characteristic.Model, parameter.boxType)
      .setCharacteristic(Characteristic.SerialNumber, 'B-1234567890')
      .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

    /// Publish
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
      .setCharacteristic(Characteristic.Model, accessory.context.boxType)
      .setCharacteristic(Characteristic.SerialNumber, 'B-1234567890')
      .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

    accessory.on('identify', function (paired, callback) {
      self.logger.info(accessory.displayName + ': Hi!');
      callback();
    });

    let service = accessory.getService(Service.Switch);

    service.getCharacteristic(Characteristic.On)
      .updateValue(accessory.context.lastState)
      .on('set', self.setState.bind(this, accessory, service));

    if(accessory.context.wifi2){
      if (!service.testCharacteristic(Characteristic.WifiTwo)){
        self.logger.initinfo('Adding WIFI 2.4Ghz Characteristic to ' + accessory.displayName);
        accessory.context.lastWifi2State = false;
        service.addCharacteristic(Characteristic.WifiTwo);
      }
      service.getCharacteristic(Characteristic.WifiTwo)
        .updateValue(accessory.context.lastWifi2State)
        .on('set', self.setWifi.bind(this, accessory, service,1));
      this.getWifi(accessory,service,1);
    } else {
      if(service.testCharacteristic(Characteristic.WifiTwo)){
        self.logger.initinfo('Removing WIFI 2.4Ghz from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.WifiTwo));
        accessory.context.lastWifi2State = false;
      }
    } 

    if(accessory.context.wifi5){
      let device;
      for(const i in accessory.context.devices){
        if(accessory.displayName == i){
          device = accessory.context.devices[i]; 
        }
      } 
      if(device.services['urn:dslforum-org:service:WLANConfiguration:3']){
        if (!service.testCharacteristic(Characteristic.WifiFive)){
          self.logger.initinfo('Adding WIFI 5Ghz Characteristic to ' + accessory.displayName);
          accessory.context.lastWifi5State = false;
          service.addCharacteristic(Characteristic.WifiFive);
        }
        service.getCharacteristic(Characteristic.WifiFive)
          .updateValue(accessory.context.lastWifi5State)
          .on('set', self.setWifi.bind(this, accessory, service,2));
        this.getWifi(accessory,service,2);
      }  
    } else {
      if(service.testCharacteristic(Characteristic.WifiFive)){
        self.logger.initinfo('Removing WIFI 5Ghz from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.WifiFive));
        accessory.context.lastWifi5State = false;
      }
    } 

    if(accessory.context.wifiGuest){
      let device, wifitype;
      for(const i in accessory.context.devices){
        if(accessory.displayName == i){
          device = accessory.context.devices[i]; 
        }
      } 
      device.services['urn:dslforum-org:service:WLANConfiguration:3']?wifitype=3:wifitype=2; 
      if (!service.testCharacteristic(Characteristic.WifiGuest)){
        self.logger.initinfo('Adding WIFI Guest Characteristic to ' + accessory.displayName);
        accessory.context.lastWifiGuestState = false;
        service.addCharacteristic(Characteristic.WifiGuest);
      }
      service.getCharacteristic(Characteristic.WifiGuest)
        .updateValue(accessory.context.lastWifiGuestState)
        .on('set', self.setWifi.bind(this, accessory, service, wifitype));
      this.getWifi(accessory,service,wifitype);
    } else {
      if(service.testCharacteristic(Characteristic.WifiGuest)){
        self.logger.initinfo('Removing WIFI Guest from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.WifiGuest));
        accessory.context.lastWifiGuestState = false;
      }
    } 

    //LED with beta profile

    if(accessory.context.led){
      if (!service.testCharacteristic(Characteristic.DeviceLED)){
        self.logger.initinfo('Adding LED Characteristic to ' + accessory.displayName);
        service.addCharacteristic(Characteristic.DeviceLED);
        accessory.context.lastLEDState = false;
      }
      if(accessory.context.beta)self.logger.info('Configuring Device LED for beta firmware...');
      service.getCharacteristic(Characteristic.DeviceLED)
        .updateValue(accessory.context.lastLEDState)
        .on('set', accessory.context.beta?self.setDeviceLEDbeta.bind(this, accessory, service):self.setDeviceLED.bind(this, accessory, service));
      accessory.context.beta?this.checkDeviceLEDbeta(accessory,service):this.checkDeviceLED(accessory,service);
    } else {
      if(service.testCharacteristic(Characteristic.DeviceLED)){
        self.logger.initinfo('Removing LED from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.DeviceLED));
      }
    }

    if(accessory.context.lock){
      if (!service.testCharacteristic(Characteristic.DeviceLock)){
        self.logger.initinfo('Adding Device Lock Characteristic to ' + accessory.displayName);
        service.addCharacteristic(Characteristic.DeviceLock);
        accessory.context.lastDeviceLock = false;
      }
      service.getCharacteristic(Characteristic.DeviceLock)
        .updateValue(accessory.context.lastDeviceLock)
        .on('set', self.setDeviceLock.bind(this, accessory, service));
      this.checkDeviceLock(accessory,service);
    } else {
      if(service.testCharacteristic(Characteristic.DeviceLock)){
        self.logger.initinfo('Removing Device Lock from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.DeviceLock));
      }
    }

    if(accessory.context.ringlock&&accessory.context.ringlock.active&&accessory.context.ringlock.DECTphones){
      if (!service.testCharacteristic(Characteristic.RingLock)){
        self.logger.initinfo('Adding Ring Lock Characteristic to ' + accessory.displayName);
        service.addCharacteristic(Characteristic.RingLock);
        accessory.context.lastRingLock = false;
      }
      service.getCharacteristic(Characteristic.RingLock)
        .updateValue(accessory.context.lastRingLock)
        .on('set', self.setRingLock.bind(this, accessory, service));
      this.checkRingLock(accessory,service);
    } else {
      if(service.testCharacteristic(Characteristic.RingLock)){
        self.logger.initinfo('Removing Ring Lock from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.RingLock));
      }
    }
    
    if(accessory.context.extReboot&&accessory.context.extReboot.active&&accessory.context.extReboot.cmdOn&&accessory.context.extReboot.cmdOff){
      if (!service.testCharacteristic(Characteristic.ExtReboot)){
        self.logger.initinfo('Adding Extended Reboot Characteristic to ' + accessory.displayName);
        service.addCharacteristic(Characteristic.ExtReboot);
      }
      service.getCharacteristic(Characteristic.ExtReboot)
        .updateValue(false)
        .on('set', self.setExtReboot.bind(this, accessory, service));
    } else {
      if(service.testCharacteristic(Characteristic.ExtReboot)){
        self.logger.initinfo('Removing Extended Reboot from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.ExtReboot));
      }
    }

    if(accessory.context.phoneBook){
      if (!service.testCharacteristic(Characteristic.PhoneBook)){
        self.logger.initinfo('Adding PhoneBook Characteristic to ' + accessory.displayName);
        service.addCharacteristic(Characteristic.PhoneBook);
      }
      service.getCharacteristic(Characteristic.PhoneBook)
        .updateValue(false)
        .on('set', self.setPhoneBook.bind(this, accessory, service));
      this.refreshPhoneBook(accessory, service);
    } else {
      if(service.testCharacteristic(Characteristic.PhoneBook)){
        self.logger.initinfo('Removing PhoneBook from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.PhoneBook));
      }
    }

    if(accessory.context.alarm&&accessory.context.alarm.active&&accessory.context.alarm.telNr){
      if (!service.testCharacteristic(Characteristic.DialAlarm)){
        self.logger.initinfo('Adding Alarm Characteristic to ' + accessory.displayName);
        service.addCharacteristic(Characteristic.DialAlarm);
      }
      accessory.context.alarm.duration=accessory.context.alarm.duration?accessory.context.alarm.duration:30;
      service.getCharacteristic(Characteristic.DialAlarm)
        .updateValue(false)
        .on('set', self.setAlarm.bind(this, accessory, service));
    } else {
      if(service.testCharacteristic(Characteristic.DialAlarm)){
        self.logger.initinfo('Removing Alarm from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.DialAlarm));
      }
    } 

    if(accessory.context.wps){
      if (!service.testCharacteristic(Characteristic.WifiWPS)){
        self.logger.initinfo('Adding WIFI WPS Characteristic to ' + accessory.displayName);
        accessory.context.lastWifiWPSState = false;
        service.addCharacteristic(Characteristic.WifiWPS);
      }
      service.getCharacteristic(Characteristic.WifiWPS)
        .updateValue(accessory.context.lastWifiWPSState)
        .on('set', self.setWifiWPS.bind(this, accessory, service));
      this.checkWifiWPS(accessory,service);
    } else {
      if(service.testCharacteristic(Characteristic.WifiWPS)){
        self.logger.initinfo('Removing WIFI WPS from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.WifiWPS));
      }
    }

    if(accessory.context.aw){
      if (!service.testCharacteristic(Characteristic.AnsweringMachine)){
        self.logger.initinfo('Adding Answering Machine Characteristic to ' + accessory.displayName);
        accessory.context.lastAWState = false;
        service.addCharacteristic(Characteristic.AnsweringMachine);
      } 
      service.getCharacteristic(Characteristic.AnsweringMachine)
        .updateValue(accessory.context.lastAWState)
        .on('set', self.setAW.bind(this, accessory, service));
      this.checkAW(accessory,service);
    } else {
      if(service.testCharacteristic(Characteristic.AnsweringMachine)){
        self.logger.initinfo('Removing Answering Machine from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.AnsweringMachine));
      }
    }

    if(accessory.context.deflection){
      if (!service.testCharacteristic(Characteristic.Deflection)){
        self.logger.initinfo('Adding Deflection Characteristic to ' + accessory.displayName);
        service.addCharacteristic(Characteristic.Deflection);
        accessory.context.lastDeflectionState = false;
      }
      service.getCharacteristic(Characteristic.Deflection)
        .updateValue(accessory.context.lastDeflectionState)
        .on('set', self.setDeflection.bind(this, accessory, service));
      this.checkDeflection(accessory,service);
    } else {
      if(service.testCharacteristic(Characteristic.Deflection)){
        self.logger.initinfo('Removing Deflection from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.Deflection));
      }
    }

    if(accessory.context.wakeup&&accessory.context.wakeup.active&&accessory.context.wakeup.internNr){
      if (!service.testCharacteristic(Characteristic.WakeUp)){
        self.logger.initinfo('Adding WakeUp Characteristic to ' + accessory.displayName); 
        service.addCharacteristic(Characteristic.WakeUp);
      } 
      accessory.context.wakeup.duration=accessory.context.wakeup.duration?accessory.context.wakeup.duration:60;
      service.getCharacteristic(Characteristic.WakeUp)
        .updateValue(false)
        .on('set', self.setWakeUp.bind(this, accessory, service));
    } else {
      if(service.testCharacteristic(Characteristic.WakeUp)){
        self.logger.initinfo('Removing WakeUp from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.WakeUp));
      }
    }
    
    if(accessory.context.broadband){
      if (!service.testCharacteristic(Characteristic.Download)){
        self.logger.initinfo('Adding Download Characteristic to ' + accessory.displayName); 
        service.addCharacteristic(Characteristic.Download);
      } 
      if (!service.testCharacteristic(Characteristic.Upload)){
        self.logger.initinfo('Adding Upload Characteristic to ' + accessory.displayName); 
        service.addCharacteristic(Characteristic.Upload);
      } 
      if (!service.testCharacteristic(Characteristic.Ping)){
        self.logger.initinfo('Adding Ping Characteristic to ' + accessory.displayName); 
        service.addCharacteristic(Characteristic.Ping);
      } 
      accessory.context.lastDL = 0;
      accessory.context.lastUL = 0;
      accessory.context.lastPing = 0;
      accessory.context.broadband.measureTime=accessory.context.broadband.measureTime?accessory.context.broadband.measureTime:5;
      accessory.context.broadband.polling=accessory.context.broadband.polling?accessory.context.broadband.polling:30;
      service.getCharacteristic(Characteristic.Download)
        .updateValue(accessory.context.lastDL);
      service.getCharacteristic(Characteristic.Upload)
        .updateValue(accessory.context.lastUL);
      service.getCharacteristic(Characteristic.Ping)
        .updateValue(accessory.context.lastPing);
      //setTimeout(function(){self.checkBroadband(accessory,service);},3000);
      self.checkBroadband(accessory,service);
    } else {
      if(service.testCharacteristic(Characteristic.Download)){
        self.logger.initinfo('Removing Download from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.Download));
      }
      if(service.testCharacteristic(Characteristic.Upload)){
        self.logger.initinfo('Removing Upload from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.Upload));
      }
      if(service.testCharacteristic(Characteristic.Ping)){
        self.logger.initinfo('Removing Ping from ' + accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(Characteristic.Ping));
      }
    }

    //this.fetchSID(accessory);
    this.getState(accessory,service);

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Devices
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getState(accessory,service){
    const self = this;
    if(!accessory.context.stopPolling){
      let box, device;
      for(const i in accessory.context.devices){
        if(accessory.displayName == i){
          device = accessory.context.devices[i]; 
        }
      }
      if(accessory.context.boxType == 'dsl' || accessory.context.boxType == 'cable'){
        if(accessory.context.boxType == 'dsl'){
          box = device.services['urn:dslforum-org:service:WANPPPConnection:1'];
        } else {
          box = device.services['urn:dslforum-org:service:WANIPConnection:1'];
        }
        box.actions.GetInfo(null,{name:accessory.displayName + ' GetState', count:0},function(err, result) {
          if(!err){
            result.NewConnectionStatus=='Connected' ? accessory.context.lastState = true : accessory.context.lastState = false;
            setTimeout(function(){
              self.getState(accessory, service);
            }, accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
          } else {
            if(err.ping){
              self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port + ' - Trying again in ' + (self.errorpoll/1000) + ' seconds...');
              setTimeout(function(){
                self.getState(accessory, service);
              }, self.errorpoll);
            } else {
              self.logger.errorinfo(accessory.displayName + ': An error occured while getting device state, trying again...');
              self.logger.errorinfo(JSON.stringify(err,null,4));
              setTimeout(function(){
                self.getState(accessory, service);
              }, accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
            }
          }
          service.getCharacteristic(Characteristic.On).updateValue(accessory.context.lastState);
        });
      } else {
        box = device.services['urn:dslforum-org:service:WLANConfiguration:1'];
        box.actions.GetInfo(null,{name:accessory.displayName + ' WIFI1', count:0},function(err, result) {
          if(!err){
            if(result.NewStatus == 'Up' && result.NewEnable == '1'){
              accessory.context.lastState = true;
              service.getCharacteristic(Characteristic.On).updateValue(accessory.context.lastState);
              setTimeout(function(){
                self.getState(accessory, service);
              }, accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
            } else {
              if(device.services['urn:dslforum-org:service:WLANConfiguration:3']){
                box = device.services['urn:dslforum-org:service:WLANConfiguration:2'];
                box.actions.GetInfo(null,{name:accessory.displayName + ' WIFI2', count:0},function(errNew, resultNew){
                  if(!errNew){
                    if(resultNew.NewStatus == 'Up' && resultNew.NewEnable == '1'){
                      accessory.context.lastState = true;
                    } else {
                      accessory.context.lastState = false;
                    }
                    setTimeout(function(){
                      self.getState(accessory, service);
                    }, accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
                  } else {
                    if(err.ping){
                      self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port + ' - Trying again in ' + (self.errorpoll/1000) + ' seconds...');
                      setTimeout(function(){
                        self.getState(accessory, service);
                      }, self.errorpoll);
                    } else {
                      self.logger.errorinfo(accessory.displayName + ': An error occured while getting device state!');
                      self.logger.errorinfo(JSON.stringify(err,null,4));
                      setTimeout(function(){
                        self.getState(accessory, service);
                      }, accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
                    }
                  }
                  service.getCharacteristic(Characteristic.On).updateValue(accessory.context.lastState);
                });
              } else {
                accessory.context.lastState = false;
                service.getCharacteristic(Characteristic.On).updateValue(accessory.context.lastState);
                setTimeout(function(){
                  self.getState(accessory, service);
                }, accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
              }
            }
          } else {
            if(err.ping){
              self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port + ' - Trying again in ' + (self.errorpoll/1000) + ' seconds...');
              setTimeout(function(){
                self.getState(accessory, service);
              }, self.errorpoll);
            } else {
              self.logger.errorinfo(accessory.displayName + ': An error occured while getting device state!');
              self.logger.errorinfo(JSON.stringify(err,null,4));
              setTimeout(function(){
                self.getState(accessory, service);
              }, accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
            }
          }
        });
      }
    } else {
      setTimeout(function(){self.getState(accessory,service);},5000);
    }
  }

  setState(accessory,service,state,callback){
    const self = this;
    if(!self.readOnlySwitches){
      let box, device;
      for(const i in accessory.context.devices){
        if(accessory.displayName == i){
          device = accessory.context.devices[i]; 
        }
      }
      if(!state){
        accessory.context.lastState = false;
        box = device.services['urn:dslforum-org:service:DeviceConfig:1'];
        box.actions.Reboot(null,{name:accessory.displayName + ' SetState', count:0},function() {
          self.logger.info(accessory.displayName + ': Rebooting...'); 
        });
        accessory.context.lastState = false;
        callback(null, state);
      } else {
        callback(null, state);
      }
    } else {
      setTimeout(function(){service.getCharacteristic(Characteristic.On).updateValue(state?false:true);},500);
      callback(null, state?false:true);
    }  
  }
  
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Extended Reboot
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  
  setExtReboot(accessory,service,state,callback){
    const self = this;
    let device;
    for(const i in accessory.context.devices){
      if(accessory.displayName == i){
        device = accessory.context.devices[i];
      }
    }
    let reboot = device.services['urn:dslforum-org:service:DeviceConfig:1'];
    if(state){
      if(accessory.context.extReboot.cmdOn&&accessory.context.extReboot.cmdOff){
        self.logger.info(accessory.displayName + ': Initialising reboot...');
        exec(accessory.context.extReboot.cmdOn, function (error, stdout, stderr) {
          if(!error){
            if(stdout == 1){
              self.logger.info(accessory.displayName + ': All homebridge instances were stopped! Preparing for reboot...');
              reboot.actions.Reboot(null,{name:accessory.displayName + ' SetExtReboot',count:0},function() {
                //Telegram Start
                if(Object.keys(self.telegram).length&&self.telegram.active&&self.telegram.extReboot.start){
                  self.sendTelegram(self.telegram.token,self.telegram.chatID,self.telegram.extReboot.start); 
                  self.logger.info(self.telegram.extReboot.start);
                } else {
                  self.logger.info('Network reboot started!');
                }
                self.logger.info(accessory.displayName + ': Homebridge instances will be restarted automatically in 5 minutes!');
                self.logger.info(accessory.displayName + ': Rebooting...'); 
                exec(accessory.context.extReboot.cmdOff, function (error, stdout, stderr) {
                  if(!error){
                    self.logger.info(accessory.displayName + ': All homebridge instances were restarted!');
                  } else {
                    self.logger.errorinfo(accessory.displayName + ': An error occured by executing the CMD OFF script! Please restart manually all your homebridge instances!');
                    self.logger.errorinfo(stderr);
                  }
                });
                //Telegram Finish
                setTimeout(function(){
                  if(Object.keys(self.telegram).length&&self.telegram.active&&self.telegram.extReboot.finish){
                    self.sendTelegram(self.telegram.token,self.telegram.chatID,self.telegram.extReboot.finish); 
                    self.logger.info(self.telegram.extReboot.finish);
                  } else {
                    self.logger.info('Network reboot completed!');
                  }
                },5*60*1000);
              });
            } else {
              self.logger.warninfo('Can not continue with rebooting! Please add \'echo 1\' at the end of your ON script!');
            }
          } else {
            self.logger.errorinfo(accessory.displayName + ': An error occured by executing the CMD ON script!');
            self.logger.errorinfo(stderr);
          }
        });
      }
    }
    setTimeout(function(){service.getCharacteristic(Characteristic.ExtReboot).updateValue(false);},500);
    callback(null, false);
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Broadband
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  
  checkBroadband(accessory,service){
    const self = this;
    
    for(const i in self.accessories){
      self.accessories[i].context.stopPolling = true;
    }
    
    self.logger.info('Stop polling because of bandwith measurement...');
    
    let speed = speedTest({maxTime: accessory.context.broadband.measureTime*1000});
    self.logger.debug('Starting bandwith measurement...');
    speed.on('data', data => {
    
      for(const i in self.accessories){
        self.accessories[i].context.stopPolling = false;
      }
    
      let dl = (Math.round(data.speeds.download)).toString()+' mb/s';
      let ul = (Math.round(data.speeds.upload)).toString()+' mb/s';
      let pi = (Math.round(data.server.ping)).toString()+' ms';
    
      self.logger.info('Download: ' + dl);
      self.logger.info('Upload: ' + ul);
      self.logger.info('Ping: ' + pi);
    
      accessory.context.lastDL = dl;
      accessory.context.lastUL = ul;
      accessory.context.lastPing = pi;
      service.getCharacteristic(Characteristic.Download).updateValue(accessory.context.lastDL);
      
      service.getCharacteristic(Characteristic.Upload).updateValue(accessory.context.lastUL);
      service.getCharacteristic(Characteristic.Ping).updateValue(accessory.context.lastPing);
      
      setTimeout(function(){
        self.checkBroadband(accessory,service);
      }, accessory.context.broadband.polling*60*1000);
    });
    
    speed.on('error', err => {
    
      for(const i in self.accessories){
        self.accessories[i].context.stopPolling = false;
      }
    
      self.logger.errorinfo(accessory.displayName + ': An error occured while measuring bandwith');
      self.logger.errorinfo(err);
      setTimeout(function(){
        self.checkBroadband(accessory,service);
      }, accessory.context.broadband.polling*60*1000);
    });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // WIFI
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getWifi(accessory,service,type){
    const self = this;
    if(!accessory.context.stopPolling){
      let device;
      for(const i in accessory.context.devices){
        if(accessory.displayName == i){
          device = accessory.context.devices[i];
        }
      }
      let wlan = device.services['urn:dslforum-org:service:WLANConfiguration:'+type]; 
      wlan.actions.GetInfo(null,{name:accessory.displayName + ' GetWIFI'+type, count:0},function(err, result) {
        if(!err){
          if(result.NewEnable == '1'){
            switch(type){
              case 1:
                accessory.context.lastWifiTwoState = true;
                service.getCharacteristic(Characteristic.WifiTwo).updateValue(accessory.context.lastWifiTwoState);
                break;
              case 2:
                if(device.services['urn:dslforum-org:service:WLANConfiguration:3']){
                  accessory.context.lastWifiFiveState = true;
                  service.getCharacteristic(Characteristic.WifiFive).updateValue(accessory.context.lastWifiFiveState);
                } else {
                  accessory.context.lastWifiGuestState = true;
                  service.getCharacteristic(Characteristic.WifiGuest).updateValue(accessory.context.lastWifiGuestState);
                }
                break;
              case 3:
                accessory.context.lastWifiGuestState = true;
                service.getCharacteristic(Characteristic.WifiGuest).updateValue(accessory.context.lastWifiGuestState);
                break;
              default:
                self.logger.errorinfo('Cant recognize wifi type');
            }
          } else {
            switch(type){
              case 1:
                accessory.context.lastWifiTwoState = false;
                service.getCharacteristic(Characteristic.WifiTwo).updateValue(accessory.context.lastWifiTwoState);
                break;
              case 2:
                if(device.services['urn:dslforum-org:service:WLANConfiguration:3']){
                  accessory.context.lastWifiFiveState = false;
                  service.getCharacteristic(Characteristic.WifiFive).updateValue(accessory.context.lastWifiFiveState);
                } else {
                  accessory.context.lastWifiGuestState = false;
                  service.getCharacteristic(Characteristic.WifiGuest).updateValue(accessory.context.lastWifiGuestState);
                }
                break;
              case 3:
                accessory.context.lastWifiGuestState = false;
                service.getCharacteristic(Characteristic.WifiGuest).updateValue(accessory.context.lastWifiGuestState);
                break;
              default:
                self.logger.errorinfo('Cant recognize wifi type');
            }
          }
          setTimeout(function(){
            self.getWifi(accessory,service,type); 
          },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
        } else {
          if(err.ping){
            self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port + ' - Trying again in ' + (self.errorpoll/1000) + ' seconds...');
            setTimeout(function(){
              self.getWifi(accessory, service,type);
            }, self.errorpoll);
          } else {
            let name;
            if(type==1){
              name = 'WIFI 2.4 GHz';
            } else if(type == 2){
              name = device.services['urn:dslforum-org:service:WLANConfiguration:3']?'WIFI 5 GHz':'WIFI Guest';
            } else {
              name = 'WIFI Guest';
            }
            self.logger.errorinfo(accessory.displayName + ': An error occured while getting ' + name + ' state!');
            self.logger.errorinfo(JSON.stringify(err,null,4));
            setTimeout(function(){
              self.getWifi(accessory,service,type); 
            },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
          }
        }
      });
    } else {
      setTimeout(function(){self.getWifi(accessory,service,type);},5000);
    }
  }
 
  setWifi(accessory,service,type,state,callback){
    const self = this;
    let status;
    state ? status = '1' : status = '0';
    let device;
    for(const i in accessory.context.devices){
      if(accessory.displayName == i){
        device = accessory.context.devices[i];
      }
    }
    let wlan = device.services['urn:dslforum-org:service:WLANConfiguration:'+type];
    wlan.actions.SetEnable([{name:'NewEnable', value:status}],{name:accessory.displayName + ' SetWIFI'+type, count:0},function(err) {
      if(!err){
        switch(type){
          case 1:
            accessory.context.lastWifiTwoState = state;
            state ? self.logger.info(accessory.displayName + ': Turning on WIFI 2.4 Ghz') : self.logger.info(accessory.displayName + ': Turning off WIFI 2.4 Ghz');
            state = true;
            break;
          case 2:
            if(device.services['urn:dslforum-org:service:WLANConfiguration:3']){
              accessory.context.lastWifiFiveState = state;
              state ? self.logger.info(accessory.displayName + ': Turning on WIFI 5 Ghz') : self.logger.info(accessory.displayName + ': Turning off WIFI 5 Ghz');
            } else {
              accessory.context.lastWifiGuestState = state;
              state ? self.logger.info(accessory.displayName + ': Turning on WIFI Guest') : self.logger.info(accessory.displayName + ': Turning off WIFI Guest');
            }
            state = true;
            break;
          case 3:
            accessory.context.lastWifiGuestState = state;
            state ? self.logger.info(accessory.displayName + ': Turning on WIFI Guest') : self.logger.info(accessory.displayName + ': Turning off WIFI Guest');
            state = true;
            break;
          default:
            self.logger.info('Cant recognize wifi type');
        }
        callback(null, state);
      } else {
        let name;
        if(type==1){
          name = 'WIFI 2.4 GHz';
        } else if(type == 2){
          name = device.services['urn:dslforum-org:service:WLANConfiguration:3']?'WIFI 5 GHz':'WIFI Guest';
        } else {
          name = 'WIFI Guest';
        }
        if(err.ping){
          self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port);
          callback(null, state?false:true);
        } else {
          self.logger.errorinfo(accessory.displayName + ': An error occured while setting ' + name + ' state!');
          self.logger.errorinfo(JSON.stringify(err,null,4));
          callback(null, state?false:true);
        }
      }
    });
  }

  checkWifiWPS(accessory, service){
    const self = this;
    if(!accessory.context.stopPolling){
      let device;
      for(const i in accessory.context.devices){
        if(accessory.displayName == i){
          device = accessory.context.devices[i];
        }
      }
      let wlan = device.services['urn:dslforum-org:service:WLANConfiguration:1'];
      wlan.actions['X_AVM-DE_GetWPSInfo'](null,{name:accessory.displayName + ' GetWPS', count:0},function(err, result) {
        if(!err){
          if(result['NewX_AVM-DE_WPSStatus'] == 'active'){
            accessory.context.lastWifiWPSState = true;
          } else {
            if((moment().unix()-self.wpsTimer)>=120){
              self.wpsTimer = false;
              self.logger.info('2 minutes are over. Turning off WIFI WPS!');
            }
            accessory.context.lastWifiWPSState = false;
          }
          setTimeout(function(){
            self.checkWifiWPS(accessory,service); 
          },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
        } else {
          if(err.ping){
            self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port + ' - Trying again in ' + (self.errorpoll/1000) + ' seconds...');
            setTimeout(function(){
              self.checkWifiWPS(accessory, service);
            }, self.errorpoll);
          } else {
            self.logger.errorinfo(accessory.displayName + ': An error occured while getting WIFI WPS state!');
            self.logger.errorinfo(JSON.stringify(err,null,4));
            setTimeout(function(){
              self.checkWifiWPS(accessory,service); 
            },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
          }
        }
        service.getCharacteristic(Characteristic.WifiWPS).updateValue(accessory.context.lastWifiWPSState);
      });
    } else {
      setTimeout(function(){self.checkWifiWPS(accessory,service);},5000);
    }
  }

  setWifiWPS(accessory, service, state, callback){
    const self = this;
    let device;
    for(const i in accessory.context.devices){
      if(accessory.displayName == i){
        device = accessory.context.devices[i];
      }
    }
    let wlan = device.services['urn:dslforum-org:service:WLANConfiguration:1'];
    let status;
    state ? status = 'pbc' : status = 'stop';
    self.wpsTimer = moment().unix();
    wlan.actions['X_AVM-DE_SetWPSConfig']([{name:'NewX_AVM-DE_WPSMode', value:status},{name:'NewX_AVM-DE_WPSClientPIN',value:''}],{name:accessory.displayName + ' SetWIFI1', count:0},function(err) {
      if(!err){
        state ? self.logger.info(accessory.displayName + ': Turning on WIFI WPS for 2 minutes!') : self.logger.info(accessory.displayName + ': Turning off WIFI WPS');
        accessory.context.lastWifiWPSState = state;
        callback(null, state);
      } else {
        if(err.ping){
          self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port);
        } else {
          state ? self.logger.errorinfo(accessory.displayName + ': An error occured while turning on WIFI WPS') : self.logger.errorinfo(accessory.displayName + ': An error occured while turning off WIFI WPS');
          self.logger.errorinfo(JSON.stringify(err,null,4));
        }
        accessory.context.lastWifiWPSState = state ? false : true;
        setTimeout(function(){service.getCharacteristic(Characteristic.WifiWPS).updateValue(accessory.context.lastWifiWPSState);},500);
        callback(null, accessory.context.lastWifiWPSState);
      }
    });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // PhoneBook
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  
  refreshPhoneBook(accessory, service){
    const self = this;
    this.logger.debug('Refreshing PhoneBook!');
    let device;
    for(const i in accessory.context.devices){
      if(accessory.displayName == i){
        device = accessory.context.devices[i];
      }
    }
    let book = device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1'];
    !self.entryID ? self.entryID = 0 : self.entryID;
    !self.bookIDs ? self.bookIDs = [] : self.bookIDs;
    !self.currentID ? self.currentID = 0 : self.currentID;
    !self.telBook ? self.telBook = [] : self.telBook;
    self.logger.info('Refreshing phone book...');
    book.actions.GetPhonebookList(null,{name:accessory.displayName + ' SetPhoneBook', count:0},function(err, res) {
      if(!err){
        self.bookIDs = res.NewPhonebookList.split(',');
        self.logger.info('Found ' + self.bookIDs.length + ' book(s)! Fetching entries...');
        self.storePhoneBook(accessory,service,device,true);
      } else {
        if(err.ping){
          self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port);
        } else {
          self.logger.errorinfo('An error occured while getting phone books!');
          self.logger.errorinfo(JSON.stringify(err,null,4));
        }
      }
    });
  }

  setPhoneBook(accessory,service,state,callback){
    const self = this;
    let device;
    for(const i in accessory.context.devices){
      if(accessory.displayName == i){
        device = accessory.context.devices[i];
      }
    }
    let book = device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1'];
    !self.entryID ? self.entryID = 0 : self.entryID;
    !self.bookIDs ? self.bookIDs = [] : self.bookIDs;
    !self.currentID ? self.currentID = 0 : self.currentID;
    !self.telBook ? self.telBook = [] : self.telBook;
    if(state){
      self.logger.info('Refreshing phone book...');
      book.actions.GetPhonebookList(null,{name:accessory.displayName + ' SetPhoneBook', count:0},function(err, res) {
        if(!err){
          self.bookIDs = res.NewPhonebookList.split(',');
          self.logger.info('Found ' + self.bookIDs.length + ' book(s)! Fetching entries...');
          self.storePhoneBook(accessory,service,device);
        } else {
          if(err.ping){
            self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port);
          } else {
            self.logger.errorinfo('An error occured while getting phone books!');
            self.logger.errorinfo(JSON.stringify(err,null,4));
          }
        }
      });
      setTimeout(function(){service.getCharacteristic(Characteristic.PhoneBook).setValue(false);},500);
      callback(null, false);
    } else {
      callback(null, false);
    }

  }

  storePhoneBook(accessory,service,device,refresh){
    const self = this;
    let country;
    for(const l in self.accessories){
      if(self.accessories[l].context.type=='callmonitor'){
        country = self.accessories[l].context.config.country;
      }
    }
    !country?country='DE':country;
    let book = device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1'];
    book.actions.GetPhonebook([{name:'NewPhonebookID',value:self.currentID.toString()}],{name:accessory.displayName + ' StorePhoneBook', count:0},function(err, res) {
      if(!err&&res){
        let opt = {
          uri: res.NewPhonebookURL,
          method: 'GET',
          rejectUnauthorized: false,
          requestCert: true,
          agent: false
        };
        request(opt,function(error, response, body) {
          if (!error && response.statusCode == 200) {
            parseString(body,{explicitArray: false},function(err, result) {
              if(!err){
                let contacts = result.phonebooks.phonebook.contact;
                for(const j in contacts){
                  let numbers = contacts[j].telephony.number;
                  if(numbers.length){
                    for(const i in numbers){
                      let nr = '+'+c.getCode(country);
                      let nr2 = '00'+c.getCode(country);
                      let telnr = numbers[i]._;
                      telnr = telnr.replace(/\s/g, '');
                      if(telnr.includes(nr)||telnr.includes(nr2)){
                        telnr = telnr.replace(nr, '0').replace(nr2, '0').replace(/[^a-zA-Z0-9]/g,'');
                      } else {
                        telnr = telnr.replace('+', '00').replace(/[^a-zA-Z0-9]/g,'');
                      }
                      self.telBook.push({name: contacts[j].person.realName,number:telnr});
                    }
                  } else {
                    let nr = '+'+c.getCode(country);
                    let nr2 = '00'+c.getCode(country);
                    let telnr = numbers._;
                    telnr = telnr.replace(/\s/g, '');
                    if(telnr.includes(nr)||telnr.includes(nr2)){
                      telnr = telnr.replace(nr, '0').replace(nr2, '0').replace(/[^a-zA-Z0-9]/g,'');
                    } else {
                      telnr = telnr.replace('+', '00').replace(/[^a-zA-Z0-9]/g,'');
                    }
                    self.telBook.push({name: contacts[j].person.realName,number:telnr});
                  }
                }
                self.currentID += 1;
                self.logger.info('Phone book [' + self.currentID + '] done. Looking for another books!');
                setTimeout(function(){self.storePhoneBook(accessory,service,device,refresh);},500);
              } else {
                self.logger.errorinfo(accessory.displayName + ': An error occured while fetching phone book!');
                self.logger.errorinfo(JSON.stringify(error,null,4));
                self.telBook = [];
                self.entryID = 0;
                self.bookIDs = [];
                self.currentID = 0;
              }
            });
          } else {
            self.logger.errorinfo(accessory.displayName + ': An error occured while fetching phone book!'); 
            response?self.logger.errorinfo(response.body):self.logger.errorinfo(error);
            self.telBook = [];
            self.entryID = 0;
            self.bookIDs = [];
            self.currentID = 0;
          }
        }); 
      } else {
        if(err.tr064code&&err.tr064code == '713'){
          self.logger.info('Cant find other books. Fetching result...');
          self.logger.info('Found ' + self.telBook.length + ' entries in phone book [' + self.currentID + ']. Setting it to storage!');
          self.storage.setItem('PhoneBook.js', self.telBook);
          self.currentID = 0;
          self.telBook = [];
        } else {
          if(err.ping){
            self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port);
          } else {
            self.logger.errorinfo(accessory.displayName + ': An error occured while getting phone book!');
            self.logger.errorinfo(JSON.stringify(err,null,4));
            self.telBook = [];
            self.entryID = 0;
            self.bookIDs = [];
            self.currentID = 0;
          }
        }
        if(refresh){
          self.logger.debug('Next poll in 1h!');
          setTimeout(function(){
            self.refreshPhoneBook(accessory,service);
          }, 60*60*1000); //1h
        } 
      }
    });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Alarm
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  setAlarm(accessory, service, state, callback){
    const self = this;
    let device;
    for(const i in accessory.context.devices){
      if(accessory.displayName == i){
        device = accessory.context.devices[i];
      }
    }
    let alarm = device.services['urn:dslforum-org:service:X_VoIP:1'];
    if(state){
      alarm.actions['X_AVM-DE_DialNumber']([{name:'NewX_AVM-DE_PhoneNumber',value:accessory.context.alarm.telNr}],{name:accessory.displayName + ' SetAlarm', count:0},function(err, result) {
        if(!err||result){
          let message = 'Alarm activated! Calling ' + accessory.context.alarm.telNr + ' for ' + (accessory.context.alarm.duration) + ' seconds';
          self.logger.info(accessory.displayName + ': ' + message);
          if(Object.keys(self.telegram).length&&self.telegram.active&&self.telegram.alarm.activated){
            let text = self.telegram.alarm.activated;
            text = text.replace('@', accessory.context.alarm.telNr);
            self.sendTelegram(self.telegram.token,self.telegram.chatID,text); 
          }
          setTimeout(function(){
            if(service.getCharacteristic(Characteristic.DialAlarm).value)service.getCharacteristic(Characteristic.DialAlarm).setValue(false);
          },accessory.context.alarm.duration*1000);
          callback(null, true);
        } else {
          if(err.ping){
            self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port);
          } else {
            self.logger.errorinfo(accessory.displayName + ': An error occured while turning on Alarm!');
            self.logger.errorinfo(JSON.stringify(err,null,4));
          }
          setTimeout(function(){service.getCharacteristic(Characteristic.DialAlarm).updateValue(false);},500);
          callback(null, false);
        }
      });
    } else {
      alarm.actions['X_AVM-DE_DialHangup'](null,{name:accessory.displayName + ' AlarmHangUp', count:0},function(err, result) {
        if(!err||result){
          self.logger.info(accessory.displayName + ': Stop calling. Turning off Alarm');
          if(Object.keys(self.telegram).length&&self.telegram.active&&self.telegram.alarm.deactivated){
            self.sendTelegram(self.telegram.token,self.telegram.chatID,self.telegram.alarm.deactivated); 
          }
          callback(null, false);
        } else {
          if(err.ping){
            self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port);
          } else {
            self.logger.errorinfo(accessory.displayName + ': An error occured while turning off Alarm!');
            self.logger.errorinfo(JSON.stringify(err,null,4));
          }
          setTimeout(function(){service.getCharacteristic(Characteristic.DialAlarm).updateValue(true);},500);
          callback(null, true);
        }
      });
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // AnsweringMachine
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  checkAW(accessory, service){
    const self = this;
    if(!accessory.context.stopPolling){
      let device;
      for(const i in accessory.context.devices){
        if(accessory.displayName == i){
          device = accessory.context.devices[i];
        }
      }
      let aw = device.services['urn:dslforum-org:service:X_AVM-DE_TAM:1']; 
      aw.actions.GetInfo([{name:'NewIndex',value:'0'}],{name:accessory.displayName + ' GetAW', count:0},function(err, result) {
        if(!err){
          if(result.NewEnable == '1'){
            accessory.context.lastAWState = true;
          } else {
            accessory.context.lastAWState = false;
          }
          setTimeout(function(){
            self.checkAW(accessory,service); 
          },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
        } else {
          if(err.ping){
            self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port + ' - Trying again in ' + (self.errorpoll/1000) + ' seconds...');
            setTimeout(function(){
              self.checkAW(accessory, service);
            }, self.errorpoll);
          } else {
            self.logger.errorinfo(accessory.displayName + ': An error occured while getting Answering Machine state!');
            self.logger.errorinfo(JSON.stringify(err,null,4));
            setTimeout(function(){
              self.checkAW(accessory,service); 
            },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
          }
        }
        service.getCharacteristic(Characteristic.AnsweringMachine).updateValue(accessory.context.lastAWState);
      });
    } else {
      setTimeout(function(){self.checkAW(accessory,service);},5000);
    }
  }

  setAW(accessory, service, state, callback){
    const self = this;
    let device;
    for(const i in accessory.context.devices){
      if(accessory.displayName == i){
        device = accessory.context.devices[i];
      }
    }
    let aw = device.services['urn:dslforum-org:service:X_AVM-DE_TAM:1'];
    let status;
    state ? status = '1' : status = '0';
    aw.actions.SetEnable([{name:'NewIndex', value:'0'},{name:'NewEnable', value:status}],{name:accessory.displayName + ' SetAW', count:0},function(err) {
      if(!err){
        state ? self.logger.info(accessory.displayName + ': Turn on Answering Machine') : self.logger.info(accessory.displayName + ': Turn off Answering Machine');
        accessory.context.lastAWState = state;
        callback(null, accessory.context.lastAWState);
      } else {
        if(err.ping){
          self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port);
        } else {

          state ? self.logger.errorinfo(accessory.displayName + ': An error occured while turning on Answering Machine') : self.logger.errorinfo(accessory.displayName + ': An error occured while turning off Answering Machine');
          self.logger.errorinfo(JSON.stringify(err,null,4));
        }
        accessory.context.lastAWState = state ? false : true;
        setTimeout(function(){service.getCharacteristic(Characteristic.AnsweringMachine).updateValue(accessory.context.lastAWState);},500);
        callback(null, accessory.context.lastAWState);
      }
    });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Deflection
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  checkDeflection(accessory, service){
    const self = this;
    if(!accessory.context.stopPolling){
      let device;
      for(const i in accessory.context.devices){
        if(accessory.displayName == i){
          device = accessory.context.devices[i];
        }
      }
      let deflection = device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1'];
      deflection.actions.GetNumberOfDeflections(null,{name:accessory.displayName + ' GetDeflection1', count:0},function(err, result) {
        if(!err){
          if(result.NewNumberOfDeflections != 0){
            let deflection = device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1'];
            deflection.actions.GetDeflection([{name:'NewDeflectionId',value:'0'}],{name:accessory.displayName + ' GetDeflection2', count:0},function(err, result) {
              if(!err){
                if(result.NewEnable == '1'){
                  accessory.context.lastDeflectionState = true;
                } else {
                  accessory.context.lastDeflectionState = false;
                }
                setTimeout(function(){
                  self.checkDeflection(accessory,service); 
                },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
              } else {
                if(err.ping){
                  self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port + ' - Trying again in ' + (self.errorpoll/1000) + ' seconds...');
                  setTimeout(function(){
                    self.checkDeflection(accessory, service);
                  }, self.errorpoll);
                } else {
                  self.logger.errorinfo(accessory.displayName + ': An error occured while getting Deflection state!');
                  self.logger.errorinfo(JSON.stringify(err,null,4));
                  setTimeout(function(){
                    self.checkDeflection(accessory,service); 
                  },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
                }
              }
              service.getCharacteristic(Characteristic.Deflection).updateValue(accessory.context.lastDeflectionState);
            });
          } else {
            self.logger.warninfo('Cant check declection state, no deflections setted up in fritz.box settings!');
            accessory.context.lastDeflectionState = false;
            self.ignorePosted = 1;
            service.getCharacteristic(Characteristic.Deflection).updateValue(accessory.context.lastDeflectionState);
            setTimeout(function(){
              self.checkDeflection(accessory,service); 
            },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
          }
        } else {
          if(err.ping){
            self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port + ' - Trying again in ' + (self.errorpoll/1000) + ' seconds...');
            setTimeout(function(){
              self.checkDeflection(accessory, service);
            }, self.errorpoll);
          } else {
            self.logger.errorinfo(accessory.displayName + ': An error occured while getting Number of Deflactions!');
            self.logger.errorinfo(JSON.stringify(err,null,4));
            setTimeout(function(){
              self.checkDeflection(accessory,service); 
            },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
          }
        }
      });
    } else {
      setTimeout(function(){self.checkDeflection(accessory,service);},5000);
    }
  }

  setDeflection(accessory, service, state, callback){
    const self = this;
    let device;
    for(const i in accessory.context.devices){
      if(accessory.displayName == i){
        device = accessory.context.devices[i];
      }
    }
    let deflection = device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1'];
    let status;
    deflection.actions.GetNumberOfDeflections(null,{name:accessory.displayName + ' SetDeflection1', count:0},function(err, result) {
      if(!err){
        if(result.NewNumberOfDeflections != '0'){
          state ? status = '1' : status = '0';
          deflection.actions.SetDeflectionEnable([{name:'NewDeflectionId',value:'0'}, {name:'NewEnable',value:status}],{name:accessory.displayName + ' SetDeflection2', count:0},function(err) {
            if(!err){
              state ? self.logger.info(accessory.displayName + ': Turning on Deflection') : self.logger.info(accessory.displayName + ': Turning off Deflection');
              accessory.context.lastDeflectionState = state;
            } else {
              if(err.ping){
                self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port);
              } else {
                state ? self.logger.errorinfo(accessory.displayName + ': An error occured while turning on Deflection') : self.logger.errorinfo(accessory.displayName + ': An error occured while turning off Deflection');
                self.logger.errorinfo(JSON.stringify(err,null,4));
              }
              accessory.context.lastDeflectionState = state ? false : true;
            }
            setTimeout(function(){service.getCharacteristic(Characteristic.Deflection).updateValue(accessory.context.lastDeflectionState);},500);
            callback(null, accessory.context.lastDeflectionState);
          });
        } else {
          state ? self.logger.warninfo('Cant turn on declection, no deflections setted up in fritz.box settings!') : self.logger.warninfo('Cant turn off declection, no deflections setted up in fritz.box settings!');
          accessory.context.lastDeflectionState = state ? false : true;
          setTimeout(function(){service.getCharacteristic(Characteristic.Deflection).updateValue(accessory.context.lastDeflectionState);},500);
          callback(null, accessory.context.lastDeflectionState);
        }
      } else {
        if(err.ping){
          self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port);
        } else { 
          self.logger.errorinfo(accessory.displayName + ': An error occured while setting deflections! Trying again...');
          self.logger.errorinfo(JSON.stringify(err,null,4));
        }
        accessory.context.lastDeflectionState = state ? false : true;
        setTimeout(function(){service.getCharacteristic(Characteristic.Deflection).updateValue(accessory.context.lastDeflectionState);},500);
        callback(null, accessory.context.lastDeflectionState);
      }
    });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // WakeUp
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  setWakeUp(accessory, service, state, callback){
    const self = this;
    let device;
    for(const i in accessory.context.devices){
      if(accessory.displayName == i){
        device = accessory.context.devices[i];
      }
    }
    let wakeup = device.services['urn:dslforum-org:service:X_VoIP:1'];
    if(state){
      wakeup.actions['X_AVM-DE_DialNumber']([{name:'NewX_AVM-DE_PhoneNumber',value:accessory.context.wakeup.internNr}],{name:accessory.displayName + ' SetWakeUp', count:0},function(err, result) {
        if(!err||result){
          self.logger.info(accessory.displayName + ': Calling ' + accessory.context.wakeup.internNr + ' for ' + accessory.context.wakeup.duration + ' seconds');
          setTimeout(function(){
            service.getCharacteristic(Characteristic.WakeUp).setValue(false);
          }, accessory.context.wakeup.duration*1000);
          callback(null, true);
        } else {
          if(err.ping){
            self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port);
          } else {
            self.logger.errorinfo(accessory.displayName + ': An error occured while turning on Wake Up!');
            self.logger.errorinfo(JSON.stringify(err,null,4));
          }
          setTimeout(function(){service.getCharacteristic(Characteristic.WakeUp).updateValue(false);},500);
          callback(null, false);
        }
      });
    } else {
      wakeup.actions['X_AVM-DE_DialHangup'](null,{name:accessory.displayName + ' WakeUpHangUp', count:0},function(err, result) {
        if(!err||result){
          self.logger.info(accessory.displayName + ': Stop calling. Turning off Wake Up!');
          callback(null, false);
        } else {
          if(err.ping){
            self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port);
          } else {
            self.logger.errorinfo(accessory.displayName + ': An error occured while turning off Wake Up!');
            self.logger.errorinfo(JSON.stringify(err,null,4));
          }
          setTimeout(function(){service.getCharacteristic(Characteristic.WakeUp).updateValue(true);},500);
          callback(null, true);
        }
      });
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // LUA - LED for beta Firmware
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  checkDeviceLEDbeta(accessory,service){
    const self = this;
    if(!accessory.context.stopPolling){
      let device, thisSid;
      for(const i in accessory.context.devices){
        if(accessory.displayName == i){
          device = accessory.context.devices[i];
        }
      }     
      if(accessory.context.sids){
        for(const l in accessory.context.sids){
          if(accessory.displayName == l){
            thisSid = accessory.context.sids[l];
          }
        }
      }  
      accessory.context.newSid = thisSid;
      if(accessory.context.newSid){
        let sid = accessory.context.newSid;
        let formData = querystring.stringify({
          xhr: 'all',
          sid: sid,
          page: 'led',
          no_sidrenew: ''
        });
        self.logger.debug(accessory.displayName + ' Request URI ' + 'http://' + device.config.host + '/data.lua?sid='+sid);
        request.post('http://' + device.config.host + '/data.lua?sid='+sid,{form:formData}, function(error, response, body){
          if (!error && (response.statusCode == 200 || response.statusCode == 303)){
            let data = JSON.parse(body);
            let result = data.data.led_display;
            accessory.context.lastLEDState = (result==0)?true:false;
            self.logger.debug(accessory.displayName + ' Request URI ' + 'http://' + device.config.host + '/data.lua?sid='+sid + ' --> SUCCESSFULL');
          } else {
            self.logger.debug(accessory.displayName + ' Request URI ' + 'http://' + device.config.host + '/data.lua?sid='+sid + ' --> ERROR');
            self.logger.errorinfo(accessory.displayName + ': An error occured while getting LED Beta state!');
            let showError = {
              error: error?error.errno:response.statusMessage,
              errorCode: error?error.code:response.statusCode
            };
            self.logger.errorinfo(JSON.stringify(showError,null,4));
          }
          setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLED).updateValue(accessory.context.lastLEDState);}, 500);
          setTimeout(function(){
            self.checkDeviceLEDbeta(accessory,service); 
          },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
        });
      } else {
        self.logger.debug(accessory.displayName + ': getDeviceLedBeta: Wrong SID');
        setTimeout(function(){
          self.checkDeviceLEDbeta(accessory,service); 
        },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
      }
    } else {
      setTimeout(function(){self.checkDeviceLEDbeta(accessory,service);},5000);
    }
  }

  setDeviceLEDbeta(accessory, service, state, callback){
    const self = this;
    let device, thisSid, formData;
    for(const i in accessory.context.devices){
      if(accessory.displayName == i){
        device = accessory.context.devices[i];
      }
    }     
    if(accessory.context.sids){
      for(const l in accessory.context.sids){
        if(accessory.displayName == l){
          thisSid = accessory.context.sids[l];
        }
      }
    }  
    accessory.context.newSid = thisSid;
    if(accessory.context.newSid){
      let sid = accessory.context.newSid;
      if(state){
        formData = querystring.stringify({
          xhr: '1',
          led_brightness: '2',
          environment_light: 'on',
          led_display: '0',
          apply: '',
          sid: sid,
          page: 'led',
        });
      } else {
        formData = querystring.stringify({
          xhr: '1',
          led_brightness: '2',
          environment_light: 'on',
          led_display: '2',
          apply: '',
          sid: sid,
          page: 'led',
        });
      }
      self.logger.debug(accessory.displayName + ' Request URI ' + 'http://' + device.config.host + '/data.lua?sid='+sid);
      request.post('http://' + device.config.host + '/data.lua?sid='+sid,{form:formData}, function(error, response, body){
        if (!error && (response.statusCode == 200 || response.statusCode == 303)){
          state ? self.logger.info(accessory.displayName + ': Turning on LEDs') : self.logger.info(accessory.displayName + ': Turning off LEDs');
          self.logger.debug(accessory.displayName + ' Request URI ' + 'http://' + device.config.host + '/data.lua?sid='+sid + ' --> SUCCESSFULL');
          callback(null, state);
        } else {
          self.logger.debug(accessory.displayName + ' Request URI ' + 'http://' + device.config.host + '/data.lua?sid='+sid + ' --> ERROR');
          self.logger.errorinfo(accessory.displayName + ':An error occured while setting LED Beta state!');
          let showError = {
            error: error?error.errno:response.statusMessage,
            errorCode: error?error.code:response.statusCode
          };
          self.logger.errorinfo(JSON.stringify(showError,null,4));
          setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLED).updateValue(state?false:true);}, 500);
          callback(null, state?false:true);
        }
      });
    } else {
      self.logger.debug(accessory.displayName + ': setDeviceLedBeta: Wrong SID');
      setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLED).updateValue(accessory.context.lastLEDState);}, 500);
      callback(null, accessory.context.lastLEDState);
    }
    //});
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // LUA - LED for official Firmware
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  checkDeviceLED(accessory,service){
    const self = this;
    if(!accessory.context.stopPolling){
      let device, thisSid;
      for(const i in accessory.context.devices){
        if(accessory.displayName == i){
          device = accessory.context.devices[i];
        }
      }     
      if(accessory.context.sids){
        for(const l in accessory.context.sids){
          if(accessory.displayName == l){
            thisSid = accessory.context.sids[l];
          }
        }
      }  
      accessory.context.newSid = thisSid;
      if(accessory.context.newSid){
        let sid = accessory.context.newSid;
        self.logger.debug(accessory.displayName + ' Request URI ' + 'http://' + device.config.host + '/data.lua?sid='+sid);
        request('http://' + device.config.host + '/system/led_display.lua?sid='+sid, function(error, response, body){
          if (!error && response.statusCode == 200){
            self.parseOutput(accessory,body,'led_display', function(err, result){
              if(!err){
                accessory.context.lastLEDState = (result==0)?true:false;
                self.logger.debug(accessory.displayName + ' Request URI ' + 'http://' + device.config.host + '/data.lua?sid='+sid + ' --> PARSE SUCCESSFULL');
              } else {
                self.logger.debug(accessory.displayName + ' Request URI ' + 'http://' + device.config.host + '/data.lua?sid='+sid + ' --> PARSE ERROR');
                self.logger.errorinfo(accessory.displayName + ': An error occured while getting LED state!');
                self.logger.errorinfo(JSON.stringify(err,null,4));
              }
              setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLED).updateValue(accessory.context.lastLEDState);}, 500);
              setTimeout(function(){
                self.checkDeviceLED(accessory,service); 
              },10000);
            });
          } else {
            self.logger.debug(accessory.displayName + ' Request URI ' + 'http://' + device.config.host + '/data.lua?sid='+sid + ' --> ERROR');
            self.logger.errorinfo(accessory.displayName + ': An error occured while getting LED state!');
            let showError = {
              error: error?error.errno:response.statusMessage,
              errorCode: error?error.code:response.statusCode
            };
            self.logger.errorinfo(JSON.stringify(showError,null,4));
            setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLED).updateValue(accessory.context.lastLEDState);}, 500);
            setTimeout(function(){
              self.checkDeviceLED(accessory,service); 
            },15000);
          }
        });
      } else {
        self.logger.debug(accessory.displayName + ': getDeviceLED: Wrong SID');
        setTimeout(function(){
          self.checkDeviceLED(accessory,service); 
        },15000);
      }
    } else {
      setTimeout(function(){self.checkDeviceLED(accessory,service);},5000);
    }
  }

  setDeviceLED(accessory, service, state, callback){
    const self = this;
    let device, thisSid, formData;
    for(const i in accessory.context.devices){
      if(accessory.displayName == i){
        device = accessory.context.devices[i];
      }
    }     
    if(accessory.context.sids){
      for(const l in accessory.context.sids){
        if(accessory.displayName == l){
          thisSid = accessory.context.sids[l];
        }
      }
    }  
    accessory.context.newSid = thisSid;
    if(accessory.context.newSid){
      let sid = accessory.context.newSid;
      if(state){
        formData = querystring.stringify({
          xhr: '1',
          sid: sid,
          no_sidrenew: '',
          led_display: '0',
          apply: '',
          oldpage: '/system/led_display.lua'
        });
      } else {
        formData = querystring.stringify({
          xhr: '1',
          sid: sid,
          no_sidrenew: '',
          led_display: '2',
          apply: '',
          oldpage: '/system/led_display.lua'
        });
      }
      self.logger.debug(accessory.displayName + ' Request URI ' + 'http://' + device.config.host + '/data.lua?sid='+sid);
      request.post('http://' + device.config.host + '/system/led_display.lua?sid='+sid,{form:formData}, function(error, response, body){
        if (!error && (response.statusCode == 200 || response.statusCode == 303)){
          self.logger.debug(accessory.displayName + ' Request URI ' + 'http://' + device.config.host + '/data.lua?sid='+sid + ' --> SET SUCCESSFULL');
          state ? self.logger.info(accessory.displayName + ': Turning on LEDs') : self.logger.info(accessory.displayName + ': Turning off LEDs');
          callback(null, state);
        } else {
          self.logger.debug(accessory.displayName + ' Request URI ' + 'http://' + device.config.host + '/data.lua?sid='+sid + ' --> SET ERROR');
          self.logger.errorinfo(accessory.displayName + ':An error occured while setting LED state!');
          let showError = {
            error: error?error.errno:response.statusMessage,
            errorCode: error?error.code:response.statusCode
          };
          self.logger.errorinfo(JSON.stringify(showError,null,4));
          setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLED).updateValue(state?false:true);}, 500);
          callback(null, state?false:true);
        }
      });
    } else {
      self.logger.debug(accessory.displayName + ': setDeviceLED: Wrong SID');
      setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLED).updateValue(accessory.context.lastLEDState);}, 500);
      callback(null, accessory.context.lastLEDState);
    }
    //});
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // LUA - LOCK
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  checkDeviceLock(accessory,service){
    const self = this;
    if(!accessory.context.stopPolling){
      let device, thisSid;
      for(const i in accessory.context.devices){
        if(accessory.displayName == i){
          device = accessory.context.devices[i];
        }
      }     
      if(accessory.context.sids){
        for(const l in accessory.context.sids){
          if(accessory.displayName == l){
            thisSid = accessory.context.sids[l];
          }
        }
      }  
      accessory.context.newSid = thisSid;
      if(accessory.context.newSid){
        let sid = accessory.context.newSid;
        request('http://' + device.config.host + '/system/keylock.lua?sid='+sid, function(error, response, body){
          if (!error && response.statusCode == 200){
            self.parseOutput(accessory,body,'keylock_enabled', function(err, result){
              if(!err){
                accessory.context.lastDeviceLock = result?true:false;
              } else {
                self.logger.errorinfo(accessory.displayName + ': An error occured while getting Device Lock state!');
                self.logger.errorinfo(JSON.stringify(err,null,4));
              }
              setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLock).updateValue(accessory.context.lastDeviceLock);}, 500);
              setTimeout(function(){
                self.checkDeviceLock(accessory,service); 
              },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
            });
          } else {
            self.logger.errorinfo(accessory.displayName + ': An error occured while getting Device Lock state!');
            let showError = {
              error: error?error.errno:response.statusMessage,
              errorCode: error?error.code:response.statusCode
            };
            self.logger.errorinfo(JSON.stringify(showError,null,4));
            setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLock).updateValue(accessory.context.lastDeviceLock);}, 500);
            setTimeout(function(){
              self.checkDeviceLock(accessory,service); 
            },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
          }
        });
      } else {
        self.logger.debug(accessory.displayName + ': getRingLock: Wrong SID');
        setTimeout(function(){
          self.checkDeviceLock(accessory,service); 
        },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
      }
    } else {
      setTimeout(function(){self.checkDeviceLock(accessory,service);},5000);
    }
  }

  setDeviceLock(accessory, service, state, callback){
    const self = this;
    let device, thisSid, formData;
    for(const i in accessory.context.devices){
      if(accessory.displayName == i){
        device = accessory.context.devices[i];
      }
    }     
    if(accessory.context.sids){
      for(const l in accessory.context.sids){
        if(accessory.displayName == l){
          thisSid = accessory.context.sids[l];
        }
      }
    }  
    accessory.context.newSid = thisSid;
    if(!device.config.host.match('myfritz')){
      if(accessory.context.newSid){
        let sid = accessory.context.newSid;
        if(state){
          formData = querystring.stringify({
            xhr: '1',
            keylock_enabled: '1',
            sid: sid,
            menu_active_page: 'keyLo',
            no_sidrenew: '',
            apply: '',
            page: 'keyLo',
            oldpage: '/system/keylock.lua'
          });
        } else {
          formData = querystring.stringify({
            xhr: '1',
            keylock_enabled: '0',
            sid: sid,
            menu_active_page: 'keyLo',
            no_sidrenew: '',
            apply: '',
            page: 'keyLo',
            oldpage: '/system/keylock.lua'
          });
        }
        request.post('http://' + device.config.host + '/data.lua?sid='+sid,{form:formData}, function(error, response, body){
          if (!error && (response.statusCode == 200 || response.statusCode == 303)){
            state ? self.logger.info(accessory.displayName + ': Turning on Device Lock') : self.logger.info(accessory.displayName + ': Turning off Device Lock');
            callback(null, state);
          } else {
            self.logger.errorinfo(accessory.displayName + ':An error occured while setting Device Lock!');
            let showError = {
              error: error?error.errno:response.statusMessage,
              errorCode: error?error.code:response.statusCode
            };
            self.logger.errorinfo(JSON.stringify(showError,null,4));
            setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLock).updateValue(state?false:true);}, 500);
            callback(null, state?false:true);
          }
        });
      } else {
        self.logger.debug(accessory.displayName + ': setDeviceLock: Wrong SID');
        setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLock).updateValue(accessory.context.lastDeviceLock);}, 500);
        callback(null, accessory.context.lastDeviceLock);
      }
    } else {
      self.logger.warninfo(accessory.displayName + ': Can not set Device Lock in remote mode!');
      setTimeout(function(){service.getCharacteristic(Characteristic.DeviceLock).updateValue(false);}, 500);
      callback(null, accessory.context.lastDeviceLock);
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // LUA - RingLock
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  checkRingLock(accessory,service){
    const self = this;
    if(!accessory.context.stopPolling){
      let device;
      let activeArray = [];
      for(const i in accessory.context.devices){
        if(accessory.displayName == i){
          device = accessory.context.devices[i];
        }
      }
      if(accessory.context.newSid){
        let sid = accessory.context.newSid;
        for(let count=1;count<=accessory.context.ringlock.DECTphones;count++){
          let formData = querystring.stringify({
            xhr: '1',
            idx: count.toString(),
            sid: sid,
            no_sidrenew: '',
            popup_url: '',
            oldpage: '/fon_devices/edit_dect_ring_block.lua'
          });
          request.post('http://' + device.config.host + '/data.lua?sid='+sid,{form:formData}, function(error, response, body){
            if (!error && (response.statusCode == 200 || response.statusCode == 303)){
              self.parseOutput(accessory,body,'nightsetting', function(err, result){
                if(!err){
                  activeArray.push(result);
                } else {
                  self.logger.errorinfo(accessory.displayName + ': An error occured while getting Ring Lock for Phone ' + count);
                  self.logger.errorinfo(JSON.stringify(err,null,4));
                }
                if(count==accessory.context.ringlock.DECTphones){
                  if(activeArray.includes('1')){
                    accessory.context.lastRingLock = true;
                  } else {
                    accessory.context.lastRingLock = false;
                  }
                  setTimeout(function(){service.getCharacteristic(Characteristic.RingLock).updateValue(accessory.context.lastRingLock);}, 500);
                  setTimeout(function(){
                    self.checkRingLock(accessory,service); 
                  },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
                }
              });
            } else {
              self.logger.errorinfo(accessory.displayName + ':An error occured while getting Ring Lock for Phone ' + count);
              let showError = {
                error: error?error.errno:response.statusMessage,
                errorCode: error?error.code:response.statusCode
              };
              self.logger.errorinfo(JSON.stringify(showError,null,4));
              if(count==accessory.context.ringlock.DECTphones){
                setTimeout(function(){service.getCharacteristic(Characteristic.RingLock).updateValue(accessory.context.lastRingLock);}, 500);
                setTimeout(function(){
                  self.checkRingLock(accessory,service); 
                },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
              }
            }
          });

        }
      } else {
        self.logger.debug(accessory.displayName + ': getRingLock: Wrong SID');
        setTimeout(function(){
          self.checkRingLock(accessory,service); 
        },accessory.context.polling*(Math.floor(Math.random() * (10 - 3 + 1)) + 3));
      }
    } else {
      setTimeout(function(){self.checkRingLock(accessory,service);},5000);
    }
  }

  setRingLock(accessory, service, state, callback){
    const self = this;
    let formData, device, dayForm;
    for(const i in accessory.context.devices){
      if(accessory.displayName == i){
        device = accessory.context.devices[i];
      }
    }
    let today = new Date();
    let now = moment();
    let hour = now.hour();
    let minute = now.minute();
    let endhour = now.add(12,'h');
    let endminute = '00';

    if(today.getDay()==6||today.getDay()==0){
      dayForm = 'weekend';
    } else {
      dayForm = 'weekday';
    }
    if(accessory.context.ringlock.start&&accessory.context.ringlock.end){
      let s = accessory.context.ringlock.start.split(':');
      let e = accessory.context.ringlock.end.split(':');
      hour = s[0];
      minute = s[1];
      endhour = e[0];
      endminute = e[1];
    } else {
      if(hour<10&&hour>=0){
        hour = '0'+hour;
      }
      if(minute<10&&minute>=0){
        minute = '0'+minute;
      }
      if(endhour<10&&endhour>=0){
        endhour = '0'+endhour;
      }
    }

    if(!device.config.host.match('myfritz')){
      for(let count=1;count<=accessory.context.ringlock.DECTphones;count++){
        if(accessory.context.newSid){
          let sid = accessory.context.newSid;
          if(state){
            formData = querystring.stringify({
              idx: count.toString(),
              xhr: '1',
              nightsetting: '1',
              lockmode: '1',
              lockday: dayForm,
              starthh: hour.toString(),
              startmm: minute.toString(),
              endhh: endhour.toString(),
              endmm: endminute.toString(),
              event: 'on',
              popup_url:'',
              apply: '',
              sid: sid,
              page:'edit_dect_ring_block'
            });
          } else {
            formData = querystring.stringify({
              idx: count.toString(),
              xhr: '1',
              popup_url:'',
              apply: '',
              sid: sid,
              page:'edit_dect_ring_block'
            });
          }
          request.post('http://' + device.config.host + '/data.lua?sid='+sid,{form:formData}, function(error, response, body){
            if (!error && (response.statusCode == 200 || response.statusCode == 303)){
              state ? self.logger.info(accessory.displayName + ': Turn on Ring Lock for Phone ' + count) : self.logger.info(accessory.displayName + ': Turn off Ring Lock for Phone ' + count); 
              accessory.context.lastRingLock = state;
            } else {
              self.logger.errorinfo(accessory.displayName + ':An error occured while setting Ring Lock for Phone ' + count);
              let showError = {
                error: error?error.errno:response.statusMessage,
                errorCode: error?error.code:response.statusCode
              };
              self.logger.errorinfo(JSON.stringify(showError,null,4));
            }
            if(count==accessory.context.ringlock.DECTphones){
              setTimeout(function(){service.getCharacteristic(Characteristic.RingLock).updateValue(accessory.context.lastRingLock);}, 500);
              callback(null, accessory.context.lastRingLock);
            }
          });
        } else {
          self.logger.debug(accessory.displayName + ': setRingLock: Wrong SID');
          if(count==accessory.context.ringlock.DECTphones){
            setTimeout(function(){service.getCharacteristic(Characteristic.RingLock).updateValue(accessory.context.lastRingLock);}, 500);
            callback(null, accessory.context.lastRingLock);
          }
        }
      }
    } else {
      self.logger.warninfo(accessory.displayName + ': Can not set Device Lock in remote mode!');
      setTimeout(function(){service.getCharacteristic(Characteristic.RingLock).updateValue(accessory.context.lastRingLock);}, 500);
      callback(null, accessory.context.lastRingLock);
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // LUA
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  parseOutput(accessory, data, type, callback){
    let $ = cheerio.load(data);
    let elements = $('input').toArray();
    for(const i in elements){
      if(elements[i].attribs.name==type){
        if(elements[i].attribs.name=='led_display'){
          if(elements[i].attribs.checked=='checked')callback(null,elements[i].attribs.value);
        } else {
          elements[i].attribs.checked=='checked'?callback(null,elements[i].attribs.value):callback(null,0);
        }
      }
    }
  }

}

module.exports = Fritz_Box;
