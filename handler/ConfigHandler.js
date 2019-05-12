'use strict';

const Callmonitor = require('../handler/CallmonitorHandler.js');
const Telegram = require('../handler/TelegramHandler.js');

class DeviceHandler {
  constructor (platform, config) {

    this.config = config;
    this.platform = platform;
   
    this.validMAC = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
    this.validIP = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
    this.extras = {};
    this.devices = [];
    this.masterDevice = [];

  }
  
  async generateConfig(foundDevices){
  
    try {
      
      if(this.config.clearCache)
        return false;

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
        incomingTo: this.config.callmonitor.incomingTo||[],
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
        measureTime: this.config.broadband.measureTime||5
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
        anyoneOut: this.config.telegram.presence.anyoneOut||''
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
      
      this.foundDevices = foundDevices;
      
      for(let dev of this.foundDevices){
            
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
          options: this.config.devices[dev.name].options||false
        };
        
        if(this.config.devices[dev.name].type && this.config.devices[dev.name].master === false){
        
          let options = this.config.devices[dev.name].options;
        
          this.config.devices[dev.name].options = {
            wifi2: options ? options.wifi2 : false,
            wifi5: options ? options.wifi5 : false,
            wifiGuest: options ? options.wifiGuest : false,
            wps: options ? options.wps : false,
            led: options ? options.led : false
          };
          
          if(this.config.devices[dev.name].mesh !== undefined)
            delete this.config.devices[dev.name].mesh;
            
          if(this.config.devices[dev.name].master !== undefined)
            delete this.config.devices[dev.name].master;
          
        }
        
        if(this.config.devices[dev.name].master === true && (this.config.devices[dev.name].type === 'dsl' || this.config.devices[dev.name].type === 'cable')){
        
          let options = this.config.devices[dev.name].options;
        
          this.config.devices[dev.name].options = {
            wifi2: options ? options.wifi2 : false,
            wifi5: options ? options.wifi5 : false,
            wifiGuest: options ? options.wifiGuest : false,
            phoneBook: options ? options.phoneBook : false,
            wps: options ? options.wps : false,
            aw: options ? options.aw : false,
            deflection: options ? options.deflection : false,
            led: options ? options.led : false,
            lock: options ? options.lock : false
          };
        
        }
        
      }
      
      for(let smdevice of Object.keys(this.config.smarthome)){

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
       
        }
      
      }
  
      return this.config;

    } catch(err) {

      throw err;

    }
  
  }
  
  async getDevices(){
  
    try {
    
      for(let dev of this.foundDevices){
        
        dev = { 
          name: dev.name, 
          serial: dev.serial, 
          ...this.config.devices[dev.name]
        };
          
        if(dev.active && dev.type && dev.username && dev.password)
          this.devices.push(dev);
            
      }
    
      for(let smdevice of Object.keys(this.config.smarthome)){
    
        if(this.config.smarthome[smdevice].ain !== '0123456789' && (this.config.smarthome[smdevice].devType === 'contact' || this.config.smarthome[smdevice].devType === 'thermostat' || this.config.smarthome[smdevice].devType === 'switch')){
    
          let device = {           
            name: smdevice, 
            serial: 'SH-' + this.config.smarthome[smdevice].ain,
            type: 'smarthome', 
            ...this.config.smarthome[smdevice]        
          };

          if(device.active){
          
            this.smarthome = true;
            
            this.devices.push(device);   
         
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
            
            this.devices.push(tempDevice);
        
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

            this.devices.push(windowDevice);
         
          }

        }
    
      }
    
      if(this.config.callmonitor.active && this.validIP.test(this.config.callmonitor.ip)){
    
        this.devices.push({
          name: 'Callmonitor Incoming',
          ip: this.config.callmonitor.ip,
          port: this.config.callmonitor.port,
          country: this.config.callmonitor.country,
          incomingTo: this.config.callmonitor.incomingTo,
          outgoingFrom: this.config.callmonitor.outgoingFrom,
          serial: 'CI-1234567890',
          type: 'callmonitor'
        });
        
        this.devices.push({
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
            this.devices.push({
              name: user.name,
              address: user.address,
              serial: 'P-' + user.address.replace(/:|./g,''),
              type: 'presence'
            });
          }

      if(this.config.presence.anyone)
        this.devices.push({
          name: 'Anyone',
          serial: 'P-1234567890',
          type: 'presence'
        }); 
      
      if(this.config.wol.length)
        for(const wol of this.config.wol)
          if(wol.active && wol.address !== '00:00:00:00:00:00' && this.validMAC.test(wol.address))
            this.devices.push({
              name: wol.name,
              address: wol.address,
              serial: 'W-' + wol.address.replace(/:/g,''),
              type: 'wol'
            });
            
      return this.devices;
  
    } catch(err) {

      throw err;

    }
    
  }
  
  async getMasterDevice(){
  
    try {
    
      for(let dev of this.foundDevices){

        if((this.config.devices[dev.name].type === 'dsl' || this.config.devices[dev.name].type === 'cable') && this.config.devices[dev.name].username && this.config.devices[dev.name].password && this.config.devices[dev.name].master)       
          this.masterDevice.push(this.config.devices[dev.name]);
            
      }
    
      return this.masterDevice;
  
    } catch(err) {

      throw err;

    }
    
  }
  
  async getExtras(){
  
    try {
    
      if(this.config.alarm.active && this.config.alarm.telNr){
          
        this.extras.alarm = this.config.alarm;
          
      } else {
          
        this.extras.alarm = false;
         
      }
     
      if(this.config.wakeup.active && this.config.wakeup.internNr){
        
        this.extras.wakeup = this.config.wakeup;
          
      } else {
          
        this.extras.wakeup = false;
          
      }
      
      if(this.config.ringlock.active && this.config.ringlock.DECTphones){
          
        this.extras.ringlock = this.config.ringlock;
          
      } else {
          
        this.extras.ringlock = false;
          
      }
      
      if(this.config.broadband.active){
          
        this.extras.broadband = this.config.broadband;
          
      } else {
          
        this.extras.broadband = false;
         
      }
     
      if(this.config.extReboot.active && this.config.extReboot.cmdOn && this.config.extReboot.cmdOff){
          
        this.extras.extReboot = this.config.extReboot;
          
      } else {
          
        this.extras.extReboot = false;
          
      }
    
      return this.extras;
  
    } catch(err) {

      throw err;

    }
    
  }
  
  async initTelegram(){
  
    try {
    
      if(this.config.telegram.active && this.config.telegram.token && this.config.telegram.chatID)
        this.telegram = new Telegram(this.platform, this.config.telegram);
        
      return this.telegram || false;
  
    } catch(err) {

      throw err;

    }
    
  }
  
  async initCallmonitor(){
  
    try {
    
      if(this.config.callmonitor.active && this.validIP.test(this.config.callmonitor.ip))
        this.cm = new Callmonitor(this.platform, this.config.callmonitor);
    
      return this.cm || false;
  
    } catch(err) {

      throw err;

    }
    
  }
  
  getHosts(){
    return this.hosts;
  }
  
  getSmartHome(){
    return this.smarthome;
  }

}

module.exports = DeviceHandler;