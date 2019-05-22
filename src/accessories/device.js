'use strict';

const HomeKitTypes = require('../types/types.js');
const api = require('../../lib/TR064.js');
const ccodes = require('../../lib/ccodes.js');
const Inspector = require('../../handler/DeviceHandler.js');
const LUA = require('../../lib/LUA.js');

const https = require('https');
const axios = require('axios');
const parseString = require('xml2js').parseString;
const moment = require('moment');
const compareVersions = require('compare-versions');
const speedTest = require('speedtest-net');
const exec = require('child_process').exec;
const store = require('json-fs-store');

const c = new ccodes.CODES();

var Characteristic;

class DeviceAccessory {
  constructor (platform, accessory, device) {

    Characteristic = platform.api.hap.Characteristic;    
    HomeKitTypes.registerWith(platform.api.hap);

    this.platform = platform;
    this.log = platform.log;
    this.logger = platform.logger;
    this.debug = platform.debug;
    this.api = platform.api;
    this.config = platform.config;
    this.accessories = platform.accessories;
    this.telegram = platform.telegram;
    this.validMAC = platform.validMAC;
    this.validIP = platform.validIP;
    this.configPath = platform.configPath;
    this.telegram = platform.telegram;    
    this.sid = platform.sid;
    
    this.accessory = accessory;
    
    if(device){
    
      this.logger.info(this.accessory.displayName + ': Successfully logged in!');
    
      this.device = device;
      this.getFirmware();
    
    } else {
    
      this.initAPI();
    
    }

  }
  
  async initAPI(){
  
    try {
  
      this.logger.info(this.accessory.displayName + ': Initializing API');
    
      this.TR064 = new api.TR064(this.accessory.context, this.logger);
        
      let TR064 = await this.TR064.initDevice();
      
      this.device = await TR064.startEncryptedCommunication();
      
      this.logger.info(this.accessory.displayName + ': Successfully logged in!');
      
      this.getFirmware();
    
    } catch(err) {
    
      this.logger.error(this.accessory.displayName + ': An error occured while initializing API!');
      this.logger.error(this.accessory.displayName + ': Please check your credentials and try again with restarting homebridge!');

      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }
    
    }
  
  }
  
  async getFirmware(){
  
    try {
    
      let fw = this.device.services['urn:dslforum-org:service:UserInterface:1'];      
      fw = await fw.actions['X_AVM-DE_GetInfo']();
      
      fw = fw['NewX_AVM-DE_CurrentFwVersion'].split('-')[0].split('.'); 
      fw[0] = '1';
      
      this.fw = fw.toString().replace(/,/g,'.');
      
      if(compareVersions(this.fw, '1.07.08') < 0){
        
        this.accessory.context.oldFW = true;
     
      } else {
       
        this.accessory.context.oldFW = false;
     
      }
      
      this.getService();
    
    } catch(err){
    
      this.logger.error(this.accessory.displayName + ': An error occured while checking firmware!');

      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }
    
    }
  
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  async getService(){
  
    this.lua = new LUA(this.platform, this.accessory.context, this.sid);
  
    try {
    
      this.debug(this.accessory.displayName + ': Inspecting Characteristics and Services...');
    
      let inspector = new Inspector(this.platform, this.accessory, this.device);
      this.mainService = await inspector.inspectCharacteristics();
      
      this.debug(this.accessory.displayName + ': Inspecting Characteristics and Services finished!');
      
      if(!this.accessory.context.readOnly || (this.accessory.context.extras && this.accessory.context.extras.extReboot))
        this.mainService.getCharacteristic(Characteristic.On)
          .on('set', this.setState.bind(this));
      
      if((!Array.isArray(this.accessory.context.options.wifi2) && this.accessory.context.options.wifi2) || 
      (Array.isArray(this.accessory.context.options.wifi2) && this.accessory.context.options.wifi2[0]))
        this.mainService.getCharacteristic(Characteristic.WifiTwo)
          .on('set', this.setWifi.bind(this, 1))
          .on('get', this.getWifi.bind(this, 1));
          
      if((!Array.isArray(this.accessory.context.options.wifi5) && this.accessory.context.options.wifi5) || 
      (Array.isArray(this.accessory.context.options.wifi5) && this.accessory.context.options.wifi5[0]) && 
      this.device.services['urn:dslforum-org:service:WLANConfiguration:3']){
      
        this.mainService.getCharacteristic(Characteristic.WifiFive)
          .on('set', this.setWifi.bind(this, 2))
          .on('get', this.getWifi.bind(this, 2));
      
      }
          
      if((!Array.isArray(this.accessory.context.options.wifiGuest) && this.accessory.context.options.wifiGuest) || 
      (Array.isArray(this.accessory.context.options.wifiGuest) && this.accessory.context.options.wifiGuest[0])){
      
        let type = this.device.services['urn:dslforum-org:service:WLANConfiguration:3'] ? 3 : 2;
      
        this.mainService.getCharacteristic(Characteristic.WifiGuest)
          .on('set', this.setWifi.bind(this, type))
          .on('get', this.getWifi.bind(this, type));
      
      }
          
      if((!Array.isArray(this.accessory.context.options.wps) && this.accessory.context.options.wps) || 
      (Array.isArray(this.accessory.context.options.wps) && this.accessory.context.options.wps[0]))
        this.mainService.getCharacteristic(Characteristic.WifiWPS)
          .on('set', this.setWPS.bind(this))
          .on('get', this.getWPS.bind(this));
          
      if((!Array.isArray(this.accessory.context.options.led) && this.accessory.context.options.led) || 
      (Array.isArray(this.accessory.context.options.led) && this.accessory.context.options.led[0]))
        this.mainService.getCharacteristic(Characteristic.DeviceLED)
          .on('set', this.setDeviceLED.bind(this))
          .on('get', this.getDeviceLED.bind(this));
          
      if(this.accessory.context.type !== 'repeater'){          
       
        this.mainService.getCharacteristic(Characteristic.IPAdd)
          .on('get', this.getIP.bind(this));
       
        if(this.accessory.context.options.reconnect)
          this.mainService.getCharacteristic(Characteristic.Reconnect)
            .on('set', this.setReconnect.bind(this))
            .on('get', callback => callback(null, false))
            .updateValue(false);
      
      }
          
      if(this.accessory.context.master){
      
        if(this.accessory.context.extras.phoneBook){
          
          this.mainService.getCharacteristic(Characteristic.PhoneBook)
            .on('set', this.setPhoneBook.bind(this))
            .on('get', callback => callback(null, false))
            .updateValue(false);
            
          this.mainService.getCharacteristic(Characteristic.PhoneBook)
            .setValue(true);
            
        }
      
        if((!Array.isArray(this.accessory.context.options.lock) && this.accessory.context.options.lock) || 
        (Array.isArray(this.accessory.context.options.lock) && this.accessory.context.options.lock[0]))
          this.mainService.getCharacteristic(Characteristic.DeviceLock)
            .on('set', this.setDeviceLock.bind(this))
            .on('get', this.getDeviceLock.bind(this));
            
        if((!Array.isArray(this.accessory.context.options.aw) && this.accessory.context.options.aw) || 
        (Array.isArray(this.accessory.context.options.aw) && this.accessory.context.options.aw[0]))
          this.mainService.getCharacteristic(Characteristic.AnsweringMachine)
            .on('set', this.setAW.bind(this))
            .on('get', this.getAW.bind(this));
            
        if(this.accessory.context.extras.ringlock)
          this.mainService.getCharacteristic(Characteristic.RingLock)
            .on('set', this.setRingLock.bind(this))
            .on('get', this.getRingLock.bind(this));
            
        if(this.accessory.context.extras.alarm)
          this.mainService.getCharacteristic(Characteristic.DialAlarm)
            .on('set', this.setAlarm.bind(this))
            .on('get', callback => callback(null, false))
            .updateValue(false);
            
        if((!Array.isArray(this.accessory.context.options.deflection) && this.accessory.context.options.deflection) || 
        (Array.isArray(this.accessory.context.options.deflection) && this.accessory.context.options.deflection[0]))
          this.mainService.getCharacteristic(Characteristic.Deflection)
            .on('set', this.setDeflection.bind(this))
            .on('get', this.getDeflection.bind(this));
            
        if(this.accessory.context.extras.wakeup)
          this.mainService.getCharacteristic(Characteristic.WakeUp)
            .on('set', this.setWakeUp.bind(this))
            .on('get', callback => callback(null, false))
            .updateValue(false);
            
        if(this.accessory.context.extras.broadband)       
          this.mainService.getCharacteristic(Characteristic.Download)
            .on('get', this.getBroadband.bind(this));

      }
      
      this.getState();
    
    } catch(err) {
    
      this.logger.info(this.accessory.displayName + ': An error occured while initializing accessory services and characteristics!');

      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }
    
    }

  }
  
  async getState(){
  
    let state;
    let states = [];
  
    try {
    
      if(this.accessory.context.type === 'dsl'){
      
        let status = this.device.services['urn:dslforum-org:service:WANPPPConnection:1']; 
          
        status = await status.actions.GetInfo();
        
        state = status.NewConnectionStatus === 'Connected' ? true : false;
      
      } else if(this.accessory.context.type === 'cable'){
      
        let status = this.device.services['urn:dslforum-org:service:WANIPConnection:1']; 
          
        status = await status.actions.GetInfo();
        
        state = status.NewConnectionStatus === 'Connected' ? true : false;
      
      } else { //repeater
      
        let wifi = this.device.services['urn:dslforum-org:service:WLANConfiguration:1'];         
        wifi = await wifi.actions.GetInfo();
        
        states.push(parseInt(wifi.NewEnable));
        
        if(this.device.services['urn:dslforum-org:service:WLANConfiguration:3']){
        
          let wifi2 = this.device.services['urn:dslforum-org:service:WLANConfiguration:2'];         
          wifi2 = await wifi2.actions.GetInfo();
          
          states.push(parseInt(wifi2.NewEnable));
        
        }
        
        state = states.includes(1) ? true : false;
          
      
      }  

    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while getting state of device!');

      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      setTimeout(this.getState.bind(this), this.accessory.context.polling);
      
      this.mainService.getCharacteristic(Characteristic.On)
        .updateValue(state);
   
    }
  
  }
  
  async setState(state,callback){
  
    try {
    
      let status = this.device.services['urn:dslforum-org:service:DeviceConfig:1'];

      if(!(this.accessory.context.extras && this.accessory.context.extras.extReboot)){
        
        this.logger.info(this.accessory.displayName + ': Start Reboot'); 
        
        await status.actions.Reboot();

      } else {
      
        await this.initReboot(this.accessory.context.extras.extReboot.cmdOn);
        
        this.logger.info(this.accessory.displayName + ': Start successfully initialized.');
        this.logger.info(this.accessory.displayName + ': All homebridge instances were stopped! Preparing for reboot...');
          
        if(this.telegram){
                
          if(this.telegram.checkTelegram('extReboot', 'start')){
                  
            this.telegram.sendTelegram('extReboot', 'start');
                    
          }
                
        }
          
        setTimeout( async () => {
          
          try {
          
            await this.initReboot(this.accessory.context.extras.extReboot.cmdOff);
              
            this.logger.info(this.accessory.displayName + ': All homebridge instances were restarted!');
            
            if(this.telegram){
                    
              if(this.telegram.checkTelegram('extReboot', 'finish')){
                      
                this.telegram.sendTelegram('extReboot', 'finish');
                        
              }
                    
            }
          
          } catch(err){
          
            this.logger.info(this.accessory.displayName + ': An error occured during finishing restart process!');

            if(err instanceof TypeError){
              console.log(err);
            } else {
              this.debug(err);
            }
          
          }
          
        }, 5 * 60 * 1000);
        
        this.logger.info(this.accessory.displayName + ': Homebridge instances will be restarted automatically in 5 minutes!');
        this.logger.info(this.accessory.displayName + ': Rebooting...'); 
            
        await status.actions.Reboot();
      
      }
        
    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while setting new device state!');

      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      callback(); 
   
    }

  }
  
  initReboot(file){
  
    return new Promise((resolve, reject) => {
      
      exec(file, (error, stdout, stderr) => {
        
        if(error && error.code > 0) return reject('Error with CMD: ' + error.cmd);
        if(stderr) return reject(stderr);

        resolve(true);
     
      });
    
    });
  
  }
  
  async setPhoneBook(state,callback){
  
    if(!state)
      return callback();
  
    let telBook = {
      id:'phonebook',
      phonebook: []
    };
    
    let blackBook = {
      id:'blackbook',
      phonebook: []
    };
  
    let country = ( this.config.callmonitor && this.config.callmonitor.country ) ? this.config.callmonitor.country : false;
  
    try {

      let phonebook = this.device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1'];
      
      let books = await phonebook.actions.GetPhonebookList();
      books = books.NewPhonebookList.split(',');
      
      if(!Array.isArray(books))
        books = [books];
      
      this.logger.info(this.accessory.displayName + ':Found ' + books.length + ' book(s). Fetching entries...');
      
      for(const id of books){
      
        let bookUrl = await phonebook.actions.GetPhonebook([{name:'NewPhonebookID',value:id}]);
        let bookName = bookUrl.NewPhonebookName;

        let opt = {
          url: bookUrl.NewPhonebookURL,
          method: 'GET',
          httpsAgent: new https.Agent({
            rejectUnauthorized: false
          })
        };
        
        let body = await axios(opt);
        let data = await this.xml2json(body.data);
        
        let contacts = data.phonebooks.phonebook[0].contact;
        
        if(contacts){
                
          for(const contact of contacts){
        
            let numbers = contact.telephony ? contact.telephony[0].number : false;
          
            if(numbers){
                  
              if(numbers.length){
                   
                for(const number of numbers){
            
                  let telnr = number._;
              
                  telnr = telnr.replace(/\s/g, '');
                  
                  if(country){      
                  
                    let nr = '+' + c.getCode(country);
                    let nr2 = '00' + c.getCode(country);
                  
                    if(telnr.includes(nr) || telnr.includes(nr2)){
                  
                      telnr = telnr.replace(nr, '0').replace(nr2, '0').replace(/[^a-zA-Z0-9]/g,'');
               
                    } else {
                  
                      telnr = telnr.replace('+', '00').replace(/[^a-zA-Z0-9]/g,'');
                
                    }
                
                  } else {
                
                    telnr = telnr.replace('+', '00').replace(/[^a-zA-Z0-9]/g,'');
                
                  }
                
                  telBook.phonebook.push({name: contact.person[0].realName[0],number:telnr});

                  if(this.accessory.context.extras.phoneBook.blacklist === bookName)
                    blackBook.phonebook.push({name: contact.person[0].realName[0],number:telnr});

                }
            
              } else {
              
                let nr = '+' + c.getCode(country);
                let nr2 = '00' + c.getCode(country);
                let telnr = numbers._;
            
                telnr = telnr.replace(/\s/g, '');
                    
                if(telnr.includes(nr) || telnr.includes(nr2)){
                
                  telnr = telnr.replace(nr, '0').replace(nr2, '0').replace(/[^a-zA-Z0-9]/g,'');
              
                } else {
                
                  telnr = telnr.replace('+', '00').replace(/[^a-zA-Z0-9]/g,'');
              
                }
              
                telBook.phonebook.push({name: contact.person[0].realName[0],number:telnr});
            
                if(this.accessory.context.extras.phoneBook.blacklist === bookName)
                  blackBook.phonebook.push({name: contact.person[0].realName[0],number:telnr});
            
              }
          
            }
           
          }
        
        } else {
    
          this.debug(this.accessory.displayName + ': Phonebook [' + id + '] does not contain any contacts. Skipping..');  
    
        }
                
        this.debug(this.accessory.displayName + ': Phone book [' + id + '] done.');
      
      }
      
      this.debug(this.accessory.displayName + ': Storing result...');
      
      await this.storeData(telBook);
      
      this.debug(this.accessory.displayName + ': ' + telBook.phonebook.length + ' contacts stored in cache (' + this.configPath + '/phonebook.json)');

      if(blackBook.phonebook.length){
      
        await this.storeData(blackBook);
      
        this.debug(this.accessory.displayName + ': ' + blackBook.phonebook.length + ' contacts stored in cache (' + this.configPath + '/blackbook.json)');
      
      }

    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while fetching phonebook!');

      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      } 

    } finally {

      setTimeout(() => {

        this.mainService.getCharacteristic(Characteristic.PhoneBook)
          .updateValue(false);

      }, 500);

    }
    
    callback();

  }
  
  async getIP(callback){
  
    let state, status;
  
    try {
    
      if(this.accessory.context.type === 'dsl'){
      
        status = this.device.services['urn:dslforum-org:service:WANPPPConnection:1']; 
      
      } else {
      
        status = this.device.services['urn:dslforum-org:service:WANIPConnection:1']; 
      
      }

      let info = await status.actions.GetInfo();      
      state = info.NewExternalIPAddress;
      
    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while getting state of wifi!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      } 

    } finally {
    
      callback(null, state); 
   
    }

  }
  
  async setReconnect(state, callback){

    let status;
  
    try {
    
      if(this.accessory.context.type === 'dsl'){
      
        status = this.device.services['urn:dslforum-org:service:WANPPPConnection:1']; 
      
      } else {
      
        status = this.device.services['urn:dslforum-org:service:WANIPConnection:1']; 
      
      }
      
      if(state){
      
        this.logger.info(this.accessory.displayName + ': Reconnecting...');      
        await status.actions.ForceTermination();
      
      }
      
    } catch(err) {

      if(!(err.data && err.data.includes('DisconnectInProgress'))){
      
        this.logger.error(this.accessory.displayName + ': An error occured while reconnecting device!');
        
        if(err instanceof TypeError){
          console.log(err);
        } else {
          this.debug(err);
        }

      }

    } finally {
      
      setTimeout(() => {
      
        this.mainService.getCharacteristic(Characteristic.Reconnect)
          .updateValue(false);
      
      }, 500);
      
      callback();
   
    }
  
  }
  
  async setWifi(type,state,callback){
  
    try {

      this.logger.info(this.accessory.displayName + ': WIFI ' + type + (state ? 'On' : 'Off'));

      let wifi = this.device.services['urn:dslforum-org:service:WLANConfiguration:' + type.toString()]; 
        
      await wifi.actions.SetEnable([{name:'NewEnable', value: state ? '1' : '0'}]);

    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while setting new wifi state!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      callback(); 
   
    }

  }
  
  async getWifi(type,callback){
  
    let state;
  
    try {

      let wifi = this.device.services['urn:dslforum-org:service:WLANConfiguration:' + type.toString()]; 
        
      wifi = await wifi.actions.GetInfo();
      
      state = parseInt(wifi.NewEnable) ? true : false;     

    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while getting state of wifi!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      callback(null, state); 
   
    }

  }
  
  async setWPS(state, callback){
  
    let status = state ? 'pbc' : 'stop';
  
    try {

      this.logger.info(this.accessory.displayName + ': ' + (state ? 'WPS on for 2 minutes' : 'WPS Off'));

      let wps = this.device.services['urn:dslforum-org:service:WLANConfiguration:1']; 
              
      await wps.actions['X_AVM-DE_SetWPSConfig']([{name:'NewX_AVM-DE_WPSMode', value:status},{name:'NewX_AVM-DE_WPSClientPIN',value:''}]);
      
      if(state)
        setTimeout(() => { this.mainService.getCharacteristic(Characteristic.WifiWPS).setValue(false); }, 2 * 59 * 1000);

    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while setting new wps state!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      callback(); 
   
    }
  
  }
  
  async getWPS(callback){
  
    let state;
  
    try {

      let wps = this.device.services['urn:dslforum-org:service:WLANConfiguration:1'];         
      
      wps = await wps.actions['X_AVM-DE_GetWPSInfo']();
      
      state = wps['NewX_AVM-DE_WPSStatus'] === 'active' ? true : false;

    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while getting state of wps!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      callback(null, state); 
   
    }
  
  }
  
  async setDeviceLED(state, callback){
  
    try {
    
      this.logger.info(this.accessory.displayName + ': Device LED ' + (state ? 'On' : 'Off'));
      
      if(!this.accessory.context.oldFW){
        
        await this.lua.requestLUA({
          xhr: '1',
          led_brightness: '2',
          environment_light: 'on',
          led_display: state ? '0' : '2',
          apply: '',
          sid: false,
          page: 'led',
        }, '/data.lua', this.device);
        
      } else {
      
        await this.lua.requestLUA({
          xhr: '1',
          sid: false,
          no_sidrenew: '',
          led_display: state ? '0' : '2',
          apply: '',
          oldpage: '/system/led_display.lua'
        }, '/system/led_display.lua', this.device);
      
      }
      
    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while setting new state for device led!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      callback(); 
   
    }
  
  }
  
  async getDeviceLED(callback){
    
    let data, state;
  
    try {
    
      if(!this.accessory.context.oldFW){
      
        data = await this.lua.requestLUA({
          xhr: '1',
          xhrId: 'all',
          sid: false,
          page: 'led'
        }, '/data.lua', this.device);
        
        state = parseInt(data.data.led_display) ? false : true;
        
      } else {
      
        data = await this.lua.requestLUA({
          sid: false
        }, '/system/led_display.lua', this.device, 'led_display');
        
        state = !parseInt(data) ? true : false;
        
      }
        
    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while getting state of device led!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }
      
    } finally {
    
      callback(null, state); 
   
    }
  
  }
  
  async setDeviceLock(state, callback){
  
    try {
    
      this.logger.info(this.accessory.displayName + ': Device Lock ' + (state ? 'On' : 'Off'));
  
      await this.lua.requestLUA({
        xhr: '1',
        keylock_enabled: state ? '1' : '0',
        apply: '',
        sid: false,
        page: 'keyLo',
      }, '/data.lua', this.device);
     
    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while setting new state for device lock!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      callback(); 
   
    }
  
  }
  
  async getDeviceLock(callback){
    
    let data, state;
  
    try {
    
      data = await this.lua.requestLUA({
        xhr: '1',
        xhrId: 'all',
        sid: false,
        page: 'keyLo'
      }, '/data.lua', this.device);  
 
      state = data.data.keylock_checked || false;

    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while getting state of device lock!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      callback(null, state); 
   
    }
  
  }
  
  async setAW(state, callback){
  
    try {
  
      this.logger.info(this.accessory.displayName + ': AW ' + (state ? 'On' : 'Off'));

      let aw = this.device.services['urn:dslforum-org:service:X_AVM-DE_TAM:1']; 
        
      await aw.actions.SetEnable([{name:'NewIndex', value:'0'},{name:'NewEnable', value:state?'1':'0'}]);

    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while setting new state for answering mashine!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      callback(); 
   
    }
  
  }
  
  async getAW(callback){
    
    let state;
  
    try {
    
      let aw = this.device.services['urn:dslforum-org:service:X_AVM-DE_TAM:1'];         
      
      aw = await aw.actions.GetInfo([{name:'NewIndex',value:'0'}]);
      
      state = parseInt(aw.NewEnable) ? true : false;

    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while getting state of answering mashine!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      callback(null, state); 
   
    }
  
  }
  
  async setDeflection(state, callback){
  
    try {
  
      this.logger.info(this.accessory.displayName + ': Deflection ' + (state ? 'On' : 'Off'));

      let deflection = this.device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1']; 

      let amountDeflection = await deflection.actions.GetNumberOfDeflections();
      amountDeflection = parseInt(amountDeflection.NewNumberOfDeflections);
      
      if(amountDeflection){
  
        await deflection.actions.SetDeflectionEnable([{name:'NewDeflectionId',value:'0'}, {name:'NewEnable',value:state ? '1' : '0'}]);
      
      } else {
  
        this.logger.warn(this.accessory.displayName + ': Can not change deflection! No deflections setted up in FRITZ! settings');
  
      }

    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while setting new state for deflection');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      callback(); 
   
    }
  
  }
  
  async getDeflection(callback){
    
    let state;
  
    try {
    
      let deflection = this.device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1']; 

      let amountDeflection = await deflection.actions.GetNumberOfDeflections();
      amountDeflection = parseInt(amountDeflection.NewNumberOfDeflections);
      
      if(amountDeflection){
  
        let getDeflection = await deflection.actions.GetDeflection([{name:'NewDeflectionId',value:'0'}]);
  
        state = parseInt(getDeflection.NewEnable) ? true : false;
      
      } else {
  
        state = false;
  
      }

    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while getting state of deflection!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      callback(null, state); 
   
    }
  
  }
  
  async setWakeUp(state, callback){
  
    try {
  
      let wakeup = this.device.services['urn:dslforum-org:service:X_VoIP:1']; 
      
      if(state){
      
        this.logger.info(this.accessory.displayName + ': Wake Up - Dial (' + this.accessory.context.extras.wakeup.internNr + ')');
      
        await wakeup.actions['X_AVM-DE_DialNumber']([{name:'NewX_AVM-DE_PhoneNumber', value: this.accessory.context.extras.wakeup.internNr}]);

      } else {
      
        this.logger.info(this.accessory.displayName + ': Wake Up - Hangup (' + this.accessory.context.extras.wakeup.internNr + ')');
      
        await wakeup.actions['X_AVM-DE_DialHangup']();
      
      }
      
    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while setting new state for wake up!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      setTimeout(() => {
        
        if(this.mainService.getCharacteristic(Characteristic.WakeUp).value)
          this.mainService.getCharacteristic(Characteristic.WakeUp)
            .setValue(false);
      
      },this.accessory.context.extras.wakeup.duration * 1000);
      
      callback(); 
   
    }
  
  }
  
  async setAlarm(state, callback){
  
    try {

      let alarm = this.device.services['urn:dslforum-org:service:X_VoIP:1']; 
      
      if(state){
      
        this.logger.info(this.accessory.displayName + ': Alarm - Dial (' + this.accessory.context.extras.alarm.telNr + ')');
        
        await alarm.actions['X_AVM-DE_DialNumber']([{name:'NewX_AVM-DE_PhoneNumber', value: this.accessory.context.extras.alarm.telNr}]);
        
        if(this.telegram){
                
          if(this.telegram.checkTelegram('alarm', 'activated')){
                  
            this.telegram.sendTelegram('alarm', 'activated');
                    
          }
                
        }
     
      } else {
      
        this.logger.info(this.accessory.displayName + ': Alarm - Hangup (' + this.accessory.context.extras.alarm.telNr + ')');
      
        await alarm.actions['X_AVM-DE_DialHangup']();
        
        if(this.telegram){
                
          if(this.telegram.checkTelegram('alarm', 'deactivated')){
                  
            this.telegram.sendTelegram('alarm', 'deactivated');
                    
          }
                
        }
      
      }
      
    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while setting new state for alarm!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      setTimeout(() => {
        
        if(this.mainService.getCharacteristic(Characteristic.DialAlarm).value)
          this.mainService.getCharacteristic(Characteristic.DialAlarm)
            .setValue(false);
     
      },this.accessory.context.extras.alarm.duration * 1000);
    
      callback(); 
   
    }
  
  }
  
  async setRingLock(state, callback){
  
    let phonesFormData = [];
    let dayForm;
  
    try {
    
      this.logger.info(this.accessory.displayName + ': Ring Lock ' + (state ? 'On' : 'Off'));
      
      let today = new Date();
      let now = moment();
      let hour = now.hour();
      let minute = now.minute();
      let endhour = now.add(12,'h');
      let endminute = '00';

      if(today.getDay() === 6 || today.getDay() === 0){
        
        dayForm = 'weekend';
     
      } else {
        
        dayForm = 'weekday';
     
      }
   
      if(this.accessory.context.extras.ringlock.start && this.accessory.context.extras.ringlock.end){
      
        let s = this.accessory.context.extras.ringlock.start.split(':');
        let e = this.accessory.context.extras.ringlock.end.split(':');
        
        hour = s[0];
        minute = s[1];
        endhour = e[0];
        endminute = e[1];
     
      } else {
        
        if(hour < 10 && hour >= 0)
          hour = '0' + hour;

        if(minute < 10 && minute >= 0)
          minute = '0' + minute;
        
        if(endhour < 10 && endhour >= 0)
          endhour = '0' + endhour;
        
      }
      
      for(let count = 1; count <= this.accessory.context.extras.ringlock.DECTphones ; count++){
        
        if(state){
        
          phonesFormData.push({
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
            sid: false,
            page:'edit_dect_ring_block'
          });
          
        } else {
        
          phonesFormData.push({
            idx: count.toString(),
            xhr: '1',
            popup_url:'',
            apply: '',
            sid: false,
            page:'edit_dect_ring_block'
          });
        
        }
        
      }
      
      for(const formdata of phonesFormData)
        await this.lua.requestLUA(formdata, '/data.lua', this.device, 'nightsetting');  
     
    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while setting new state for ring lock!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      callback(); 
   
    }
  
  }
  
  async getRingLock(callback){
    
    let data, state;
    let phonesFormData = [];
    let actives = [];
  
    try {
    
      for(let count = 1; count <= this.accessory.context.extras.ringlock.DECTphones ; count++)
        phonesFormData.push({
          xhr: '1',
          idx: count.toString(),
          sid: false,
          no_sidrenew: '',
          popup_url: '',
          oldpage: '/fon_devices/edit_dect_ring_block.lua'
        });
        
      for(const formdata of phonesFormData){
      
        data = await this.lua.requestLUA(formdata, '/data.lua', this.device, 'nightsetting');  
 
        actives.push(parseInt(data));
      
      }
      
      state = actives.includes(1) ? true : false;

    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while getting state of ring lock!');
      
      if(err instanceof TypeError){
        console.log(err);
      } else {
        this.debug(err);
      }

    } finally {
    
      callback(null, state); 
   
    }
  
  }
  
  getBroadband(callback){
  
    let speed = speedTest({maxTime: this.accessory.context.extras.broadband.measureTime * 1000});
    
    this.debug(this.accessory.displayName + ': Starting bandwith measurement');
    
    speed.on('data', data => {
    
      let dl = (Math.round(data.speeds.download)).toString() + ' mb/s';
      let ul = (Math.round(data.speeds.upload)).toString() + ' mb/s';
      let pi = (Math.round(data.server.ping)).toString() + ' ms';
    
      this.debug('Download: ' + dl);
      this.debug('Upload: ' + ul);
      this.debug('Ping: ' + pi);
      
      this.mainService.getCharacteristic(Characteristic.Download)
        .updateValue(dl);      
      
      this.mainService.getCharacteristic(Characteristic.Upload)
        .updateValue(ul);
      
      this.mainService.getCharacteristic(Characteristic.Ping)
        .updateValue(pi);
        
    });
    
    speed.on('error', err => {
    
      this.logger.error(this.accessory.displayName + ': An error occured while getting state bandwidth!');
      this.debug(err);
      
    }); 
      
    this.mainService.getCharacteristic(Characteristic.Upload)
      .updateValue('Loading...');
      
    this.mainService.getCharacteristic(Characteristic.Ping)
      .updateValue('Loading...');
    
    callback(null, 'Loading...');
  
  }
  
  async storeData(data){

    return new Promise((resolve, reject) => {
    
      store(this.configPath).add(data, (err) => {
              
        if(err) reject(err);
              
        resolve(true);
            
      });
    
    });

  }
  
  async xml2json(xml) {
    
    return new Promise((resolve, reject) => {
      
      parseString(xml, function (err, json) {
        
        if (err) return reject(err);
        
        resolve(json);
      
      });

    });
  
  }

}

module.exports = DeviceAccessory;