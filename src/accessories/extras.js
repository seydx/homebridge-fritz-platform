'use strict';

const api = require('../../lib/TR064.js');
const LUA = require('../../lib/LUA.js');

const compareVersions = require('compare-versions');

var Service, Characteristic;

class ExtrasAccessory {
  constructor (platform, accessory) {

    // HB
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;
    
    this.platform = platform;
    this.log = platform.log;
    this.logger = platform.logger;
    this.debug = platform.debug;
    this.api = platform.api;
    this.config = platform.config;
    this.accessories = platform.accessories;    
    this.sid = platform.sid;
    
    this.accessory = accessory;
    this.mainService = this.accessory.getService(Service.Switch);
    
    this.initAPI();

  }
  
  async initAPI(){
  
    try {
  
      this.logger.info(this.accessory.displayName + ': Initializing API');
    
      this.TR064 = new api.TR064(this.accessory.context.device, this.logger);
        
      let TR064 = await this.TR064.initDevice();
      
      this.device = await TR064.startEncryptedCommunication();
      
      this.logger.info(this.accessory.displayName + ': Successfully logged in!');
      
      if(this.accessory.displayName.includes('Led'))
        return this.getFirmware();
        
      this.getService();
    
    } catch(err) {
    
      this.logger.error(this.accessory.displayName + ': An error occured while initializing API!');
      
      this.logger.error(this.accessory.displayName + ': Please check your credentials and try again with restarting homebridge!');
      
      this.debug(JSON.stringify(err, null, 4));
    
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
      this.debug(JSON.stringify(err, null, 4));
    
    }
  
  }
  
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService () {
  
    if(this.accessory.displayName.includes('Led') || this.accessory.displayName.includes('Lock'))
      this.lua = new LUA(this.platform, this.accessory.context.device, this.sid);

    this.mainService.getCharacteristic(Characteristic.On)
      .on('get', this.getState.bind(this))
      .on('set', this.setState.bind(this));

  }

  async setState(state,callback){
  
    try {

      this.logger.info(this.accessory.displayName + ': ' + (state ? 'On' : 'Off'));
      
      if(this.accessory.displayName.includes('Wifi2')){
      
        let wifi = this.device.services['urn:dslforum-org:service:WLANConfiguration:1']; 
        
        await wifi.actions.SetEnable([{name:'NewEnable', value: state ? '1' : '0'}]);
        
      } else if(this.accessory.displayName.includes('Wifi5')){
      
        let wifi = this.device.services['urn:dslforum-org:service:WLANConfiguration:2']; 
        
        await wifi.actions.SetEnable([{name:'NewEnable', value: state ? '1' : '0'}]);
        
      } else if(this.accessory.displayName.includes('WifiGuest')){
      
        
        let wifi = this.device.services['urn:dslforum-org:service:WLANConfiguration:3'] 
          ?  this.device.services['urn:dslforum-org:service:WLANConfiguration:3'] 
          : this.device.services['urn:dslforum-org:service:WLANConfiguration:2'];
        
        await wifi.actions.SetEnable([{name:'NewEnable', value: state ? '1' : '0'}]);
        
      } else if(this.accessory.displayName.includes('Wps')){
      
        let wps = this.device.services['urn:dslforum-org:service:WLANConfiguration:1']; 
              
        await wps.actions['X_AVM-DE_SetWPSConfig']([{name:'NewX_AVM-DE_WPSMode', value: state ? 'pbc' : 'stop'},{name:'NewX_AVM-DE_WPSClientPIN',value:''}]);
      
        if(state)
          setTimeout(() => { 
            
            this.mainService.getCharacteristic(Characteristic.On)
              .setValue(false); 
          
          }, 2 * 59 * 1000);
     
      } else if(this.accessory.displayName.includes('Led')){
      
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
    
      } else if(this.accessory.displayName.includes('Aw')){
      
        let aw = this.device.services['urn:dslforum-org:service:X_AVM-DE_TAM:1']; 
        
        await aw.actions.SetEnable([{name:'NewIndex', value:'0'},{name:'NewEnable', value:state?'1':'0'}]);
      
      } else if(this.accessory.displayName.includes('Deflection')){
      
        let deflection = this.device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1']; 

        let amountDeflection = await deflection.actions.GetNumberOfDeflections();
        amountDeflection = parseInt(amountDeflection.NewNumberOfDeflections);
      
        if(amountDeflection){
  
          await deflection.actions.SetDeflectionEnable([{name:'NewDeflectionId',value:'0'}, {name:'NewEnable',value:state ? '1' : '0'}]);
      
        } else {
   
          this.logger.warn(this.accessory.displayName + ': Can not change deflection! No deflections setted up in FRITZ! settings');
  
        }
        
      } else if(this.accessory.displayName.includes('Lock')){
      
        await this.lua.requestLUA({
          xhr: '1',
          keylock_enabled: state ? '1' : '0',
          apply: '',
          sid: false,
          page: 'keyLo',
        }, '/data.lua', this.device);
     
      } else {
      
        this.log.error('Can not find ' + this.accessory.displayName);
      
      }

    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while setting new state!');
      this.debug(JSON.stringify(err,null,4));

    } finally {
    
      callback(); 
   
    }

  }
  
  async getState(callback){
  
    let state = false;
    let data;
  
    try {

      if(this.accessory.displayName.includes('Wifi2')){
      
        let wifi = this.device.services['urn:dslforum-org:service:WLANConfiguration:1']; 
        
        wifi = await wifi.actions.GetInfo();
      
        state = parseInt(wifi.NewEnable) ? true : false;   
        
      } else if(this.accessory.displayName.includes('Wifi5')){
      
        let wifi = this.device.services['urn:dslforum-org:service:WLANConfiguration:2']; 
        
        wifi = await wifi.actions.GetInfo();
      
        state = parseInt(wifi.NewEnable) ? true : false;   
        
      } else if(this.accessory.displayName.includes('WifiGuest')){
      
        let wifi = this.device.services['urn:dslforum-org:service:WLANConfiguration:3'] 
          ? this.device.services['urn:dslforum-org:service:WLANConfiguration:3'] 
          : this.device.services['urn:dslforum-org:service:WLANConfiguration:2'];
        
        wifi = await wifi.actions.GetInfo();
      
        state = parseInt(wifi.NewEnable) ? true : false;   
        
      } else if(this.accessory.displayName.includes('Wps')){
      
        let wps = this.device.services['urn:dslforum-org:service:WLANConfiguration:1'];         
      
        wps = await wps.actions['X_AVM-DE_GetWPSInfo']();
      
        state = wps['NewX_AVM-DE_WPSStatus'] === 'active' ? true : false;
        
      } else if(this.accessory.displayName.includes('Led')){
      
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
        
      } else if(this.accessory.displayName.includes('Aw')){
      
        let aw = this.device.services['urn:dslforum-org:service:X_AVM-DE_TAM:1'];         
      
        aw = await aw.actions.GetInfo([{name:'NewIndex',value:'0'}]);
      
        state = parseInt(aw.NewEnable) ? true : false;
        
      } else if(this.accessory.displayName.includes('Deflection')){
      
        let deflection = this.device.services['urn:dslforum-org:service:X_AVM-DE_OnTel:1']; 

        let amountDeflection = await deflection.actions.GetNumberOfDeflections();
        amountDeflection = parseInt(amountDeflection.NewNumberOfDeflections);
      
        if(amountDeflection){
  
          let getDeflection = await deflection.actions.GetDeflection([{name:'NewDeflectionId',value:'0'}]);
  
          state = parseInt(getDeflection.NewEnable) ? true : false;
      
        } else {
  
          state = false;
  
        }
        
      } else if(this.accessory.displayName.includes('Lock')){
      
        data = await this.lua.requestLUA({
          xhr: '1',
          xhrId: 'all',
          sid: false,
          page: 'keyLo'
        }, '/data.lua', this.device);  
 
        state = data.data.keylock_checked || false;
        
      } else {
      
        this.log.error('Can not find ' + this.accessory.displayName);
      
      }

    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while getting new state!');
      this.debug(JSON.stringify(err,null,4));

    } finally {
    
      callback(null, state);
   
    }

  }

}

module.exports = ExtrasAccessory;
