'use strict';

const HomeKitTypes = require('../types/types.js');

var Service, Characteristic;

class WolAccessory {
  constructor (platform, accessory, device) {

    // HB
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;
    
    HomeKitTypes.registerWith(platform.api.hap);
    
    this.platform = platform;
    this.log = platform.log;
    this.logger = platform.logger;
    this.debug = platform.debug;
    this.api = platform.api;
    this.config = platform.config;
    this.accessories = platform.accessories;
    
    this.accessory = accessory;
    this.mainService = this.accessory.getService(Service.Switch);
    
    this.device = device;
    
    this.getService();

  }
  
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService () {

    this.mainService.getCharacteristic(Characteristic.On)
      .updateValue(false)
      .on('set', this.setState.bind(this));

    if (!this.mainService.testCharacteristic(Characteristic.Adresse))
      this.mainService.addCharacteristic(Characteristic.Adresse);
      
    this.mainService.getCharacteristic(Characteristic.Adresse)
      .updateValue(this.accessory.context.address);

    if (!this.mainService.testCharacteristic(Characteristic.Host))
      this.mainService.addCharacteristic(Characteristic.Host);
    
    this.mainService.getCharacteristic(Characteristic.Host)
      .updateValue('FritzBox');

  }

  async setState(state,callback){
  
    try {

      if(state){
   
        this.logger.info(this.accessory.displayName + ': Toggle');

        let wol = this.device.services['urn:dslforum-org:service:Hosts:1']; 
        
        await wol.actions['X_AVM-DE_WakeOnLANByMACAddress']([{name:'NewMACAddress', value:this.accessory.context.address}]);

      }
      
      setTimeout(() => {
   
        this.mainService.getCharacteristic(Characteristic.On).updateValue(false);
    
      }, 500);

    } catch(err) {

      this.logger.error(this.accessory.displayName + ': An error occured while setting new state!');
      console.log(err);

    } finally {
    
      callback(); 
   
    }

  }

}

module.exports = WolAccessory;
