'use strict';

const api = require('../lib/TR064.js');
const packageFile = require('../package.json');
const LogUtil = require('../lib/LogUtil.js');

const tcpp = require('tcp-ping');
const debug = require('debug')('FritzPlatform');
const store = require('json-fs-store');

//Handler
const Hosts = require('../handler/HostsHandler.js');
const Smarthome = require('../handler/SmarthomeHandler.js');
const SID = require('../handler/SidHandler.js');
const Config = require('../handler/ConfigHandler.js');

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
  
  this.Config = new Config(this, config);
  
  this.configPath = api.user.storagePath();
  this.HBpath = api.user.storagePath()+'/accessories';
  
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
    
      this.logger.info('Looking for devices...');
      
      let tr064 = new api.TR064();
      let foundDevices = await tr064.searchDevices();
      
      this.logger.info('Initializing config...');
      this.config = await this.Config.generateConfig(foundDevices);
      
      if(!this.config && this.accessories.length)
        return this._initPlatform();
        
      if(!this.config && !this.accessories.length)
        return 'Nothing to do..';

      this.deviceArray = await this.Config.getDevices();
      
      this.masterDevice = await this.Config.getMasterDevice();
      
      debug('Initializing extras...');
      this.extras = await this.Config.getExtras();
      
      debug('Initializing telegram...');
      this.telegram = await this.Config.initTelegram();
      
      debug('Initializing callmonitor...');
      this.cm = await this.Config.initCallmonitor();

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
      
      debug('Generating config...');
      
      let newConfig = await this._refreshConfig(config);      
      debug(JSON.stringify(newConfig,null,4));
      
      if(this.firstLaunch){
      
        this.logger.info('First launch completed!');
        this.logger.info('Please open your config.json and set up your credentials for the devices and restart homebridge to complete the auto config generator!');
      
        return;
     
      }
      
      this.logger.info('Found ' + this.deviceArray.length + ' active devices...');
      
      if(!this.deviceArray.length){
      
        this.logger.info('Please check your config.json and activate the device(s) you want to see in HomeKit.');
        this.logger.info('Please also set up username, password, type and master for your \'device(s)\' and restart homebridge!');
    
        if(this.accessories.length){
        
          this.logger.warn('Removing all devices from HomeKit and cache!');
          this.accessories.map( accessory => this.removeAccessory(accessory));
    
        }
        
        return;
      
      }
      
      if(!this.masterDevice.length){
      
        return this.logger.info('No master device defined!');
          
      } else if(this.masterDevice.length > 1) {
        
        return this.logger.error('Please define only ONE master device!');
      
      } else {
      
        debug('Checking master device...');
          
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
        
          debug('Master device successfully confirmed');
         
          debug('Initializing SID handler');
          this.sid = new SID(this);
           
          if(this.Config.getHosts() && masterConfig.mesh){
            
            debug('Initializing host list');
            this.hosts = new Hosts(this, masterConfig, this.device);
              
            await timeout(1000);
             
          }
            
          if(this.Config.getSmartHome()){
            
            debug('Initializing smarthome list');
            this.smarthome = new Smarthome(this, masterConfig, this.device, this.sid);
              
            await timeout(1000);
  
          }
          
          this.masterConfig = masterConfig;
          
        } else {
        
          return this.logger.error('Can not confirm master device!');
        
        }
      
      }
      
      this._initPlatform();

    } catch(err) {

      this.logger.error('An error occured while checking config!');
      debug(err);

    }

  },
  
  _refreshConfig: function(object){
  
    return new Promise((resolve, reject) => {
  
      store(this.configPath).load('config', (err,obj) => {    
          
        if(obj){
                  
          if(!(obj.id === 'config')) { 
            
            this.firstLaunch = true;
            this.logger.info('Initializing first launch');
            
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
          
          debug('Writing new parameter into config.json...');
        
          store(this.configPath).add(obj, (err) => {
              
            if(err)reject(err);
              
            if(this.firstLaunch){
              this.logger.info('Config.json refreshed');
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
  
      if(!this.config){
  
        this.logger.warn('\'clearCache\' is active! All accessories will be removed from HomeKit and cache!');
        this.accessories.map( accessory => this.removeAccessory(accessory));
    
      } else {
      
        debug('Initializing following devices from config.json:');
         
        for(const dev of this.deviceArray){
          debug(dev.name);
          this._devices.set(dev.name, dev);
        }

        debug('Device initialization finished');
          
        for(const confDev of this.deviceArray)
          this._addOrRemoveDevice(confDev);
      
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
        
        new DeviceAccessory(this, accessory, accessory.context.master ? this.device : false, this.sid);

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
    
        if(this.config.devices[accessory.displayName]){
      
          accessory.context = {
            ...accessory.context,
            ...this.config.devices[accessory.displayName],
            masterConfig: this.masterConfig
          };
          
          if(accessory.context.master)
            accessory.context.extras = this.extras;
          
        }
  
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

      this.logger.warn('Removing accessory: ' + accessory.displayName + '. No longer configured.');

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
