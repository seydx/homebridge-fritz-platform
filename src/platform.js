'use strict';

const tr = require('@seydx/tr064');
const moment = require('moment');
const net= require('net');
const Device = require('./accessory.js');
const packageFile = require('../package.json');
const LogUtil = require('../lib/LogUtil.js');

const pluginName = 'homebridge-fritz-platform';
const platformName = 'FritzPlatform';

var FakeGatoHistoryService;

module.exports = function (homebridge) {
  FakeGatoHistoryService = require('fakegato-history')(homebridge);
  return FritzPlatform;
};

function FritzPlatform (log, config, api) {

// HB
  const self = this;
  this.log = log;
  this.logger = new LogUtil(null, log);
  this.accessories = [];
  this.config = config;
  this.boxType = config.type||'dsl';
  this.presence = config.presence||{};
  this.wol = config.wol||{};
  this.options = config.options||{};
  this.wifi = config.wifi||{};
  this.debug = config.debug||{};
  this.repeater = config.repeater||{};
  this.cmd = config.cmd||{};
  this.callmonitor = config.callmonitor||{};
  this.wakeup = this.options.wakeup||{};
  this.alarm = this.options.alarm||{};
  this.telegram = config.telegram||{};
  this.broadband = this.options.broadband||{};
  this.reboot = this.options.reboot||{};
  this.polling = config.polling < 10 ? 10*1000 : config.polling*1000;
  this.HBpath = api.user.storagePath()+'/accessories';
  this.call = {};
  this.client;

  this.devOptions = {
    host: this.config.host||'fritz.box',
    port: this.config.port||49000,
    username: this.config.username,
    password: this.config.password,
    timeout: this.config.timeout*1000||5000
  };

  this.tr064 = new tr.TR064(this.devOptions);

  this.types = {
    device: 1,
    presence: 2,
    wol: 3,
    repeater: 4,
    callmonitor: 5
  };

  if (api) {
    if (api.version < 2.2) {
      throw new Error('Unexpected API version. Please update your homebridge!');
    }
    self.logger.info('**************************************************************');
    self.logger.info('FritzPlatform v'+packageFile.version+' by SeydX');
    self.logger.info('GitHub: https://github.com/SeydX/'+pluginName);
    self.logger.info('Email: seyd55@outlook.de');
    self.logger.info('**************************************************************');
    self.logger.info('start success...');
    this.api = api;
    this.api.on('didFinishLaunching', self.didFinishLaunching.bind(this));
  }
}

FritzPlatform.prototype = {

  didFinishLaunching: function(){
    const self = this;
    this.tr064.initDevice('TR064')
      .then(result => {
        self.logger.info('Device initialized: ' + result.meta.friendlyName); 
        result.startEncryptedCommunication()
          .then(device => {
            self.logger.info('Encrypted communication started with: ' + result.meta.friendlyName); 
            if(self.config.callmonitor&&!self.config.callmonitor.disable){
              self.callMonitor(result.meta.friendlyName, device);
            } else {
              self.time = moment().unix();
              self.device = device;
              self.device.login(self.config.username, self.config.password);
              self.initPlatform();
            }
          })
          .catch(err => {
            self.logger.error('An error occured by starting encypted communication with: ' + result.meta.friendlyName);
            self.logger.error(JSON.stringify(err,null,4));
            setTimeout(function(){
              self.didFinishLaunching();
            }, 15000);
          });
      })
      .catch(err => {
        self.logger.error('An error occured by initializing device, trying again...');
        self.logger.error(JSON.stringify(err,null,4));
        setTimeout(function(){
          self.didFinishLaunching();
        }, 15000);
      });
  },

  callMonitor: function(name, device){
    const self = this;
    self.client = net.createConnection(self.callmonitor.port, self.callmonitor.ip, function(){
      self.logger.info('Callmonitor connection established with: ' + name);
      self.time = moment().unix();
      self.device = device;
      self.device.login(self.config.username, self.config.password);
      self.initPlatform();
    });
    self.client.on('error', error => {
      self.logger.error('An error occured by connecting to callmonitor!');
      if(error.errno == 'ECONNREFUSED'||error.code == 'ECONNREFUSED'){
        self.logger.warn('Can not connect to ' + self.callmonitor.ip + ':' + self.callmonitor.port + ' - Dial #96*5 to enable port 1012');
      } else if (error.errno == 'EHOSTUNREACH'||error.code == 'EHOSTUNREACH') {
        self.logger.warn('Can not connect to ' + self.callmonitor.ip + ':' + self.callmonitor.port + ' - IP address seems to be wrong!');
      } else if(error.errno == 'ENETUNREACH') {
        self.logger.warn('Network currently not reachable!');
      } else {
        self.logger.error(JSON.stringify(error,null,4));
      }
      self.logger.info('Trying again in 30 seconds..');
      setTimeout(function(){self.callMonitor(name,device);},30*1000);
    });
    self.client.on('end', () => {
      self.logger.warn('Callmonitor connection were closed!');
    });
  },

  initPlatform: function(){
    const self = this;
    if(this.configured||(moment().unix()-this.time) > 7){
      let skip = false;
      for (const i in this.accessories) {
        if (this.accessories[i].context.type == this.types.device) {
          skip = true;
        }
      }
      if (!skip&&this.device) {
        let parameter = {
          name: this.device.meta.friendlyName,
          serialNo: this.device.meta.UDN.split('uuid:')[1].split('-')[0]+'-'+this.types.device,
          type: this.types.device,
          model: 'Fritz Box',
          fakegato: false
        };
        new Device(this, parameter, true);
      }
      if(!self.device){
        for (const i in this.accessories) {
          if (this.accessories[i].context.type == this.types.device) {
            this.removeAccessory(this.accessories[i]);
          }
        }
      }

      if(Object.keys(this.presence).length){
        let userArray = [];
        let skipAnyone = false;
        for(const i of Object.keys(this.presence)) {
          if(i!='telegram'&&i!='token'&&i!='chatID'&&i!='messages'&&i!='delay'&&i!='type'){
            skip = false;
            userArray.push(i,this.presence[i]);
            for (const j in this.accessories) {
              if(this.accessories[j].context.type == this.types.presence){
                if (this.accessories[j].context.mac == this.presence[i] || this.accessories[j].displayName == i) {
                  skip = true;
                }
                if (this.accessories[j].displayName == 'Anyone') {
                  skipAnyone = true;
                }
              }
            }
            if (!skip) {
              let serial = this.presence[i];
              while (serial.indexOf(':') > -1) {
                serial = serial.replace(':', '');
              }
              let parameter = {
                name: i,
                serialNo: serial + '-' + this.types.presence,
                type: this.types.presence,
                accType: self.presence.type||'motion',
                model: 'Presence Sensor',
                mac: this.presence[i],
                fakegato: self.presence.type == 'motion' ? true : false,
                fakegatoType: self.presence.type == 'motion' ? 'motion' : null,
                fakegatoTimer: self.presence.type == 'motion' ? true : null,
                delay: self.presence.delay*1000||0
              };
              new Device(this, parameter, true);
            }
            if (!skipAnyone) {
              let parameter = {
                name: 'Anyone',
                serialNo: '1234567890-' + this.types.presence,
                type: this.types.presence,
                model: 'Anyone Sensor',
                mac: '000000000000',
                accType: self.presence.type||'motion',
                fakegato: self.presence.type == 'motion' ? true : false,
                fakegatoType: self.presence.type == 'motion' ? 'motion' : null,
                fakegatoTimer: self.presence.type == 'motion' ? true : null,
                delay: self.presence.delay*1000||0
              };
              new Device(this, parameter, true);
            }
          }
        }
        for(const i in this.accessories){
          if(this.accessories[i].context.type == this.types.presence && this.accessories[i].displayName != 'Anyone'){
            if(!userArray.includes(this.accessories[i].context.mac)||!userArray.includes(this.accessories[i].displayName)){
              self.removeAccessory(self.accessories[i]);
            }
          }
        }
      } else {
        for (const i in this.accessories) {
          if (this.accessories[i].context.type == this.types.presence) {
            this.removeAccessory(this.accessories[i]);
          }
        }
      }

      if(Object.keys(this.wol).length){
        let wolArray = [];
        for(const i of Object.keys(this.wol)) {
          skip = false;
          wolArray.push(this.wol[i]);
          for (const j in this.accessories) {
            if (this.accessories[j].context.mac == this.wol[i] && this.accessories[j].context.type == this.types.wol) {
              skip = true;
            }
          }
          if (!skip) {
            let serial = this.wol[i];
            while (serial.indexOf(':') > -1) {
              serial = serial.replace(':', '');
            }
            let parameter = {
              name: i,
              serialNo: serial + '-' + this.types.wol,
              type: this.types.wol,
              model: 'Wake On Lan',
              mac: this.wol[i],
              fakegato: false
            };
            new Device(this, parameter, true);
            parameter = {};
          }
        }
        for(const i in this.accessories){
          if(this.accessories[i].context.type == this.types.wol){
            if(!wolArray.includes(this.accessories[i].context.mac)){
              self.removeAccessory(self.accessories[i]);
            }
          }
        }
      } else {
        for (const i in this.accessories) {
          if (this.accessories[i].context.type == this.types.wol) {
            this.removeAccessory(this.accessories[i]);
          }
        }
      }

      if(Object.keys(this.repeater).length){
        let repeaterArray = [];
        for(const i of Object.keys(this.repeater)) {
          if(!this.repeater[i].disable){
            skip = false;
            repeaterArray.push(this.repeater[i].ip);
            for (const j in this.accessories) {
              if (this.accessories[j].context.host == this.repeater[i].ip && this.accessories[j].context.type == this.types.repeater) {
                skip = true;
              }
            }
            if (!skip) {
              let parameter = {
                name: i,
                serialNo: this.device.meta.UDN.split('uuid:')[1].split('-')[0]+'-'+this.types.repeater,
                disable: this.repeater[i].disable||false,
                host: this.repeater[i].ip,
                port: this.repeater[i].port,
                username: this.repeater[i].username,
                password: this.repeater[i].password,
                wifi2: this.repeater[i].wifi['2.4ghz']||false,
                wifi5: this.repeater[i].wifi['5ghz']||false,
                wifiGuest: this.repeater[i].wifi.guest||false,
                led: this.repeater[i].led||false,
                type: this.types.repeater,
                model: 'Repeater',
                fakegato: false
              };
              new Device(this, parameter, true);
            }
          } else {
            for(const l in this.accessories){
              if(this.accessories[l].context.type == this.types.repeater && this.accessories[l].context.host == this.repeater[i].ip){
                self.removeAccessory(self.accessories[l]);
              }
            }
          }
        }
        for(const i in this.accessories){
          if(this.accessories[i].context.type == this.types.repeater){
            if(!repeaterArray.includes(this.accessories[i].context.host)){
              self.removeAccessory(self.accessories[i]);
            }
          }
        }
      } else {
        for (const i in this.accessories) {
          if (this.accessories[i].context.type == this.types.repeater) {
            this.removeAccessory(this.accessories[i]);
          }
        }
      }

      if(Object.keys(self.callmonitor).length&&!self.callmonitor.disable){
        let skip = false;
        for (const i in this.accessories) {
          if (this.accessories[i].context.type == this.types.callmonitor) {
            skip = true;
          }
        }
        if (!skip) {
          let incoming = {
            name: 'Callmonitor Incoming',
            serialNo: self.device.meta.UDN.split('uuid:')[1].split('-')[0]+'-'+self.types.callmonitor+'-1',
            type: self.types.callmonitor,
            model: 'Incoming sensor',
            fakegato: false
          };
          let outgoing = {
            name: 'Callmonitor Outgoing',
            serialNo: self.device.meta.UDN.split('uuid:')[1].split('-')[0]+'-'+self.types.callmonitor+'-2',
            type: self.types.callmonitor,
            model: 'Outgoing sensor',
            fakegato: false
          };
          new Device(this, incoming, true);
          new Device(this, outgoing, true);
        }
      } else {
        for (const i in this.accessories) {
          if (this.accessories[i].context.type == this.types.callmonitor) {
            this.removeAccessory(this.accessories[i]);
          }
        }
      }

      this.logger.info('Platform initialization finished');
    } else {
      setTimeout(function(){self.initPlatform();},1000);
    }
  },

  configureAccessory: function (accessory) {
    const self = this;
    if(this.device){
      self.configured = true;
      this.logger.info('Configuring accessory from cache: ' + accessory.displayName);
      accessory.reachable = true; 
      accessory.context.stopPolling = false;
      
      if(accessory.context.type == self.types.presence){
        accessory.context.delay=self.presence.delay*1000||0;
        if(accessory.context.accType != self.presence.type){
          self.logger.warn('New accessory type for presence sensor detected!');
          self.removeAccessory(accessory);
        }
      }
      accessory.context.options = {
        host: self.config.host||'fritz.box',
        port: self.config.port||49000,
        username: self.config.username,
        password: self.config.password,
        timeout: self.config.timeout*1000||5000
      }; 
      if(accessory.context.fakegato){
        accessory.context.fakegatoOptions = {storage:'fs',path:self.HBpath, disableTimer: true};
        accessory.context.fakegatoService = new FakeGatoHistoryService(accessory.context.fakegatoType,accessory,accessory.context.fakegatoOptions);
        accessory.context.fakegatoService.subtype = accessory.context.serialNo;
        accessory.context.fakegatoService.log = this.log;
      }
      if(accessory.context.type == self.types.repeater){
        for(const i of Object.keys(self.repeater)){
          if(accessory.displayName == i){
            accessory.context.disable = self.repeater[i].disable||false;
            accessory.context.host = self.repeater[i].ip;
            accessory.context.port = self.repeater[i].port||49000;
            accessory.context.username = self.repeater[i].username;
            accessory.context.password = self.repeater[i].password;
            accessory.context.wifi2 = self.repeater[i].wifi['2.4ghz']||false;
            accessory.context.wifi5 = self.repeater[i].wifi['5ghz']||false;
            accessory.context.wifiGuest = self.repeater[i].wifi.guest||false;
            accessory.context.led = self.repeater[i].led||false;
            accessory.context.options = {
              host: accessory.context.host,
              port: accessory.context.port,
              username: accessory.context.username,
              password: accessory.context.password,
              timeout: self.config.timeout*1000||5000
            };
          }
        }
      }
      this.accessories[accessory.displayName] = accessory;
      new Device(this, accessory, false);
    } else {
      setTimeout(function(){self.configureAccessory(accessory);},1000);
    }
  },

  removeAccessory: function (accessory) {
    if (accessory) {
      this.logger.warn('Removing accessory: ' + accessory.displayName + '. No longer configured.');
      this.api.unregisterPlatformAccessories(pluginName, platformName, [accessory]);
      delete this.accessories[accessory.displayName];
    }
  }

};
