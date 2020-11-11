'use strict';

const Logger = require('./helper/logger.js');
const packageFile = require('../package.json');

const { Fritzbox } = require('@seydx/fritzbox');
const fs = require('fs-extra');

const Telegram = require('./helper/telegram');
const Callmonitor = require('./helper/callmonitor');
const DeviceHandler = require('./helper/deviceHandler.js');

//Accessories
const RouterAccessory = require('./accessories/router/router.js');
const WolAccessory = require('./accessories/wol/wol.js');
const CallmonitorAccessory = require('./accessories/callmonitor/callmonitor.js');
const ExtrasAccessory = require('./accessories/extras/extras.js');
const WatchNetwork = require('./accessories/network/network.js');

const PresenceMotionAccessory = require('./accessories/presence/motion.js');
const PresenceOccupancyAccessory = require('./accessories/presence/occupancy.js');

const SmarthomeSwitchAccessory = require('./accessories/smarthome/switch.js');
const SmarthomeOutletAccessory = require('./accessories/smarthome/outlet.js');
const SmarthomeLightbulbAccessory = require('./accessories/smarthome/lightbulb.js');
const SmarthomeTemperatureAccessory = require('./accessories/smarthome/temperature.js');
const SmarthomeThermostatAccessory = require('./accessories/smarthome/thermostat.js');
const SmarthomeContactAccessory = require('./accessories/smarthome/contact.js');
const SmarthomeWindowAccessory = require('./accessories/smarthome/window.js');

//Custom Types
const RouterTypes = require('./types/custom_types.js');
const EveTypes = require('./types/eve_types.js');

const PLUGIN_NAME = 'homebridge-fritz-platform';
const PLATFORM_NAME = 'FritzPlatform';

var Accessory, UUIDGen, FakeGatoHistoryService;

module.exports = function (homebridge) {

  Accessory = homebridge.platformAccessory;
  UUIDGen = homebridge.hap.uuid;
  
  return FritzPlatform;
};

function FritzPlatform (log, config, api) {
  
  if (!api||!config) 
    return;

  Logger.init(log, config.debug);
  
  RouterTypes.registerWith(api.hap);
  EveTypes.registerWith(api.hap);
  FakeGatoHistoryService = require('fakegato-history')(api);

  this.api = api;
  this.log = log;
  this.accessories = [];
  this.config = config;
  
  this.devices = new Map();
  this.network = new Map(); 
  this.presence = new Map();
  this.smarthome = new Map();
  
  this.masterDevice = false;
  this.presenceOptions = false;
  
  this.validIP = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  this.validMAC = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
    
  if(this.config.devices) {
  
    this.master = [];
    
    this.config.devices.map(device => {
      if(device.master && device.host && device.username && device.password){
        this.masterDevice = device;
        this.masterDevice.fritzbox = new Fritzbox({ username: device.username, password: device.password, url: 'http://' + device.host + ':' + (device.port||49000), tr064: device.tr064, igd: device.igd, autoSsl: device.ssl });
        this.master.push(device);
      }
    });
    
    if(!this.masterDevice){
      Logger.warn('WARNING: There is no master router defined!');
      Logger.warn('WARNING: Please define ONE master router to proceed!');
      return;
    }
    
    if(this.master.length > 1){
      Logger.warn('WARNING: More than ONE router are configured as master router!');
      Logger.warn('WARNING: Please define only ONE master router to proceed!');
      return;
    }    
  
    this.config.devices.forEach(router => {
    
      let error = false;
      
      let validTypes = ['dsl', 'cable', 'repeater'];

      if (!router.name) {
        Logger.warn('One of the router has no name configured. This router will be skipped.');
        error = true;
      } else if (!router.host) {
        Logger.warn('There is no host configured for this router. This router will be skipped.', router.name);
        error = true;
      } else if (!router.username) {
        Logger.warn('There is no username configured for this router. This router will be skipped.', router.name);
        error = true;
      } else if (!router.password) {
        Logger.warn('There is no password configured for this router. This router will be skipped.', router.name);
        error = true;
      } else if(!router.connection || !validTypes.includes(router.connection)) {
        Logger.warn('There is no or no valid connection type configured for this router. Setting it to default: "dsl"', router.name);
        router.connection = 'dsl';
      }

      if (!error) {
        router.type = 'router';
        router.subtype = router.connection;
        const uuid = UUIDGen.generate(router.name);
        if (this.devices.has(uuid)) {
          Logger.warn('Multiple devices are configured with this name. Duplicate router will be skipped.', router.name);
        } else {
          
          let options = {
            host: router.host,
            port: router.port || 49000,
            username: router.username,
            password: router.password,
            tr064: router.tr064,
            igd: router.igd,
            ssl: router.ssl
          };
          
          router.fritzbox = new Fritzbox({ 
            username: options.username,
            password: options.password, 
            url: 'http://' + options.host + ':' + options.port, 
            tr064: options.tr064, 
            igd: options.igd, 
            autoSsl: options.ssl
          });
        
          if(router.master)
            this.fritzbox = router.fritzbox;
        
          if(!router.hide)
            this.devices.set(uuid, router);
          
          if(router.options){
          
            let validChars = ['wifi_2ghz', 'wifi_5ghz', 'wifi_guest', 'wps', 'dect', 'aw', 'deflection', 'led', 'lock'];
          
            const switches = Object.keys(router.options).filter(extra => validChars.includes(extra) && router.options[extra] === 'switch');
            
            switches.forEach(name => {
            
              let subtype = name;
              name = name.includes('_') ? name.replace('_', ' ') : name;
              let accName = router.name + ' ' + (name[0].toUpperCase() + name.substring(1));
            
              let extraSwitch = {
                name: accName,
                type: 'extra',
                subtype: subtype,
                parent: router.name,
                fritzbox: router.fritzbox,
                options: false,
                oldFW: router.oldFW
              };
              const switchUUID = UUIDGen.generate(extraSwitch.name);
              if (this.devices.has(switchUUID)) {
                Logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', extraSwitch.name);
              } else {
                this.devices.set(switchUUID, extraSwitch);
              }
            }); 
          
          } 
            
        }
      }
      
    });
    
  }
    
  if(this.config.smarthome) {
  
    this.config.smarthome.forEach(device => {
    
      let error = false;
      let validTypes = ['switch', 'contact', 'thermostat', 'lightbulb', 'temperature', 'window'];

      if (!device.name) {
        Logger.warn('One of the smarthome devices has no name configured. This device will be skipped.');
        error = true;
      } else if (!device.ain) {
        Logger.warn('There is no AIN configured for this smarthome device. This device will be skipped.', device.name);
        error = true;
      } else if (!device.accType || !validTypes.includes(device.accType)) {
        Logger.warn('There is no or no valid type configured for this smarthome device. This device will be skipped.', device.name);
        error = true;
      }

      if (!error) {
        device.ain = device.ain.replace(/\s/g,'');
        device.type = 'smarthome';
        device.subtype = 'smarthome-' + device.accType;
        const uuid = UUIDGen.generate(device.name);
        if (this.devices.has(uuid)) {
          Logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', device.name);
        } else {
          this.devices.set(uuid, device);
          this.smarthome.set(uuid, device);
        }
        
        if(device.temperature){
        
          let tempDevice = {
            name: device.name + ' Temperature',
            type: 'smarthome',
            subtype: 'smarthome-temperature',
            ain: device.ain
          };

          const uuidTemp = UUIDGen.generate(tempDevice.name);
          if (this.devices.has(uuidTemp)) {
            Logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', tempDevice.name);
          } else {
            this.devices.set(uuidTemp, tempDevice);
            this.smarthome.set(uuidTemp, tempDevice);
          }
        
        }
        
        if(device.window){
        
          let windowDevice = {
            name: device.name + ' Window',
            type: 'smarthome',
            subtype: 'smarthome-window',
            ain: device.ain
          };

          const uuidWindow = UUIDGen.generate(windowDevice.name);
          if (this.devices.has(uuidWindow)) {
            Logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', windowDevice.name);
          } else {
            this.devices.set(uuidWindow, windowDevice);
            this.smarthome.set(uuidWindow, windowDevice);
          }
        
        }
        
      }
      
    });
    
  }
  
  if(this.config.presence) {
  
    this.config.presence.forEach(user => {
    
      let error = false;
      
      if (!user.name) {
        Logger.warn('One of the user has no name configured. This user will be skipped.');
        error = true;
      } else if(user.name === 'Anonym') {
        Logger.warn('One of the user is called "Anonym". Please change name of this user! This user will be skipped.');
        error = true;
      } else if (!user.address) {
        Logger.warn('There is no address configured for this user. This user will be skipped.', user.name);
        error = true;
      } else if (!this.validIP.test(user.address) && !this.validMAC.test(user.address)) {
        Logger.warn('The address for this user is not a valid IP/MAC address. This user will be skipped.', user.name);
        error = true;
      }
      
      let validTypes = ['occupancy', 'motion'];
      
      if(!validTypes.includes(user.accType)){
        Logger.warn('No or wrong accessory type setted up for this user. Setting it to "occupancy".', user.name);
        user.accType = 'occupancy';
      }

      if (!error) {
        user.type = 'presence';
        user.subtype = 'presence-' + user.accType;
        const uuid = UUIDGen.generate(user.name);
        if (this.devices.has(uuid)) {
          Logger.warn('Multiple devices are configured with this name. Duplicate user will be skipped.', user.name);
        } else {
          user.fritzbox = this.fritzbox;
          this.devices.set(uuid, user);
          this.presence.set(uuid, user);
        }
      }
      
    });
    
  }
  
  if(this.config.wol) {
  
    this.config.wol.forEach(device => {
    
      let error = false;
      
      if (!device.name) {
        Logger.warn('One of the WOL devices has no name configured. This device will be skipped.');
        error = true;
      } else if (!device.address) {
        Logger.warn('There is no address configured for this WOL device. This device will be skipped.', device.name);
        error = true;
      } else if (!this.validMAC.test(device.address)) {
        Logger.warn('The address for this WOL device is not a valid MAC address. This device will be skipped.', device.name);
        error = true;
      }

      if (!error) {
        device.type = 'wol';
        device.subtype = 'wol';
        const uuid = UUIDGen.generate(device.name);
        if (this.devices.has(uuid)) {
          Logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', device.name);
        } else {
          device.fritzbox = this.fritzbox;
          this.devices.set(uuid, device);
        }
      }
      
    });
    
  }
  
  if(this.config.network) {
  
    this.config.network.forEach(device => {
    
      let error = false;
      
      if (!device.name) {
        Logger.warn('One of the Network devices has no name configured. This device will be skipped.');
        error = true;
      } else if (!device.address) {
        Logger.warn('There is no address configured for this Network device. This device will be skipped.', device.name);
        error = true;
      } else if (!this.validMAC.test(device.address) && !this.validIP.test(device.address)) {
        Logger.warn('The address for this WOL device is not a valid IP/MAC address. This device will be skipped.', device.name);
        error = true;
      }

      if (!error) {
        device.type = 'network';
        device.subtype = 'network';
        const uuid = UUIDGen.generate(device.name);
        if (this.network.has(uuid)) {
          Logger.warn('Multiple network devices are configured with this name. Duplicate devices will be skipped.', device.name);
        } else {
          Logger.info('Configuring network device', device.name);
          device.fritzbox = this.fritzbox;
          this.network.set(uuid, device);
        }
      }
      
    });
    
  }
  
  if(config.extras && Object.keys(config.extras).length){
  
    this.extrasAsCharacteristics = {};
    
    Object.keys(config.extras)
      .filter( device => Object.keys(config.extras[device]).length && config.extras[device].active && config.extras[device].accType === 'characteristic')
      .map( device => {
        this.extrasAsCharacteristics[device] = {
          ...config.extras[device]
        };
      });
    
    let extras = Object.keys(config.extras)
      .filter( device => Object.keys(config.extras[device]).length && config.extras[device].active && config.extras[device].accType === 'switch');
      
    extras.forEach(device => {
    
      let dev = {
        name: null,
        type: 'extra',
        subtype: device,
        options: config.extras[device],
        oldFW: this.masterDevice.oldFW
      };
  
      switch (device){
        case 'alarm':
          if(config.extras[device].telNr){
            dev.name = this.masterDevice.name + ' Alarm';
          }
          break;
        case 'wakeup':
          if(config.extras[device].internNr){
            dev.name = this.masterDevice.name + ' WakeUp';
          }
          break;
        case 'ringlock':
          if(config.extras[device].DECTphones){
            dev.name = this.masterDevice.name + ' RingLock';
          }
          break;
        case 'phoneBook':
          dev.name = this.masterDevice.name + ' PhoneBook';
          break;
        default:
          //fall through
          break;
      }
      
      if(dev.name){
        const uuid = UUIDGen.generate(dev.name);
        if (this.devices.has(uuid)) {
          Logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', dev.name);
        } else {
          dev.fritzbox = this.fritzbox;
          this.devices.set(uuid, dev);
        }
      }
    
    }); 
    
    this.extrasAsCharacteristics = Object.keys(this.extrasAsCharacteristics).length ? this.extrasAsCharacteristics : false;
    
  }
  
  if(config.options && Object.keys(config.options).length){
    if(this.presence.size){
      if(config.options.presence){
        this.presenceOptions = true;
      }
    }
    this.polling = {
      timer: config.options.polling && !isNaN(parseInt(config.options.polling.timer)) ? (config.options.polling.timer < 1 ? false : config.options.polling.timer * 1000) : 10000,
      exclude: config.options.polling && config.options.polling.exclude && config.options.polling.exclude.length 
        ?  config.options.polling.exclude
        :  ['wakeup', 'alarm', 'phoneBook']
    };
    this.reboot = {
      on: config.options.reboot && config.options.reboot.on ? config.options.reboot.on : false,
      off: config.options.reboot && config.options.reboot.on ? config.options.reboot.on : false 
    };
  } else {
    this.polling = {
      timer: 10000,
      exclude: ['wakeup', 'alarm', 'phoneBook']
    };
    this.reboot = {
      on: false,
      off: false
    };
  }
    
  if(!this.polling.exclude.includes('wakeup'))
    this.polling.exclude.push('wakeup');
    
  if(!this.polling.exclude.includes('alarm'))
    this.polling.exclude.push('alarm');
    
  if(!this.polling.exclude.includes('phoneBook'))
    this.polling.exclude.push('phoneBook');
  
  if(this.presence.size){
    if(this.presenceOptions){
      let accType = config.options.presence.accType;
      let validTypes = ['occupancy', 'motion'];
      if(!validTypes.includes(accType)){
        Logger.warn('No or wrong accessory type setted up for the anyone sensor. Setting it to "occupancy".');
        accType = 'occupancy';
      }
      this.presenceOptions = {};
      this.presenceOptions = {
        'anyone': config.options.presence.anyone || false,
        'accType': accType,
        'offDelay': !isNaN(parseInt(config.options.presence.offDelay)) ? config.options.presence.offDelay : 90,
        'onDelay': !isNaN(parseInt(config.options.presence.onDelay)) ? config.options.presence.onDelay : 30
      };
    } else {
      Logger.debug('Setting default options for presence.');
      this.presenceOptions = {};
      this.presenceOptions = {
        'anyone': false,
        'accType': 'occupancy',
        'offDelay': 90,
        'onDelay': 30
      };
    }
    
    if(this.presenceOptions.anyone){
      let presence = {
        name: 'Anyone',
        type: 'presence',
        subtype: 'presence-' + this.presenceOptions.accType,
        accType: this.presenceOptions.accType 
      };
      const uuid = UUIDGen.generate(presence.name);
      if (this.devices.has(uuid)) {
        Logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', presence.name);
      } else {
        this.devices.set(uuid, presence);
      }
    }
    
  }
  
  if(config.callmonitor && config.callmonitor.active && config.callmonitor.ip && this.validIP.test(config.callmonitor.ip)){
   
    this.config.callmonitor = config.callmonitor;
    this.config.callmonitor.port = this.config.callmonitor.port || 1012;

    this.config.callmonitor.incomingTo = this.config.callmonitor.incomingTo && this.config.callmonitor.incomingTo.length
      ? this.config.callmonitor.incomingTo
      : [];
                                         
    this.config.callmonitor.outgoingFrom = this.config.callmonitor.outgoingFrom && this.config.callmonitor.outgoingFrom.length
      ? this.config.callmonitor.outgoingFrom
      : [];

    this.config.callmonitor.type = 'callmonitor';
    
    this.Callmonitor = new Callmonitor(this.config.callmonitor);  
    this.Callmonitor.connect();
    
    if(this.config.callmonitor.group){
      const uuid_group = UUIDGen.generate('Callmonitor');
      
      if (this.devices.has(uuid_group)) {
        Logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', 'Callmonitor');
      } else {
        let callmonitor = {
          name: 'Callmonitor',
          subtype: 'group',
          ...this.config.callmonitor
        };
        this.devices.set(uuid_group, callmonitor);
      }
    } else {
      const uuid_incoming = UUIDGen.generate('Callmonitor Incoming');
      const uuid_outgoing = UUIDGen.generate('Callmonitor Outgoing');
      
      if (this.devices.has(uuid_incoming)) {
        Logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', 'Callmonitor Incoming');
      } else {
        let callmonitor = {
          name: 'Callmonitor Incoming',
          subtype: 'incoming',
          ...this.config.callmonitor
        };
        this.devices.set(uuid_incoming, callmonitor);
      }
      
      if (this.devices.has(uuid_outgoing)) {
        Logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', 'Callmonitor Outgoing');
      } else {
        let callmonitor = {
          name: 'Callmonitor Outgoing',
          subtype: 'outgoing',
          ...this.config.callmonitor
        };
        this.devices.set(uuid_outgoing, callmonitor);
      }
    }
    
  } else {
    Logger.debug('Callmonitor is not or not correctly set up. Skip.');
    this.config.callmonitor = false;
  }
  
  if(config.telegram && config.telegram.active && config.telegram.token && config.telegram.chatID){
    this.config.telegram = config.telegram;
    this.config.telegram.messages = this.config.telegram.messages || {};
    this.messages = {};
    Object.keys(this.config.telegram.messages)
      .filter( msg => Object.keys(this.config.telegram.messages[msg]).length )
      .map(msg => {
        this.messages[msg] = {
          ...this.config.telegram.messages[msg]
        };
      });
      
    this.Telegram = new Telegram(this.config.telegram, this.messages);  
    this.Telegram.start();
    
  } else {
    Logger.debug('Telegram is not or not correctly set up. Skip.');
    this.config.telegram = false;
    this.messages = false;
  }  
  
  this.handler = DeviceHandler(this.api, this.fritzbox, this.devices, this.presence, this.smarthome, this.api.user.storagePath(), this.Telegram, this.presenceOptions, this.polling, this.reboot);
  
  if(this.network.size)
    new WatchNetwork(this.network, this.Telegram, this.polling);
    
  //listener to close the callmonitor
  this.api.on('shutdown', () => {
    if(this.Callmonitor)
      this.Callmonitor.stop();
  });
  
  this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
  
}

FritzPlatform.prototype = {

  didFinishLaunching: async function(){
  
    try {
      await fs.ensureDir(this.api.user.storagePath() + '/fritzbox');
    } catch(err) {
      Logger.warn('Can not create fritzbox directory into your homebridge directory. Please create it manually.');
    }

    for (const entry of this.devices.entries()) {
    
      let uuid = entry[0];
      let device = entry[1];
      
      const cachedAccessory = this.accessories.find(curAcc => curAcc.UUID === uuid);
      
      if (!cachedAccessory) {
      
        const accessory = new Accessory(device.name, uuid);
        accessory.context.config = device;
        
        Logger.info('Configuring accessory...', accessory.displayName);
        this.setupAccessory(accessory, device);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        
        this.accessories.push(accessory);
        
      }
      
    }

    this.accessories.forEach(accessory => {
    
      const device = this.devices.get(accessory.UUID);
      
      try {
      
        if (!device)
          this.removeAccessory(accessory);
    
      } catch(err) {

        Logger.info('It looks like the accessory has already been removed. Skip removing.');
        Logger.debug(err);
     
      }
      
    });
    
    if(this.polling.timer)
      this.handler.poll(this.accessories);
  
  },
  
  setupAccessory: async function(accessory, device){
  
    var manufacturer, model, serialNumber;
    
    accessory.on('identify', () => {
      Logger.info('Identify requested.', accessory.displayName);
    });

    const AccessoryInformation = accessory.getService(this.api.hap.Service.AccessoryInformation);
    
    if(device.type === 'router'){
      manufacturer = device.manufacturer && device.manufacturer !== '' ? device.manufacturer : 'Homebridge';
      model = device.model && device.model !== '' ? device.model : device.type;
      serialNumber = device.serialNumber && device.serialNumber !== '' ? device.serialNumber : accessory.displayName;
    } else {
      manufacturer = this.masterDevice.manufacturer && this.masterDevice.manufacturer !== '' ? this.masterDevice.manufacturer : 'Homebridge';
      model = this.masterDevice.model && this.masterDevice.model !== '' ? this.masterDevice.model : device.type;
      serialNumber = accessory.displayName; //needs to be unique for fakegato
    }
    
    if (AccessoryInformation) {
      AccessoryInformation.setCharacteristic(this.api.hap.Characteristic.Manufacturer, manufacturer);
      AccessoryInformation.setCharacteristic(this.api.hap.Characteristic.Model, model);
      AccessoryInformation.setCharacteristic(this.api.hap.Characteristic.SerialNumber, serialNumber);
      AccessoryInformation.setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, packageFile.version);
    }
    
    accessory.context.polling = this.polling;
    
    switch (device.type) {
      case 'router':
        new RouterAccessory(this.api, accessory, this.extrasAsCharacteristics, this.handler);
        break;
      case 'smarthome':
        if(device.subtype === 'smarthome-switch' && device.energy)
          new SmarthomeOutletAccessory(this.api, accessory, this.handler, FakeGatoHistoryService);
        if(device.subtype === 'smarthome-switch' && !device.energy)
          new SmarthomeSwitchAccessory(this.api, accessory, this.handler);
        if(device.subtype === 'smarthome-temperature')
          new SmarthomeTemperatureAccessory(this.api, accessory, this.handler, FakeGatoHistoryService);
        if(device.subtype === 'smarthome-thermostat')
          new SmarthomeThermostatAccessory(this.api, accessory, this.handler, FakeGatoHistoryService);
        if(device.subtype === 'smarthome-contact')
          new SmarthomeContactAccessory(this.api, accessory, this.handler, FakeGatoHistoryService);
        if(device.subtype === 'smarthome-window')
          new SmarthomeWindowAccessory(this.api, accessory, this.handler, FakeGatoHistoryService);
        if(device.subtype === 'smarthome-lightbulb')
          new SmarthomeLightbulbAccessory(this.api, accessory, this.handler);
        break;
      case 'presence':
        if(device.subtype === 'presence-motion')
          new PresenceMotionAccessory(this.api, accessory, this.handler, this.accessories, FakeGatoHistoryService);
        if(device.subtype === 'presence-occupancy')
          new PresenceOccupancyAccessory(this.api, accessory, this.handler, this.accessories, FakeGatoHistoryService);
        break;
      case 'wol':
        new WolAccessory(this.api, accessory, this.handler);
        break;
      case 'callmonitor':
        new CallmonitorAccessory(this.api, this.log, accessory, this.handler, this.Callmonitor, FakeGatoHistoryService);
        break;
      case 'extra':
        new ExtrasAccessory(this.api, accessory, this.handler);
        break;
      default:
        // fall through
        break;
    }

  },

  configureAccessory: async function(accessory){

    const device = this.devices.get(accessory.UUID);

    if (device && this.masterDevice){
       
      Logger.info('Configuring accessory...', accessory.displayName);
                                                                                                      
      accessory.context.config = device; 
      this.setupAccessory(accessory, device);
    }
    
    this.accessories.push(accessory);
  
  },
  
  removeAccessory: function(accessory) {
  
    Logger.info('Removing accessory...', accessory.displayName);
    
    let accessories = this.accessories.map( cachedAccessory => {
      if(cachedAccessory.displayName !== accessory.displayName){
        return cachedAccessory;
      }
    });
    
    this.accessories = accessories.filter(function (el) {
      return el != null;
    });

    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  
  }

};