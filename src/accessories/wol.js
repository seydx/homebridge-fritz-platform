'use strict';

const HomeKitTypes = require('../types/types.js');
const LogUtil = require('../../lib/LogUtil.js');
const packageFile = require('../../package.json');
//const request = require('request');

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
    accessory.context.adresse = parameter.adresse;
    accessory.context.mac = '0.0.0.0';
    accessory.context.hostname = 'Unknown';
    accessory.context.type = parameter.type;

    //AccessoryInformation
    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, accessory.displayName)
      .setCharacteristic(Characteristic.Identify, accessory.displayName)
      .setCharacteristic(Characteristic.Manufacturer, 'SeydX')
      .setCharacteristic(Characteristic.Model, 'WOL')
      .setCharacteristic(Characteristic.SerialNumber, 'W-1234567890')
      .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

    // Publish
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
      .setCharacteristic(Characteristic.Model, 'WOL')
      .setCharacteristic(Characteristic.SerialNumber, 'W-1234567890')
      .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

    accessory.on('identify', function (paired, callback) {
      self.logger.info(accessory.displayName + ': Hi!');
      callback();
    });

    let service = accessory.getService(Service.Switch);

    service.getCharacteristic(Characteristic.On)
      .updateValue(false)
      .on('set', self.setState.bind(this,accessory,service));

    if (!service.testCharacteristic(Characteristic.Adresse))service.addCharacteristic(Characteristic.Adresse);
    service.getCharacteristic(Characteristic.Adresse)
      .updateValue(accessory.context.adresse);

    if (!service.testCharacteristic(Characteristic.Host))service.addCharacteristic(Characteristic.Host);
    service.getCharacteristic(Characteristic.Host)
      .updateValue('FritzBox');

  }

  setState(accessory,service,state,callback){
    const self = this;
    if(!accessory.context.stopPolling){
      for(const i in accessory.context.devices){
        let device = accessory.context.devices[i];
        let wol = device.services['urn:dslforum-org:service:Hosts:1'];
        wol.actions['X_AVM-DE_WakeOnLANByMACAddress']([{name:'NewMACAddress', value:accessory.context.adresse}],{name:accessory.displayName, count:0},function(err) {
          if(!err){
            self.logger.info('Turning on ' + accessory.displayName);
          } else {
            if(err.tr064code!=='401'){
              if(err.ping){
                self.logger.warn(accessory.displayName + ': Can not reach ' + device.config.host + ':' + device.config.port);
              } else {
                self.logger.errorinfo('An error occured while turning on ' + accessory.displayName);
                self.logger.errorinfo(JSON.stringify(err,null,4));
              }
            } 
          }
          setTimeout(function(){service.getCharacteristic(Characteristic.On).updateValue(false);},500);
          callback(null, false);
        });
      }
    } else {
      self.logger.warn('Can not change ' + accessory.displayName + ' state, Broadband active...');
      setTimeout(function(){service.getCharacteristic(Characteristic.On).updateValue(false);},500);
      callback(null, false);
    }
  }

}

module.exports = Fritz_Box;
