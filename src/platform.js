'use strict';

const tr = require('../lib/TR064.js');
const packageFile = require('../package.json');
const LogUtil = require('../lib/LogUtil.js');
const net = require('net');
const request = require('request');
const tcpp = require('tcp-ping');
const parseString = require('xml2js').parseString;
const HomeKitTypes = require('./types/types.js');


//Accessories
const presAccessory = require('./accessories/presence.js');
const boxAccessory = require('./accessories/device.js');
const wolAccessory = require('./accessories/wol.js');
const callAccessory = require('./accessories/callmonitor.js');
const smartHomeAccessory = require('./accessories/smarthome.js');

const pluginName = 'homebridge-fritz-platform';
const platformName = 'FritzPlatform';

var Service, Characteristic;

module.exports = function (homebridge) {
  return FritzPlatform;
};

function FritzPlatform (log, config, api) {
  if (!api||!config) return;

  // HB
  Service = api.hap.Service;
  Characteristic = api.hap.Characteristic;
  HomeKitTypes.registerWith(api.hap);

  // BASE
  const self = this;
  this.log = log;
  this.HBpath = api.user.storagePath()+'/accessories';
  this.logger = new LogUtil(null, log);
  this.accessories = [];
  this.config = config;
  this.validMAC = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
  this.validIP = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  this.devices = config.devices||{};
  this.deviceArray = [];
  this.sidArray = [];
  this.smarthome = config.smarthome||{};
  this.presence = config.presence||{};
  this.wol = config.wol||{};
  this.callmonitor = config.callmonitor||{};
  this.alarm = config.alarm||{};
  this.wakeup = config.wakeup||{};
  this.ringlock = config.ringlock||{};
  this.broadband = config.broadband||{};
  this.extReboot = config.extReboot||{};
  
  this.readOnlySwitches = config.readOnlySwitches||false;
  this.telegram = config.telegram||{};
  this.delay = (config.delay&&config.delay>=10) ? config.delay*1000:10*1000;
  this.polling = (config.polling&&config.polling>=5) ? config.polling*1000:5*1000;
  this.timeout = (config.timeout&&config.timeout>=5) ? config.timeout*1000:5*1000;
  this.anyone = config.anyone||false;
  
  this.hostsCount = 0;
  this.smartCount = 0;
  this.sidCount = 0;

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

  tcp: function(name, host, port, callback){
    const self = this;
    this.logger.debug(name + ': Ping ' + host + ':' + port);
    tcpp.probe(host, port, function(err, available) {
      available?self.logger.debug('Ping successfull'):self.logger.debug('Ping not successfull');
      callback(available);
    });
  },
  
  didFinishLaunching: function(){
    const self = this;
    if(Object.keys(self.devices).length){
      for(const i in self.devices){
        let device = self.devices[i];
        //Options
        let options = {
          name: i,
          host: device.host||'fritz.box',
          port: device.port||49000,
          username: device.username,
          password: device.password,
          timeout: self.timeout,
          type: device.type||'dsl',
          log: self.logger,
          mesh: device.mesh||false,
          master: device.master||false
        };
        self.tcp(options.name, options.host,options.port,function(available){
          if(available){
          //Init device & Login
            let tr064 = new tr.TR064(options);
            tr064.initDevice()
              .then(result => {
                self.logger.initinfo('Device initialized: ' + result.deviceInfo.friendlyName);
                result.startEncryptedCommunication()
                  .then(device => {
                    self.logger.initinfo('Encrypted communication started with: ' + result.deviceInfo.friendlyName); 
                    device.login(options.username, options.password);
                    self.deviceArray[i] = device;
                    self.fetchSID(device);
                    if(Object.keys(self.devices).length==Object.keys(self.deviceArray).length){
                      if(Object.keys(self.presence).length){ 
                        self.hostsList(self.deviceArray);
                      } else {
                        if(Object.keys(self.smarthome).length){
                          self.getSmartHomeList(self.deviceArray);
                        } else {
                          self.initPlatform(self.deviceArray);
                        }
                      }
                    }
                  })
                  .catch(err => {
                    self.logger.errorinfo('An error occured by starting encypted communication with: ' + result.deviceInfo.friendlyName);
                    self.logger.errorinfo(JSON.stringify(err,null,4));
                    console.log(err);
                    setTimeout(function(){
                      self.didFinishLaunching();
                    }, 15000);
                  });
              })
              .catch(err => {
                self.logger.errorinfo('An error occured by initializing device, trying again...');
                self.logger.errorinfo(JSON.stringify(err,null,4));
                console.log(err);
                setTimeout(function(){
                  self.didFinishLaunching();
                }, 15000);
              });
          } else { 
            self.logger.warn('Can not reach ' + options.host + ':' + options.port + ' - Trying again in 30 seconds');
            self.deviceArray = [];
            setTimeout(function(){
              self.didFinishLaunching();
            }, 30000);
          }
        });
      }
    } else {
      throw new Error('NO DEVICES SETTED UP IN CONFIG.JSON - PLEASE ADD A NEW DEVICE AND RESTART HOMEBRIDGE!');
    }
  },
  
  fetchSID(device){
    const self = this;
    let stopPolling;
    for(const a in self.accessories){
      if(self.accessories[a].context.stopPolling)stopPolling=true;
    }
    if(!stopPolling){
      self.sidCount++;
      let config = device.services['urn:dslforum-org:service:DeviceConfig:1'];
      config.actions['X_AVM-DE_CreateUrlSID'](null,{name:device.config.name + ': fetchSID',count:0},function(err, result) {
        if(result){
          if(device.config.master)self.sid = result['NewX_AVM-DE_UrlSID'].split('sid=')[1];
          let sid = result['NewX_AVM-DE_UrlSID'].split('sid=')[1];
          self.sidArray[device.config.name] = sid;
          if(Object.keys(self.deviceArray).length==self.sidCount){
            self.sidCount = 0;
            if(Object.keys(self.accessories).length){
              for(const j in self.accessories){
                self.accessories[j].context.sids = self.sidArray;
              }       
            }
          }
          if(Object.keys(self.accessories).length){
            for(const l in self.accessories){
              if(device.config.master)self.accessories[l].context.newSid = sid;
            }
          }
          setTimeout(function(){
            self.fetchSID(device);
          }, 10000);
        } else {
          self.sidCount = 0;
          if(err.ping){
            self.logger.warn(device.config.name + ' fetchSID: Can not reach ' + device.config.host + ':' + device.config.port + ' - Trying again in 30 seconds...');
          } else {
            self.logger.errorinfo(device.config.name + ': An error occured while fetching SID, trying again in 30 seconds...');
            self.logger.errorinfo(JSON.stringify(err,null,4));
          }
          setTimeout(function(){
            self.fetchSID(device);
          }, 30000);
        }
      });
    } else {
      setTimeout(function(){
        self.fetchSID(device);
      }, 2000);
    }
  },
  
  getSmartHomeList(devices){
    const self = this;
    let device, stopPolling;
    for(const a in self.accessories){
      stopPolling = self.accessories[a].context.stopPolling;
    }
    for(const i in devices){
      if(devices[i].config&&devices[i].config.master){
        device = devices[i];
      }
    }
    if(!stopPolling&&self.sid&&device){
      self.smartCount++;
      let cmd = 'getdevicelistinfos';
      let url = 'http://'+device.config.host+'/webservices/homeautoswitch.lua?switchcmd='+cmd+'&sid='+self.sid;
      let opt = {
        uri: url,
        method: 'GET',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false
      };
      self.tcp(device.config.name + ' getSmartHomeList', device.config.host, device.config.port, function(res){
        if(res){
          request(opt,function(error, response, body) {
            if (!error && response.statusCode == 200) {
              parseString(body,{explicitArray: false},function(err, result) {
                self.smartDevices = [];
                let list = result.devicelist.device;
                if(typeof list === 'object'){
                  let ident = list['$'].identifier;
                  ident = ident.replace(/\s+/g, '');
                  delete list['$'];
                  self.smartDevices[ident] = list;
                } else {
                  for(const i in list){
                    let ident = list[i]['$'].identifier;
                    ident = ident.replace(/\s+/g, '');
                    delete list[i]['$'];
                    self.smartDevices[ident] = list[i];
                  }
                }
                if(self.smartCount===1){
                  self.initPlatform(self.deviceArray);
                }
                setTimeout(function(){
                  self.getSmartHomeList(devices);
                }, self.polling);
              });
            } else {
              self.logger.errorinfo('An error occured while getting new smarthome device list, trying again in 15 seconds...');
              let showError = {
                error: error?error.errno:response.statusMessage,
                errorCode: error?error.code:response.statusCode
              };
              self.logger.errorinfo(JSON.stringify(showError,null,4));
              setTimeout(function(){
                self.getSmartHomeList(device);
              }, 15000);
            }
          });
        } else {
          self.logger.warn('Can not reach ' + url + ' - Trying again in 30 seconds');
          setTimeout(function(){
            self.getSmartHomeList(device);
          }, 30000);
        }
      });
    } else {
      setTimeout(function(){
        self.getSmartHomeList(devices);
      }, 2000);
    }
  },
  
  hostsList: function(devices){
    const self = this;
    let count = 0;
    let mesh, device;
    this.hosts = [];
    for(const i in devices){
      if(devices[i].config&&devices[i].config.master){
        mesh=devices[i].config.mesh;
        device = devices[i];
      }
    }
    if(mesh){
      self.logger.debug(device.config.name + ': DE_GetHostListPath');
      let hosts = device.services['urn:dslforum-org:service:Hosts:1'];
      hosts.actions['X_AVM-DE_GetHostListPath'](null,{name:device.config.name + ' GetHostList',count:0},function(err, result) {
        if(!err){
          device.config.hostpath = result['NewX_AVM-DE_HostListPath'];
          self.logger.debug('Storing host path in config');
          self.logger.debug('Path: ' + 'http://' + device.config.host + ':' + device.config.port + device.config.hostpath);
          self.getList(device, mesh); 
        } else {
          if(err.ping){
            self.logger.warn(device.config.name + ' GetHostList: Can not reach ' + device.config.host + ':' + device.config.port + ' - Trying again in 30 seconds...');
          } else {
            self.logger.errorinfo(device.config.name + ': An error occured while getting host list, trying again in 30 seconds...');
            self.logger.errorinfo(JSON.stringify(err,null,4));
          }
          setTimeout(function(){
            self.hostsList(device, mesh);
          }, 30000);
        }
      });
    } else {
      for(const j in devices){
        self.logger.debug(devices[j].config.name + ': DE_GetHostListPath');
        let hosts = devices[j].services['urn:dslforum-org:service:Hosts:1'];
        hosts.actions['X_AVM-DE_GetHostListPath'](null,{name:devices[j].config.name + ' GetHostList',count:0},function(err, result) {
          if(!err){
            count++;
            devices[j].config.hostpath = result['NewX_AVM-DE_HostListPath'];
            self.logger.debug('Storing host path in config');
            self.logger.debug('Path: ' + 'http://' + devices[j].config.host + ':' + devices[j].config.port + devices[j].config.hostpath);
            if(Object.keys(devices).length===count){
              self.getList(devices, mesh);  
            }
          } else {
            if(err.ping){
              self.logger.warn(devices[j].config.name + ' GetHostList: Can not reach ' + devices[j].config.host + ':' + devices[j].config.port + ' - Trying again in 30 seconds...');
            } else {
              self.logger.errorinfo(devices[j].config.name + ': An error occured while getting host list, trying again in 30 seconds...');
              self.logger.errorinfo(JSON.stringify(err,null,4));
            }
            setTimeout(function(){
              self.hostsList(devices, mesh);
            }, 30000);
          }
        });
      }
    }
  },
  
  getList(device, mesh){
    const self = this;
    let stopPolling;
    for(const a in self.accessories){
      stopPolling = self.accessories[a].context.stopPolling;
    }
    if(!stopPolling){
      let persistCount = 0;
      let hostArray = [];
      if(mesh){
        let opt = {
          uri: 'http://'+device.config.host+':'+device.config.port+device.config.hostpath,
          method: 'GET',
          rejectUnauthorized: false,
          requestCert: true,
          agent: false,
          timeout: self.timeout
        };
        self.tcp(device.config.name, device.config.host, device.config.port, function(res){
          if(res){
            request(opt,function(error, response, body) {
              if (!error && response.statusCode == 200) {
                parseString(body,{explicitArray: false},function(err, result) {
                  self.hostsCount++;
                  hostArray = hostArray.concat(result.List.Item);
                  self.hosts = hostArray;
                  if(self.hostsCount===1){
                    if(Object.keys(self.presence).length){
                      self.getSmartHomeList(self.deviceArray);
                    } else {
                      self.initPlatform(self.deviceArray);
                    }
                  }
                  setTimeout(function(){
                    self.getList(device, mesh);
                  }, self.polling);
                });
              } else {
                self.logger.errorinfo('An error occured while getting new host list, trying again in 15 seconds...');
                let showError = {
                  error: error?error.errno:response.statusMessage,
                  errorCode: error?error.code:response.statusCode
                };
                self.logger.errorinfo(JSON.stringify(showError,null,4));
                setTimeout(function(){
                  self.getList(device, mesh);
                }, 15000);
              }
            });
          } else {
            self.logger.warn('Can not reach ' + device.config.host + ':' + device.config.port + device.config.hostpath + ' - Trying again in 30 seconds');
            setTimeout(function(){
              self.getList(device, mesh);
            }, 30000);
          }
        });
      } else {
        for(const i in device){
          let opt = {
            uri: 'http://'+device[i].config.host+':'+device[i].config.port+device[i].config.hostpath,
            method: 'GET',
            rejectUnauthorized: false,
            requestCert: true,
            agent: false,
            timeout: self.timeout
          };
          self.tcp(device[i].config.name, device[i].config.host, device[i].config.port, function(res){
            if(res){
              request(opt,function(error, response, body) {
                if (!error && response.statusCode == 200) {
                  parseString(body,{explicitArray: false},function(err, result) {
                    self.hostsCount++;
                    persistCount++;
                    hostArray = hostArray.concat(result.List.Item);
                    if(Object.keys(device).length===persistCount){
                      self.hosts=hostArray;
                      setTimeout(function(){
                        self.getList(device, mesh);
                      }, self.polling);
                    }               
                    if(Object.keys(device).length===self.hostsCount){
                      self.logger.info('Initializing platform...');
                      if(Object.keys(self.smarthome).length){
                        self.getSmartHomeList(self.deviceArray);
                      } else {
                        self.initPlatform(self.deviceArray);
                      }
                    }
                  });
                } else {
                  self.logger.errorinfo('An error occured while getting new host list, trying again in 15 seconds...');
                  let showError = {
                    error: error?error.errno:response.statusMessage,
                    errorCode: error?error.code:response.statusCode
                  };
                  self.logger.errorinfo(JSON.stringify(showError,null,4));
                  setTimeout(function(){
                    self.getList(device, mesh);
                  }, 15000);
                }
              });
            } else {
              self.logger.warn('Can not reach ' + device[i].config.host + ':' + device[i].config.port + device[i].config.hostpath + ' - Trying again in 30 seconds');
              setTimeout(function(){
                self.getList(device, mesh);
              }, 30000);
            }
          });
        }
      }
    } else {
      setTimeout(function(){self.getList(device,mesh);}, 5000);
    }
  },

  initPlatform: function(devices){
    const self = this;
    //Devices
    var skipBox;
    let boxArray = [];
    if(Object.keys(self.devices).length){
      for(const i in self.devices){
        skipBox = false;
        for(const l in self.accessories){
          if(self.accessories[l].context.type == 'box' && self.accessories[l].displayName==i){
            boxArray.push(i);
            skipBox = true;
            self.configureDevice(self.accessories[l],true);
          }                   
        }
        if(!skipBox){
          let options = {
            name: i,
            type: 'box',
            boxType: self.devices[i].type||'dsl',
            wifi2: self.devices[i].wifi2||false,
            wifi5: self.devices[i].wifi5||false,
            wifiGuest: self.devices[i].wifiGuest||false,
            wps: self.devices[i].wps||false,
            phoneBook: (self.devices[i].master&&self.devices[i].phoneBook)?self.devices[i].phoneBook:false,
            aw: (self.devices[i].master&&self.devices[i].aw)?self.devices[i].aw:false,
            led: self.devices[i].led||false,
            lock: self.devices[i].lock||false,
            beta: self.devices[i].beta||false,
            deflection: (self.devices[i].master&&self.devices[i].deflection)?self.devices[i].deflection:false,
            alarm: (Object.keys(self.alarm).length&&self.alarm.active&&self.devices[i].master)?self.alarm:false,
            wakeup: (Object.keys(self.wakeup).length&&self.wakeup.active&&self.devices[i].master)?self.wakeup:false,
            ringlock: (Object.keys(self.ringlock).length&&self.ringlock.active&&self.devices[i].master)?self.ringlock:false,
            broadband: (Object.keys(self.broadband).length&&self.broadband.active&&self.devices[i].master)?self.broadband:false,
            extReboot: (Object.keys(self.extReboot).length&&self.extReboot.active&&self.devices[i].master)?self.extReboot:false,
            devices: devices
          };
          boxArray.push(i);
          new boxAccessory(self,options,true);
        }
      }
    } else {
      //Removeall
      for(const i in self.accessories){
        if(self.accessories[i].context.type == 'box'){
          self.removeAccessory(self.accessories[i]);
        }
      }
    } 
    
    //SmartHome
    var skipSmartHome, skipTemp, tempSensor;
    let smartHomeArray = [];
    if(Object.keys(self.smarthome).length){
      for(const i in self.smarthome){
        skipSmartHome = false;
        skipTemp = false;
        tempSensor = false;
        for(const l in self.accessories){
          if(self.accessories[l].context.type == 'smarthome' && self.accessories[l].displayName==i){
            smartHomeArray.push(i);            
            skipSmartHome = true;
            self.configureSmartHome(self.accessories[l],true);            
          }
        }
        for(const o in self.accessories){
          if(self.accessories[o].context.type == 'smarthome' && self.accessories[o].displayName==i+' Temperature'){
            skipTemp = true;
            smartHomeArray.push(i+' Temperature');
            if(self.smarthome[i].tempSensor)self.configureSmartHome(self.accessories[o],true);
          }
        }
        if(self.smarthome[i].type=='switch'&&self.smarthome[i].tempSensor)tempSensor = true;
        if(!skipTemp&&tempSensor){
          let options = {
            name: i+' Temperature',
            type: 'smarthome',
            accType: 'temp'||false,
            ain: self.smarthome[i].ain||false,
            unit: self.smarthome[i].unit=='fahrenheit'?1:0,
            //heatValue: self.smarthome[i].heatValue||5,
            //coolValue: self.smarthome[i].coolValue||5,
            //tempSensor: self.smarthome[i].tempSensor||false,
            devices: devices
          };
          smartHomeArray.push(i+' Temperature');
          new smartHomeAccessory(self,options,options.accType,true);
          for(const l in self.accessories){
            if(self.accessories[l].context.type == 'smarthome'){
              self.refreshSmartHome(self.accessories[l]);
            }
          }
        }
        if(!tempSensor){
          for(const j in self.accessories){
            if(self.accessories[j].context.type == 'smarthome'&&self.accessories[j].context.accType=='temp'&&self.accessories[j].displayName == i+' Temperature'){
              self.removeAccessory(self.accessories[j]);
            }
          }
        }  
        if(!skipSmartHome){
          let options = {
            name: i,
            type: 'smarthome',
            accType: self.smarthome[i].type||false,
            ain: self.smarthome[i].ain||false,
            unit: self.smarthome[i].unit=='fahrenheit'?1:0,
            heatValue: self.smarthome[i].heatValue||5,
            coolValue: self.smarthome[i].coolValue||5,
            tempSensor: self.smarthome[i].tempSensor||false,
            devices: devices
          };
          smartHomeArray.push(i);
          new smartHomeAccessory(self,options,options.accType,true);
          for(const l in self.accessories){
            if(self.accessories[l].context.type == 'smarthome'){
              self.refreshSmartHome(self.accessories[l]);
            }
          }
        }
      }
    } else {
      //Removeall
      for(const i in self.accessories){
        if(self.accessories[i].context.type == 'smarthome'){
          self.removeAccessory(self.accessories[i]);
        }
      }
    }
       
    //Presence
    var skipPresence, skipAnyone;
    let presenceArray = [];
    if(Object.keys(self.presence).length){
      skipAnyone = false;
      for(const i in self.presence){
        if(self.validIP.test(self.presence[i])||self.validMAC.test(self.presence[i])){
          let presence = self.presence[i];
          skipPresence = false;
          for(const l in self.accessories){
            if(self.accessories[l].context.type == 'presence' && self.accessories[l].displayName==i){
              presenceArray.push(i);
              skipPresence = true;
              self.configurePresence(self.accessories[l],true);
            }
          }
          if(!skipPresence){
            let options = {
              name: i,
              type: 'presence',
              adresse: presence,
              devices: devices
            };
            presenceArray.push(i);
            new presAccessory(self,options,true);
            for(const l in self.accessories){
              if(self.accessories[l].context.type == 'presence'){
                self.refreshPresence(self.accessories[l]);
              }
            }
          }
        } else {
          self.logger.warn('No valid IP/MAC adresse for ' + i + '! Skipping...');
        }
      }
      for(const o in self.accessories){
        if(self.accessories[o].context.type == 'presence' && self.accessories[o].displayName=='Anyone'){
          skipAnyone = true;
          presenceArray.push('Anyone');
          self.configurePresence(self.accessories[o],true);
        }
      }
      if(!skipAnyone&&self.anyone){
        let anyoneOptions = {
          name: 'Anyone',
          type: 'presence',
          adresse: '0.0.0.0',
          devices: devices
        };
        //Anyone
        presenceArray.push('Anyone');
        new presAccessory(self,anyoneOptions,true);
      }
      if(!self.anyone){
        for(const i in self.accessories){
          if(self.accessories[i].context.type == 'presence'&&self.accessories[i].displayName == 'Anyone'){
            self.removeAccessory(self.accessories[i]);
          }
        }
      }
    } else {
      //Removeall
      for(const i in self.accessories){
        if(self.accessories[i].context.type == 'presence'){
          self.removeAccessory(self.accessories[i]);
        }
      }
    }
    
    //WOL
    var skipWol;
    let wolArray = [];
    if(Object.keys(self.wol).length){
      for(const i in self.wol){
        if(self.validMAC.test(self.wol[i])){
          let wol = self.wol[i];
          skipWol = false;
          for(const l in self.accessories){
            if(self.accessories[l].context.type == 'wol' && self.accessories[l].displayName==i){
              wolArray.push(i);
              skipWol = true;
              self.configureWOL(self.accessories[l],true);
            }                   
          }
          if(!skipWol){
            let options = {
              name: i,
              type: 'wol',
              adresse: wol,
              devices: devices
            };
            wolArray.push(i);
            new wolAccessory(self,options,true);
          }          
        } else {        
          self.logger.warn('No valid MAC adresse for ' + i + '! Skipping...');      
        }
      }
    } else {
      //Removeall
      for(const i in self.accessories){
        if(self.accessories[i].context.type == 'wol'){
          self.removeAccessory(self.accessories[i]);
        }
      }
    }    
    if(Object.keys(self.callmonitor).length&&self.callmonitor.active){
      self.cm(devices);
    } else {
      for (const i in this.accessories) {
        if (this.accessories[i].context.type == 'callmonitor') {
          this.removeAccessory(this.accessories[i]);
        }
      }
    }
    
    //Base Remove
    
    //SmartHome
    if(!smartHomeArray.length){
      for(const i in self.accessories){
        if(self.accessories[i].context.type == 'smarthome'){
          self.removeAccessory(self.accessories[i]);
        }
      }
    } else {
      for(const i in self.accessories){
        if(self.accessories[i].context.type == 'smarthome'){
          if(!smartHomeArray.includes(self.accessories[i].displayName)){
            self.removeAccessory(self.accessories[i]);
          }
        }
      }
    }
    
    //Presences
    if(!presenceArray.length){
      for(const i in self.accessories){
        if(self.accessories[i].context.type == 'presence'){
          self.removeAccessory(self.accessories[i]);
        }
      }
    } else {
      for(const i in self.accessories){
        if(self.accessories[i].context.type == 'presence'){
          if(!presenceArray.includes(self.accessories[i].displayName)){
            self.removeAccessory(self.accessories[i]);
          }
        }
      }
    }
   
    //Boxes
    if(!boxArray.length){
      for(const i in self.accessories){
        if(self.accessories[i].context.type == 'box'){
          self.removeAccessory(self.accessories[i]);
        }
      }
    } else {
      for(const i in self.accessories){
        if(self.accessories[i].context.type == 'box'){
          if(!boxArray.includes(self.accessories[i].displayName)){
            self.removeAccessory(self.accessories[i]);
          } 
        }
      }
    }
    
    //WOL
    if(!wolArray.length){
      for(const i in self.accessories){
        if(self.accessories[i].context.type == 'wol'){
          self.removeAccessory(self.accessories[i]);
        }
      }
    } else {
      for(const i in self.accessories){
        if(self.accessories[i].context.type == 'wol'){
          if(!wolArray.includes(self.accessories[i].displayName)){
            self.removeAccessory(self.accessories[i]);
          } 
        }
      }
    }
  },
  
  cm: function(devices){
    const self = this;
    self.client = net.createConnection(self.callmonitor.port, self.callmonitor.ip, function(){
      self.logger.initinfo('Callmonitor connection established with ' + self.callmonitor.ip + ':' + self.callmonitor.port);     
      let skipCallmonitor = false;        
      for (const j in self.accessories) {
        if (self.accessories[j].context.type == 'callmonitor') {
          skipCallmonitor = true;
          self.configureCallmonitor(self.accessories[j],true);
        }
      }        
      if (!skipCallmonitor) {
        let cmArray = [];
        let incoming = {
          name: 'Callmonitor Incoming',
          type: 'callmonitor',
          model: 'Incoming sensor',
          config: self.callmonitor,
          client: self.client,
          incomingTo: self.callmonitor.incomingTo||false,
          outgoingFrom: self.callmonitor.outgoingFrom||false,
          devices: devices
        };
        cmArray.push(incoming);
        let outgoing = {
          name: 'Callmonitor Outgoing',
          type: 'callmonitor',
          model: 'Outgoing sensor',
          config: self.callmonitor,
          client: self.client,
          incomingTo: self.callmonitor.incomingTo||false,
          outgoingFrom: self.callmonitor.outgoingFrom||false,
          devices: devices
        };
        cmArray.push(outgoing);
        for(const cms in cmArray){
          new callAccessory(self, cmArray[cms], true);
        }
      }
    });
    self.client.on('error', error => {
      self.logger.errorinfo('An error occured by connecting to callmonitor!');
      if(error.errno == 'ECONNREFUSED'||error.code == 'ECONNREFUSED'){
        self.logger.warninfo('Can not connect to ' + self.callmonitor.ip + ':' + self.callmonitor.port + ' - Dial #96*5* to enable port 1012');
      } else if (error.errno == 'EHOSTUNREACH'||error.code == 'EHOSTUNREACH') {
        self.logger.warninfo('Can not connect to ' + self.callmonitor.ip + ':' + self.callmonitor.port + ' - IP address seems to be wrong!');
      } else if(error.errno == 'ENETUNREACH') {
        self.logger.warninfo('Network currently not reachable!');
      } else {
        self.logger.errorinfo(JSON.stringlockify(error,null,4));
      }
      self.logger.info('Trying again in 30 seconds..');
      setTimeout(function(){self.cm(devices);},30000);
    });
    self.client.on('end', () => {
      self.logger.warninfo('Callmonitor connection were closed!');
    });
  },
  
  //Telegram

  sendTelegram: function(token,chatID,text){
    const self = this;
    request.post('https://api.telegram.org/bot' + token + '/sendMessage',{body:{'chat_id': chatID,'text': text},json:true}, function(error, response, body){
      if (!error && (response.statusCode == 200 || response.statusCode == 303)){
        self.logger.debug('Successfully send telegram notification!');
      } else {
        self.logger.errorinfo('An error occured by sending telegram notification!');
        let showError = {
          error: error?error.errno:response.statusMessage,
          errorCode: error?error.code:response.statusCode
        };
        self.logger.errorinfo(JSON.stringlockify(showError,null,4));
      }
    });
  },
  
  //Configure
  
  refreshSmartHome(accessory){
    const self = this;
    if(self.smartDevices){
      for(const i in self.smartDevices){
        switch(accessory.context.accType){
          case 'temp':
            if(i.includes(accessory.context.ain)&&self.smartDevices[i].temperature&&(self.smartDevices[i].present==='1'||self.smartDevices[i].present===1)){
              accessory.context.unit===0?accessory.context.lastTemp = self.smartDevices[i].temperature.celsius/10:accessory.context.lastTemp = self.smartDevices[i].temperature.fahrenheit/10;
              accessory.getService(Service.TemperatureSensor).getCharacteristic(Characteristic.CurrentTemperature).updateValue(accessory.context.lastTemp);
            }
            break;
          case 'switch':
            if(i.includes(accessory.context.ain)&&self.smartDevices[i].switch&&(self.smartDevices[i].present==='1'||self.smartDevices[i].present===1)){
              if(self.smartDevices[i].switch.state==='1'||self.smartDevices[i].switch.state===1){
                accessory.context.lastSwitchState = true;
              } else {
                accessory.context.lastSwitchState = false;
              }
              if(accessory.context.lastlastSwitchState!==accessory.context.lastSwitchState){
                accessory.context.lastlastSwitchState = accessory.context.lastSwitchState;
                accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(accessory.context.lastSwitchState);
              } else if(accessory.context.newState===accessory.context.lastSwitchState){
                accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(accessory.context.lastSwitchState);
              }
            }           
            break;
          case 'contact':
            if(i.includes(accessory.context.ain)&&self.smartDevices[i].alert&&(self.smartDevices[i].present==='1'||self.smartDevices[i].present===1)){
              if(self.smartDevices[i].alert.state==='1'||self.smartDevices[i].alert.state===1){
                accessory.context.lastSensorState = 1;
              } else {
                accessory.context.lastSensorState = 0;
              }
              accessory.getService(Service.ContactSensor).getCharacteristic(Characteristic.ContactSensorState).updateValue(accessory.context.lastSensorState);
            }
            break;
          case 'thermo':
            if(i.includes(accessory.context.ain)&&self.smartDevices[i].hkr&&(self.smartDevices[i].present==='1'||self.smartDevices[i].present===1)){
              accessory.context.unit===0?accessory.context.lastThermoCurrentTemp = self.smartDevices[i].temperature.celsius/10:accessory.context.lastThermoCurrentTemp = self.smartDevices[i].temperature.fahrenheit/10;
              accessory.context.lastThermoTargetTemp = self.smartDevices[i].hkr.tsoll/2;
              accessory.context.batteryLevel = self.smartDevices[i].hkr.battery;
              accessory.context.batteryStatus = self.smartDevices[i].hkr.batterylow;
              
              if((accessory.context.lastThermoTargetTemp*2)===253){
                accessory.context.lastThermoTargetTemp = accessory.context.lastThermoCurrentTemp;
                accessory.context.lastThermoCurrentState = 0;
                accessory.context.lastThermoTargetState = 0;
              } else {
                if(accessory.context.lastThermoCurrentTemp<=accessory.context.lastThermoTargetTemp){
                  accessory.context.lastThermoCurrentState = 1;
                  accessory.context.lastThermoTargetState = 1;
                } else {
                  accessory.context.lastThermoCurrentState = 2;
                  accessory.context.lastThermoTargetState = 2;
                }
              }
              
              if(accessory.context.lastlastState!==accessory.context.lastThermoTargetState){
                accessory.context.lastlastState = accessory.context.lastThermoTargetState;
                accessory.getService(Service.Thermostat).getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(accessory.context.lastThermoTargetState);
              } else if(accessory.context.newState===accessory.context.lastThermoTargetState){
                accessory.getService(Service.Thermostat).getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(accessory.context.lastThermoTargetState);
              }
              
              if(accessory.context.lastlastCurrState!==accessory.context.lastThermoCurrentState){
                accessory.context.lastlastCurrState = accessory.context.lastThermoCurrentState;
                accessory.getService(Service.Thermostat).getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(accessory.context.lastThermoCurrentState);
              } else if(accessory.context.newCurrState===accessory.context.lastThermoCurrentState){
                accessory.getService(Service.Thermostat).getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(accessory.context.lastThermoCurrentState);
              }
              
              if(accessory.context.lastlastTarTemp!==accessory.context.lastThermoTargetTemp){
                accessory.context.lastlastTarTemp = accessory.context.lastThermoTargetTemp;
                accessory.getService(Service.Thermostat).getCharacteristic(Characteristic.TargetTemperature).updateValue(accessory.context.lastThermoTargetTemp);
              } else if(accessory.context.newTarTemp===accessory.context.lastThermoCurrentState){
                accessory.getService(Service.Thermostat).getCharacteristic(Characteristic.TargetTemperature).updateValue(accessory.context.lastThermoTargetTemp);
              }
              accessory.getService(Service.Thermostat).getCharacteristic(Characteristic.CurrentTemperature).updateValue(accessory.context.lastThermoCurrentTemp);
              accessory.getService(Service.BatteryService).getCharacteristic(Characteristic.BatteryLevel).updateValue(accessory.context.batteryLevel);
              accessory.getService(Service.BatteryService).getCharacteristic(Characteristic.StatusLowBattery).updateValue(accessory.context.batteryStatus);
            }
            break;
          default:
            // err
        }
        
      }
      setTimeout(function(){
        self.refreshSmartHome(accessory);
      }, 2000);
    } else {
      setTimeout(function(){
        self.refreshSmartHome(accessory);
      }, 1000);
    }
  },
  
  refreshPresence(accessory){
    const self = this;
    if(self.hosts){
      let macip;
      let array = [];
      let states = [];
      for(const i in self.hosts){
        self.validMAC.test(accessory.context.adresse)?macip = self.hosts[i].MACAddress:macip = self.hosts[i].IPAddress;
        if(macip==accessory.context.adresse){
          array.push(self.hosts[i]);
        }
      }
      for(const j in array){
        if(array[j].Active==='1'||array[j].Active===1){
          accessory.context.hostname = array[0].HostName;
          accessory.context.ipmac = self.validMAC.test(accessory.context.adresse)?array[0].IPAddress:array[0].MACAddress;
          accessory.context.newState = 1;
          states.push(1);
        } else {
          accessory.context.hostname = array[0].HostName;
          accessory.context.ipmac = self.validMAC.test(accessory.context.adresse)?array[0].IPAddress:array[0].MACAddress;
          accessory.context.newState = 0;
          states.push(0);
        }
      }
      if(states.includes(1)&&states.includes(0)&&!self.warn){
        self.logger.warn('The host list includes two different states (connected/disconnected) state from device! Set - \'mesh\':true - and - \'master\': true - for your main router in config.json!');
        self.warn = true;
      }
      setTimeout(function(){
        self.refreshPresence(accessory);
      }, 1000);
    } else {
      setTimeout(function(){
        self.refreshPresence(accessory);
      }, 1000);
    }
  },
  
  configurePresence: function(accessory, conf){
    const self = this;
    accessory.context.type = 'presence';
    for(const i in self.presence){
      if(accessory.displayName == i){
        accessory.context.adresse = self.presence[i];
      }
    }
    self.accessories[accessory.displayName] = accessory;
    if(conf){
      accessory.context.devices = self.deviceArray;
      accessory.context.newState = undefined;
      self.logger.info('Configuring accessory: ' + accessory.displayName);
      if(accessory.displayName!='Anyone')self.refreshPresence(accessory);
      new presAccessory(self, accessory, false);
    }
  },
  
  configureDevice: function(accessory, conf){
    const self = this;
    accessory.context.type = 'box';
    for(const i in self.devices){
      if(accessory.displayName == i){
        accessory.context.boxType = self.devices[i].type||'dsl';
        accessory.context.wifi2 = self.devices[i].wifi2||false;
        accessory.context.wifi5 = self.devices[i].wifi5||false;
        accessory.context.wifiGuest = self.devices[i].wifiGuest||false;
        accessory.context.wps = self.devices[i].wps||false;
        accessory.context.led = self.devices[i].led||false;
        accessory.context.beta = self.devices[i].beta||false;
        accessory.context.master = self.devices[i].master||false;
        accessory.context.mesh = self.devices[i].mesh||false;
        if(self.devices[i].master)accessory.context.phoneBook = self.devices[i].phoneBook||false;
        if(self.devices[i].master)accessory.context.aw = self.devices[i].aw||false;
        if(self.devices[i].master)accessory.context.deflection = self.devices[i].deflection||false;
        if(self.devices[i].master)accessory.context.alarm = (Object.keys(self.alarm).length&&self.alarm.active)?self.alarm:false;
        if(self.devices[i].master)accessory.context.wakeup = (Object.keys(self.wakeup).length&&self.wakeup.active)?self.wakeup:false;
        if(self.devices[i].master)accessory.context.ringlock = (Object.keys(self.ringlock).length&&self.ringlock.active)?self.ringlock:false;
        if(self.devices[i].master)accessory.context.mesh = self.devices[i].mesh||false;
        if(self.devices[i].master)accessory.context.broadband = (Object.keys(self.broadband).length&&self.broadband.active)?self.broadband:false;
        if(self.devices[i].master)accessory.context.extReboot = (Object.keys(self.extReboot).length&&self.extReboot.active)?self.extReboot:false;
        if(self.devices[i].type=='dsl'||self.devices[i].type=='cable')accessory.context.lock = self.devices[i].lock||false;
      }
    }
    self.accessories[accessory.displayName] = accessory;
    if(conf){
      accessory.context.devices = self.deviceArray;
      self.logger.info('Configuring accessory: ' + accessory.displayName);
      new boxAccessory(self, accessory, false);
    }
  },
  
  configureSmartHome: function(accessory, conf){
    const self = this;
    accessory.context.type = 'smarthome';
    for(const i in self.smarthome){
      if(accessory.displayName == i){
        accessory.context.ain = self.smarthome[i].ain||false;
        accessory.context.accType = self.smarthome[i].type||false;
        accessory.context.unit = self.smarthome[i].unit=='fahrenheit'?1:0;
        accessory.context.heatValue = self.smarthome[i].heatValue||5;
        accessory.context.coolValue = self.smarthome[i].coolValue||5;
        accessory.context.tempSensor = self.smarthome[i].tempSensor||false;
        !accessory.context.timesOpened?accessory.context.timesOpened=0:accessory.context.timesOpened;
        !accessory.context.lastActivation?accessory.context.lastActivation=0:accessory.context.lastActivation;
        !accessory.context.closeDuration?accessory.context.closeDuration=0:accessory.context.closeDuration;
        !accessory.context.openDuration?accessory.context.openDuration=0:accessory.context.openDuration;
      }
    }
    self.accessories[accessory.displayName] = accessory;
    if(conf){
      accessory.context.devices = self.deviceArray;
      self.logger.info('Configuring accessory: ' + accessory.displayName);
      self.refreshSmartHome(accessory);
      new smartHomeAccessory(self, accessory, accessory.context.accType, false);
    }
  },
  
  configureWOL: function(accessory, conf){
    const self = this;
    accessory.context.type = 'wol';
    for(const i in self.wol){
      if(accessory.displayName == i){
        accessory.context.adresse = self.wol[i];
      }
    }
    self.accessories[accessory.displayName] = accessory;
    if(conf){
      accessory.context.devices = self.deviceArray;
      self.logger.info('Configuring accessory: ' + accessory.displayName);
      new wolAccessory(self, accessory, false);
    }
  },
  
  configureCallmonitor: function(accessory,conf){
    const self = this;
    accessory.context.type = 'callmonitor';
    accessory.context.active = self.callmonitor.active;
    accessory.context.ip = self.callmonitor.ip;
    accessory.context.port = self.callmonitor.port;
    accessory.context.config = self.callmonitor;
    accessory.context.incomingTo = self.callmonitor.incomingTo;
    accessory.context.outgoingFrom = self.callmonitor.outgoingFrom;
    !accessory.context.timesOpened?accessory.context.timesOpened=0:accessory.context.timesOpened;
    !accessory.context.lastActivation?accessory.context.lastActivation=0:accessory.context.lastActivation;
    !accessory.context.closeDuration?accessory.context.closeDuration=0:accessory.context.closeDuration;
    !accessory.context.openDuration?accessory.context.openDuration=0:accessory.context.openDuration;
    !accessory.context.caller?accessory.context.caller='No entry':accessory.context.caller;
    !accessory.context.called?accessory.context.called='No entry':accessory.context.called;
    self.accessories[accessory.displayName] = accessory;
    if(conf){
      accessory.context.devices = self.deviceArray;
      self.logger.info('Configuring accessory: ' + accessory.displayName);
      new callAccessory(self, accessory, false);
    }
  },
  
  configureAccessory: function(accessory){
    const self = this;
    let conf=false;
    accessory.reachable = true;
    accessory.context.polling = self.polling;
    accessory.context.stopPolling = false;
    accessory.context.delay = self.delay;
    accessory.context.telegram = (Object.keys(self.telegram).length&&self.telegram.active)?self.telegram:false;
    if(accessory.context.type == 'presence'){
      self.configurePresence(accessory,conf);
    }
    if(accessory.context.type == 'wol'){
      self.configureWOL(accessory,conf);
    }
    if(accessory.context.type == 'box'){
      self.configureDevice(accessory,conf);
    }
    if(accessory.context.type == 'callmonitor'){
      self.configureCallmonitor(accessory,conf);
    }
    if(accessory.context.type == 'smarthome'){
      self.configureSmartHome(accessory,conf);
    }
  },

  removeAccessory: function (accessory) {
    if (accessory) {
      this.logger.warninfo('Removing accessory: ' + accessory.displayName + '. No longer configured.');
      this.api.unregisterPlatformAccessories(pluginName, platformName, [accessory]);
      delete this.accessories[accessory.displayName];
    }
  }

};
