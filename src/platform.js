'use strict';

const api = require('../lib/TR064.js');
const packageFile = require('../package.json');
const LogUtil = require('../lib/LogUtil.js');

//const axios = require('axios');
const tcpp = require('tcp-ping');
const debug = require('debug')('FritzPlatform');
const store = require('json-fs-store');

//Avoke handler
const Callmonitor = require('../lib/CallmonitorHandler.js');
const Telegram = require('../lib/TelegramHandler.js');
const Hosts = require('../lib/HostsHandler.js');
const Smarthome = require('../lib/SmarthomeHandler.js');
const SID = require('../lib/SidHandler.js');

//Accessories
const PresenceAccessory = require('./accessories/presence.js');
const DeviceAccessory = require('./accessories/device.js');
const WolAccessory = require('./accessories/wol.js');
const CallmonitorAccessory = require('./accessories/callmonitor.js');
const SmarthomeAccessory = require('./accessories/smarthome.js');

const pluginName = 'homebridge-fritz-platform';
const platformName = 'FritzPlatform';

var Accessory, Service, Characteristic, UUIDGen;

const timeout = ms => new Promise(res => setTimeout(res, ms));

module.exports = function (homebridge) {

  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;
  
  return FritzPlatform;
};

function FritzPlatform (log, config, api) {
  
  if (!api||!config) return;

  // BASE
  this.log = log;
  this.logger = new LogUtil(null, log);
  this.debug = debug;
  this.accessories = [];
  this._accessories = new Map();
  this.config = config;
  
  this.configPath = api.user.storagePath();
  this.HBpath = api.user.storagePath()+'/accessories';
  
  this.validMAC = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
  this.validIP = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  if (api) {
  
    if (api.version < 2.2) {
    
      throw new Error('Unexpected API version. Please update your homebridge!');
    
    }
  
    this.logger.info('**************************************************************');
    this.logger.info('FritzPlatform v'+packageFile.version+' by SeydX');
    this.logger.info('GitHub: https://github.com/SeydX/'+pluginName);
    this.logger.info('Email: seyd55@outlook.de');
    this.logger.info('**************************************************************');
    this.logger.info('start success...');
    
    this.api = api;
    
    this.api.on('didFinishLaunching', this._checkConfig.bind(this));
  
  }
}

FritzPlatform.prototype = {

  _checkConfig: async function(){

    try {
      
      if(this.config.clearCache && !this.accessories.length){
      
        return;
      
      } else if(this.config.clearCache && this.accessories.length){
        
        return this._initPlatform();
        
      }

      this.config.polling = this.config.polling||10;
      this.config.timeout = this.config.timeout||10;
      this.config.clearCache = this.config.clearCache||false;
      
      this.config.devices = this.config.devices||{};
      this.config.smarthome = this.config.smarthome||{};
      this.config.callmonitor = this.config.callmonitor||{};
      this.config.presence = this.config.presence||{};
      this.config.wol = this.config.wol||[];
      this.config.alarm = this.config.alarm||{};
      this.config.wakeup = this.config.wakeup||{};
      this.config.ringlock = this.config.ringlock||{};
      this.config.broadband = this.config.broadband||{};
      this.config.extReboot = this.config.extReboot||{};
      this.config.telegram = this.config.telegram||{};
      
      if(!Object.keys(this.config.smarthome).length){
      
        this.config.smarthome['Test Contact Sensor'] = {
          active: false,
          ain: '01234567890',
          devType: 'contact'
        };
        
        this.config.smarthome['Test Thermostat Device'] = {
          active: false,
          ain: '01234567890',
          devType: 'thermostat',
          heatValue: 5,
          coolValue: 5,
          windowSensor: false
        };
        
        this.config.smarthome['Test Outlet Device'] = {
          active: false,
          ain: '01234567890',
          devType: 'switch',
          tempSensor: false
        };
      
      }
      
      this.config.callmonitor = {
        active: this.config.callmonitor.active||false,
        ip: this.config.callmonitor.ip||'0.0.0.0',
        port: this.config.callmonitor.port||1012,
        country: this.config.callmonitor.country||'',
        incomingTo: this.config.callmonitor.incomingTo||'',
        outgoingFrom: this.config.callmonitor.outgoingFrom||[],
      };
      
      this.config.presence = {
        user: this.config.presence.user||[],
        anyone: this.config.presence.anyone||false,
        offDelay: this.config.presence.offDelay||90,
        onDelay: this.config.presence.onDelay||15
      };
      
      if(!this.config.presence.user.length)
        this.config.presence.user.push({
          active: false,
          name: 'Test User',
          address: '0.0.0.0'
        });
        
      if(!this.config.wol.length)
        this.config.wol.push({
          active: false,
          name: 'Test Device',
          address: '00:00:00:00:00:00'
        });
      
      this.config.alarm = {
        active: this.config.alarm.active||false,
        telNr: this.config.alarm.telNr||'',
        duration: this.config.alarm.duration||30
      };
      
      this.config.wakeup = {
        active: this.config.wakeup.active||false,
        internNr: this.config.wakeup.internNr||'',
        duration: this.config.wakeup.duration||30
      };
      
      this.config.ringlock = {
        active: this.config.ringlock.active||false,
        DECTphones: this.config.ringlock.DECTphones||1,
        start: this.config.ringlock.start||'11:00',
        end: this.config.ringlock.end||'22:00'
      };
      
      this.config.broadband = {
        active: this.config.broadband.active||false,
        measureTime: this.config.broadband.measureTime||5,
        polling: this.config.broadband.polling||30
      };
      
      this.config.extReboot = {
        active: this.config.extReboot.active||false,
        cmdOn: this.config.extReboot.cmdOn||'',
        cmdOff: this.config.extReboot.cmdOff||''
      };
      
      this.config.telegram = {
        active: this.config.telegram.active||false,
        token: this.config.telegram.token||'',
        chatID: this.config.telegram.chatID||'',
        presence: this.config.telegram.presence||{},
        callmonitor: this.config.telegram.callmonitor||{},
        alarm: this.config.telegram.alarm||{},
        extReboot: this.config.telegram.extReboot||{},
      };
      
      this.config.telegram.presence = {
        in: this.config.telegram.presence.in||'',
        out: this.config.telegram.presence.out||'',
        anyoneIn: this.config.telegram.presence.anyoneIn||'',
        anyoneOut: this.config.telegram.presence.anyoneOut||'',
      };
      
      this.config.telegram.callmonitor = {
        incoming: this.config.telegram.callmonitor.incoming||'',
        disconnected: this.config.telegram.callmonitor.disconnected||''
      };
      
      this.config.telegram.alarm = {
        activated: this.config.telegram.alarm.activated||'',
        deactivated: this.config.telegram.alarm.deactivated||''
      };
      
      this.config.telegram.extReboot = {
        start: this.config.telegram.extReboot.start||'',
        finish: this.config.telegram.extReboot.finish||''
      };
      
      if(this.config.telegram.active && this.config.telegram.token && this.config.telegram.chatID)
        this.telegram = new Telegram(this, this.config.telegram);
      
      this.logger.info('Looking for devices..');
      
      let tr064 = new api.TR064();
      let deviceArray = await tr064.searchDevices();
      
      this.deviceArray = [];
      this.masterDevice = [];
      
      for(let dev of deviceArray){
            
        this.config.devices[dev.name] = this.config.devices[dev.name]||{};
            
        this.config.devices[dev.name] = {
          active: this.config.devices[dev.name].active||false,
          host: this.config.devices[dev.name].host||dev.address,
          port: this.config.devices[dev.name].port||parseInt(dev.port),
          username: this.config.devices[dev.name].username||'',
          password: this.config.devices[dev.name].password||'',
          type: this.config.devices[dev.name].type||'',
          master: this.config.devices[dev.name].master||false,
          mesh: this.config.devices[dev.name].mesh||false,
          readOnly: this.config.devices[dev.name].readOnly||false,
          beta: this.config.devices[dev.name].beta||false,
          options: this.config.devices[dev.name].options||'Please set up \'type\' (\'dsl\'|\'cable\'|\'repeater\') and \'master\' (true|false) and restart homebridge to complete the config process!',
        };
        
        if(this.config.devices[dev.name].type && this.config.devices[dev.name].master === false)
          this.config.devices[dev.name].options = {
            wifi2: this.config.devices[dev.name].options.wifi2||false,
            wifi5: this.config.devices[dev.name].options.wifi5||false,
            wifiGuest: this.config.devices[dev.name].options.wifiGuest||false,
            wps: this.config.devices[dev.name].options.wps||false,
            led: this.config.devices[dev.name].options.led||false,
          };
        
        if(this.config.devices[dev.name].master === true && (this.config.devices[dev.name].type === 'dsl' || this.config.devices[dev.name].type === 'cable'))
          this.config.devices[dev.name].options = {
            wifi2: this.config.devices[dev.name].options.wifi2||false,
            wifi5: this.config.devices[dev.name].options.wifi5||false,
            wifiGuest: this.config.devices[dev.name].options.wifiGuest||false,
            phoneBook: this.config.devices[dev.name].options.phoneBook||false,
            wps: this.config.devices[dev.name].options.wps||false,
            aw: this.config.devices[dev.name].options.aw||false,
            deflection: this.config.devices[dev.name].options.deflection||false,
            led: this.config.devices[dev.name].options.led||false,
            lock: this.config.devices[dev.name].options.lock||false,
          };
        
        dev = { name: dev.name, serial: dev.serial, ...this.config.devices[dev.name] };
          
        if(dev.active && dev.type && dev.username && dev.password)
          this.deviceArray.push(dev);
          
        if((dev.type === 'dsl' || dev.type === 'cable') && dev.username && dev.password && dev.master)
          this.masterDevice.push(dev);
            
      }
      
      for(let smdevice of Object.keys(this.config.smarthome))

        if(this.config.smarthome[smdevice].ain !== '0123456789' && (this.config.smarthome[smdevice].devType === 'contact' || this.config.smarthome[smdevice].devType === 'thermostat' || this.config.smarthome[smdevice].devType === 'switch')){
          
          if(this.config.smarthome[smdevice].devType === 'contact'){
            
            this.config.smarthome[smdevice] = {
              active: this.config.smarthome[smdevice].active || false,
              ain: this.config.smarthome[smdevice].ain,
              devType: 'contact'
            };
        
          }
          
          if(this.config.smarthome[smdevice].devType === 'thermostat'){
          
            this.config.smarthome[smdevice] = {
              active: this.config.smarthome[smdevice].active || false,
              ain: this.config.smarthome[smdevice].ain,
              heatValue: this.config.smarthome[smdevice].heatValue || 5,
              coolValue: this.config.smarthome[smdevice].coolValue || 5,
              windowSensor: this.config.smarthome[smdevice].windowSensor || false,
              devType: 'thermostat' 
            };
         
          }
            
          if(this.config.smarthome[smdevice].devType === 'switch'){
         
            this.config.smarthome[smdevice] = {
              active: this.config.smarthome[smdevice].active || false,
              ain: this.config.smarthome[smdevice].ain,
              tempSensor: this.config.smarthome[smdevice].tempSensor || false,
              devType: 'switch'
            };
         
          }
          
          let device = {           
            name: smdevice, 
            serial: 'SH-' + this.config.smarthome[smdevice].ain,
            type: 'smarthome', 
            ...this.config.smarthome[smdevice]        
          };

          if(device.active){
          
            this.smarthome = true;
            
            this.deviceArray.push(device);   
         
          }
          
          if(device.tempSensor){
         
            this.smarthome = true;
            
            let tempDevice = {
              name: device.name + ' Temperature',
              devType: 'temperature',
              serial: device.serial + ' -T',
              ain: device.ain,
              type: 'smarthome'
            };
            
            this.deviceArray.push(tempDevice);
        
          }
          
          if(device.windowSensor){
            
            this.smarthome = true;
            
            let windowDevice = {
              name: device.name + ' Window',
              devType: 'window',
              serial: device.serial + ' -W',
              ain: device.ain,
              type: 'smarthome'
            };

            this.deviceArray.push(windowDevice);
         
          }
       
        }
      
      if(this.config.callmonitor.active && this.validIP.test(this.config.callmonitor.ip)){
      
        this.cm = new Callmonitor(this, this.config.callmonitor);
        
        this.deviceArray.push({
          name: 'Callmonitor Incoming',
          ip: this.config.callmonitor.ip,
          port: this.config.callmonitor.port,
          country: this.config.callmonitor.country,
          incomingTo: this.config.callmonitor.incomingTo,
          outgoingFrom: this.config.callmonitor.outgoingFrom,
          serial: 'CI-1234567890',
          type: 'callmonitor'
        });
        
        this.deviceArray.push({
          name: 'Callmonitor Outgoing',
          ip: this.config.callmonitor.ip,
          port: this.config.callmonitor.port,
          country: this.config.callmonitor.country,
          incomingTo: this.config.callmonitor.incomingTo,
          outgoingFrom: this.config.callmonitor.outgoingFrom,
          serial: 'CO-1234567890',
          type: 'callmonitor'
        });
       
      }
      
      if(this.config.presence.user.length)
        for(const user of this.config.presence.user)
          if(user.active && user.address !== '0.0.0.0' && (this.validIP.test(user.address)||this.validMAC.test(user.address))){
            this.hosts = true;
            this.deviceArray.push({
              name: user.name,
              address: user.address,
              serial: 'P-' + user.address.replace(/:|./g,''),
              type: 'presence'
            });
          }

      if(this.config.presence.anyone)
        this.deviceArray.push({
          name: 'Anyone',
          serial: 'P-1234567890',
          type: 'presence'
        }); 
      
      if(this.config.wol.length)
        for(const wol of this.config.wol)
          if(wol.active && wol.address !== '00:00:00:00:00:00' && this.validMAC.test(wol.address))
            this.deviceArray.push({
              name: wol.name,
              address: wol.address,
              serial: 'W-' + wol.address.replace(/:/g,''),
              type: 'wol'
            }); 
  
      let config = {
        devices: this.config.devices,
        smarthome: this.config.smarthome,
        callmonitor: this.config.callmonitor,
        presence: this.config.presence,
        wol: this.config.wol,
        alarm: this.config.alarm,
        wakeup: this.config.wakeup,
        ringlock: this.config.ringlock,
        broadband: this.config.broadband,
        extReboot: this.config.extReboot,
        telegram: this.config.telegram,
        polling: this.config.polling,
        timeout: this.config.timeout,
        clearCache: this.config.clearCache,
      };
      
      let newConfig = await this._refreshConfig(config);      
      debug(JSON.stringify(newConfig,null,4));
      
      this._initPlatform();

    } catch(err) {

      this.logger.error('An error occured while checking config! Trying again..');
      debug(err);
      
      setTimeout(this._checkConfig.bind(this),5000);

    }

  },
  
  _refreshConfig: function(object){
  
    return new Promise((resolve, reject) => {
  
      debug('Writing new parameter into config.json...');
        
      store(this.configPath).load('config', (err,obj) => {    
          
        if(obj){
                  
          if(!(obj.id === 'config')) { 
            
            this.firstLaunch = true;
            this.logger.initinfo('Init first launch');
            
          }
            
          debug('Config.json loaded!');
      
          obj.id = 'config';
        
          for(const i in obj.platforms){
              
            if(obj.platforms[i].platform === 'FritzPlatform'){
              
              for(const j in object){
                  
                obj.platforms[i][j] = object[j];
                    
              }
                
            }
            
          }
        
          store(this.configPath).add(obj, (err) => {
              
            if(err)reject(err);
              
            if(this.firstLaunch){
              this.logger.initinfo('Config.json refreshed');
            }
              
            debug('Config.json refreshed!');
              
            resolve(obj.platforms[0]);
            
          });
        
        } else {
         
          reject(err);
         
        }
        
      });

    });
  
  },
  
  _initPlatform: async function(){

    this._devices = new Map();
    
    try {
  
      if(this.config.clearCache && this.accessories.length){
  
        this.logger.warn('\'clearCache\' is active! All accessories will be removed from HomeKit and cache!');
        this.accessories.map( accessory => this.removeAccessory(accessory));
    
      } else if(this.deviceArray.length){
    
        if(this.masterDevice && this.masterDevice.length === 1){
        
          this.logger.info('Checking master device and init handler...');
          
          let masterConfig = {
            host: this.masterDevice[0].host,
            port: this.masterDevice[0].port,
            username: this.masterDevice[0].username,
            password: this.masterDevice[0].password,
            type: this.masterDevice[0].type,
            mesh: this.masterDevice[0].mesh,
            timeout: this.config.timeout * 1000
          };
        
          let master = await this.checkMasterConfig(masterConfig);
        
          if(master){
            
            debug('Init SID handler');
            this.sid = new SID(this, this.device);
            
            await timeout(1000);
            
            if(this.hosts && masterConfig.mesh){
            
              debug('Init host list');
              this.hosts = new Hosts(this, masterConfig, this.device);
              
              await timeout(1000);
              
            }
            
            if(this.smarthome){
            
              debug('Init smarthome list');
              this.smarthome = new Smarthome(this, masterConfig, this.device, this.sid);
              
              await timeout(1000);
  
            }
            
            this.logger.info('Master device successfully confirmed');
            
            this.masterConfig = masterConfig;
            
          } else {
          
            this.logger.warn('Can not confirm master device!');
            this.logger.warn('Please set correct device as master device!');
            this.masterConfig = false;
          
          }
          
        } else if(this.masterDevice.length > 1){
        
          this.logger.error('More than one master devices defined!');
          this.logger.error('Please set only ONE master device!');
        
        } else {
        
          this.logger.warn('No master devices configured!');
          this.logger.warn('You need ONE \'master\' device with correct \'type\' (dsl|cable) and \'credentials\' (username, password) setted up in your config.json!'); 
        
        }
    
        if(this.masterConfig){
      
          debug('Initializing following devices from config.json:');
          
          for(const dev of this.deviceArray){
            debug(dev.name);
            this._devices.set(dev.name, dev);
          }

          debug('Device initialization finished');
          
          for(const confDev of this.deviceArray)
            this._addOrRemoveDevice(confDev);
         
        }
      
      } else {
    
        this.logger.info('Please check your config.json and activate the device(s) you want to see in HomeKit.');
        this.logger.info('Please also set up username, password, type and master for your \'device(s)\' and restart homebridge!');
    
        if(this.accessories.length){
        
          this.logger.warn('Removing all devices from HomeKit and cache!');
          this.accessories.map( accessory => this.removeAccessory(accessory));
    
        }
          
      }
      
    } catch(err) {
    
      this.logger.error('An error occured while fetching devices!');
      debug(err);
    
    }
    
  },
  
  _addOrRemoveDevice: function(object) {

    const device = this._accessories.get(object.name);

    if(!device){

      this._accessories.set(object.name, object);
      this.addAccessory(object);

    }

    this.accessories.map( accessory => {

      if(!this._devices.has(accessory.displayName)){

        this._accessories.delete(accessory.displayName);
        this.removeAccessory(accessory);

      }

    });

  },
  
  _addOrConfigure: function(accessory, object, add){

    this._refreshContext(accessory, object, add);    
    this._addOrConfAccessoryInformation(accessory);

    switch(accessory.context.type){

      case 'dsl':
      case 'cable':
      case 'repeater':

        if(add)
          accessory.addService(Service.Switch, object.name);
        
        //new DeviceAccessory(this, accessory);

        break;
        
      case 'callmonitor':

        if(add)
          accessory.addService(Service.ContactSensor, object.name);
        
        new CallmonitorAccessory(this, accessory);

        break;
        
      case 'smarthome':

        if(add){
    
          if(accessory.context.devType === 'contact' || accessory.context.devType === 'window'){
    
            accessory.addService(Service.ContactSensor, object.name);
      
          } else if(accessory.context.devType === 'thermostat'){
    
            accessory.addService(Service.Thermostat, object.name);
            accessory.addService(Service.BatteryService, object.name);
      
          } else if(accessory.context.devType === 'switch'){
    
            accessory.addService(Service.Outlet, object.name);
      
          } else {
          
            accessory.addService(Service.TemperatureSensor, object.name);
          
          }
    
        }
        
        new SmarthomeAccessory(this, accessory, this.device, this.smarthome);

        break;
        
      case 'presence':

        if(add)
          accessory.addService(Service.OccupancySensor, object.name);
        
        new PresenceAccessory(this, accessory, this.hosts);

        break;
        
      case 'wol':

        if(add)
          accessory.addService(Service.Switch, object.name);
        
        new WolAccessory(this, accessory, this.device);

        break;
        
      default:
        //

    }

  },
  
  _refreshContext: function(accessory, object, add){

    accessory.reachable = true;
    
    accessory.context.polling = this.config.polling * 1000;
    accessory.context.timeout = this.config.timeout * 1000;

    if(add){
      accessory.context.serial = object.serial;
      accessory.context.type = object.type;    
    }
    
    switch(accessory.context.type){
    
      case 'dsl':
      case 'cable':
      case 'repeater':
    
        if(this.config.devices[accessory.displayName])
          accessory.context = {
            ...accessory.context,
            ...this.config.devices[accessory.displayName],
            masterConfig: this.masterConfig
          };
  
        break; 
    
      case 'presence':
  
        for(const user of this.config.presence.user)
          if(user.name === accessory.displayName)
            accessory.context = {
              ...accessory.context,
              ...user,
              masterConfig: this.masterConfig,
              offDelay: this.config.presence.offDelay * 1000,
              ondelay: this.config.presence.onDelay * 1000
            };
  
        break; 
    
      case 'wol':
  
        for(const wol of this.config.wol)
          if(wol.name === accessory.displayName)
            accessory.context = {
              ...accessory.context,
              ...wol,
              masterConfig: this.masterConfig
            };
  
        break; 
    
      case 'callmonitor':
      
        accessory.context = {
          ...accessory.context,
          ...this.config.callmonitor,
          masterConfig: this.masterConfig
        };
  
        break; 
    
      case 'smarthome':
  
        if(this.config.smarthome[accessory.displayName])
          accessory.context = {
            ...accessory.context,
            ...this.config.smarthome[accessory.displayName],
            masterConfig: this.masterConfig
          };
          
        if(this.config.smarthome[accessory.displayName] + ' Window')
          accessory.context = {
            ...accessory.context,
            masterConfig: this.masterConfig,
            devType: object ? object.devType : accessory.context.devType,
            ain: object ? object.ain : accessory.context.ain 
          };
          
        if(this.config.smarthome[accessory.displayName] + ' Temperature')
          accessory.context = {
            ...accessory.context,
            masterConfig: this.masterConfig,
            devType: object ? object.devType : accessory.context.devType,
            ain: object ? object.ain : accessory.context.ain 
          };
  
        break; 
    
      default:
        //
    
    }

    
  },
  
  _addOrConfAccessoryInformation(accessory){
  
    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, accessory.displayName)
      .setCharacteristic(Characteristic.Identify, accessory.displayName)
      .setCharacteristic(Characteristic.Manufacturer, 'SeydX')
      .setCharacteristic(Characteristic.Model, accessory.context.type)
      .setCharacteristic(Characteristic.SerialNumber, accessory.context.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);
      
    accessory.on('identify', (paired, callback) => {
      this.logger.info(accessory.displayName + ': Hi!');
      callback();
    });
  
  },

  addAccessory: function(object){

    this.logger.info('Adding new accessory: ' + object.name);

    let uuid = UUIDGen.generate(object.name);
    let accessory = new Accessory(object.name, uuid);

    accessory.context = {};

    this._addOrConfigure(accessory, object, true);

    this.accessories.push(accessory);
    
    if(object.type === 'wol' || object.type === 'presence' || object.type === 'callmonitor' || object.type === 'smarthome')
      this.api.registerPlatformAccessories(pluginName, platformName, [accessory]);

  },

  configureAccessory: function(accessory){

    this._accessories.set(accessory.displayName, accessory);
    
    if(!this.accessories.includes(accessory))
      this.accessories.push(accessory);

    if(this.masterConfig) {

      if(this._devices.get(accessory.displayName)){
        
        this.logger.info('Configuring accessory from cache: ' + accessory.displayName);
        
        this._addOrConfigure(accessory, null, false);
      
      }

    } else {
      
      if(this.masterConfig === undefined)
        setTimeout(this.configureAccessory.bind(this,accessory),1000);

    }

  },

  removeAccessory: function (accessory) {
  
    if (accessory) {

      this.logger.warninfo('Removing accessory: ' + accessory.displayName + '. No longer configured.');

      for(const i in this.accessories){
        if(this.accessories[i].displayName === accessory.displayName){
          this.accessories[i].context.remove = true;
        }
      }

      let newAccessories = this.accessories.map( acc => {
        if(acc.displayName !== accessory.displayName){
          return acc;
        }
      });

      let filteredAccessories = newAccessories.filter(function (el) {
        return el != null;
      });

      this.api.unregisterPlatformAccessories(pluginName, platformName, [accessory]); 

      this.accessories = filteredAccessories;

    }
  
  },
  
  checkMasterConfig: async function(masterConfig){
  
    try{
    
      this.TR064 = new api.TR064(masterConfig, this.logger);
      
      let TR064 = await this.TR064.initDevice();
      this.device = await TR064.startEncryptedCommunication();
    
      let info = this.device.services['urn:dslforum-org:service:WANCommonInterfaceConfig:1']; 
      
      if(info){
      
        info = await info.actions.GetCommonLinkProperties();
        
        if(info.NewWANAccessType && info.NewWANAccessType !== 'Ethernet'){
        
          return true;
        
        } else {
        
          return false;
        
        }
        
      } else {
      
        return false;
      
      }
    
    } catch(err){
    
      throw err;
    
    }
  
  },
  
  tcp: function(name, host, port){

    debug(name + ': Ping ' + host + ':' + port);
    
    return new Promise((resolve, reject) => {
    
      tcpp.probe(host, port, (err, available) => {
      
        if(err) return reject(err);
      
        if(available){
      
          debug(name + ': Pong ' + host + ':' + port + ' --> SUCCESFULL');
          resolve(true);
      
        } else {
      
          resolve(false);
      
        }
    
      });
   
    });
  
  }

};
