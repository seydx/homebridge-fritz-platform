'use strict';

const logger = require('./utils/logger');
const { createPluginStorageDir, generateConfig } = require('./utils/utils');
const { version } = require('../package.json');

const Telegram = require('./lib/telegram');
const Callmonitor = require('./lib/callmonitor');

//Accessories
const { CallmonitorAccessory, CallmonitorSetup } = require('./accessories/callmonitor/callmonitor');
const { ExtrasAccessory, ExtrasSetup } = require('./accessories/extras/extras');
const { NetworkSetup } = require('./accessories/network/network');
const {
  PresenceMotionAccessory,
  PresenceOccupancyAccessory,
  PresenceSetup,
} = require('./accessories/presence/presence');
const { RouterAccessory, RouterSetup } = require('./accessories/router/router');
const {
  SHBlindAccessory,
  SHContactAccessory,
  SHLightbulbAccessory,
  SHOutletAccessory,
  SHOutletLightbulbAccessory,
  SHSwitchAccessory,
  SHSwitchLightbulbAccessory,
  SHTemperatureAccessory,
  SHThermostatAccessory,
  SHWindowAccessory,
  SHSetup,
} = require('./accessories/smarthome/smarthome');
const { WolAccessory, WolSetup } = require('./accessories/wol/wol');

//Custom Types
const CustomTypes = require('./types/custom.types');
const EveTypes = require('./types/eve.types');

const PLUGIN_NAME = 'homebridge-fritz-platform';
const PLATFORM_NAME = 'FritzPlatform';

var Accessory, HistoryService;

module.exports = function (homebridge) {
  Accessory = homebridge.platformAccessory;
  return FritzPlatform;
};

function FritzPlatform(log, config, api) {
  if (!api || !config) return;

  logger.configure(log, config.debug);

  CustomTypes.registerWith(api.hap);
  EveTypes.registerWith(api.hap);
  HistoryService = require('fakegato-history')(api);

  this.api = api;
  this.log = log;
  this.accessories = [];
  this.config = generateConfig(config);

  this.devices = new Map();

  this.meshMaster = {
    configured: false,
    cityPrefix: this.config.callmonitor.cityPrefix || false,
    countryPrefix: this.config.callmonitor.countryPrefix || false,
    fritzbox: null,
  };

  this.polling = this.config.options.polling;

  if (this.config.telegram.active && this.config.telegram.token && this.config.telegram.chatID) {
    Telegram.configure(this.config.telegram, this.messages);
  }

  if (this.config.devices) {
    RouterSetup(this.devices, this.config.devices, this.config.extras, config.options, this.meshMaster);
  }

  if (!this.meshMaster.configured) {
    logger.warn('WARNING: There is no master router configured! Please check if "master" is enabled in config.');
    return;
  }

  if (this.config.smarthome) {
    SHSetup(this.devices, this.config.smarthome);
  }

  if (this.config.presence) {
    PresenceSetup(this.devices, this.config.presence, this.config.options.presence);
  }

  if (this.config.wol) {
    WolSetup(this.devices, this.config.wol);
  }

  if (this.config.network) {
    NetworkSetup(this.config.network, this.meshMaster);
  }

  if (this.config.extras) {
    ExtrasSetup(this.devices, this.config.extras, this.meshMaster);
  }

  if (this.config.callmonitor.active) {
    CallmonitorSetup(this.devices, this.config.callmonitor);
  }

  this.api.on('shutdown', () => Callmonitor.stop());
  this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
}

FritzPlatform.prototype = {
  didFinishLaunching: async function () {
    await createPluginStorageDir(`${this.api.user.storagePath()}/fritzbox`);

    //configure accessories
    for (const [uuid, device] of this.devices.entries()) {
      const cachedAccessory = this.accessories.find((curAcc) => curAcc.UUID === uuid);

      if (!cachedAccessory) {
        logger.info('Configuring new accessory...', device.name);

        const accessory = new Accessory(device.name, uuid);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        this.accessories.push(accessory);
      } else {
        logger.info('Configuring cached accessory...', device.name);
      }
    }

    //remove unused accessories
    this.accessories.forEach((accessory) => {
      const device = this.devices.get(accessory.UUID);

      try {
        if (!device) {
          this.removeAccessory(accessory);
        }
      } catch (err) {
        logger.info('It looks like the accessory has already been removed. Skip removing.');
        logger.debug(err);
      }
    });

    //setup new accessories
    this.accessories.forEach((accessory) => {
      const device = this.devices.get(accessory.UUID);

      if (device) {
        logger.info('Setup accessory...', device.name);
        this.setupAccessory(accessory, device);
      }
    });
  },

  setupAccessoryInformation: function (accessory, device) {
    const manufacturer = device.manufacturer || this.meshMaster.manufacturer || 'Homebridge';
    const model = device.model || this.meshMaster.model || device.type || 'Model';
    const serialNumber = device.serialNumber || accessory.displayName || 'SerialNumber';

    const AccessoryInformation = accessory.getService(this.api.hap.Service.AccessoryInformation);

    AccessoryInformation.setCharacteristic(this.api.hap.Characteristic.Manufacturer, manufacturer);
    AccessoryInformation.setCharacteristic(this.api.hap.Characteristic.Model, model);
    AccessoryInformation.setCharacteristic(this.api.hap.Characteristic.SerialNumber, serialNumber);
    AccessoryInformation.setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, version);
  },

  setupAccessory: function (accessory, device) {
    this.setupAccessoryInformation(accessory, device);

    accessory.on('identify', () => logger.info('Identify requested.', accessory.displayName));

    accessory.context.config = device;
    accessory.context.config.polling = this.polling;

    switch (device.type) {
      case 'router':
        new RouterAccessory(this.api, accessory, this.accessories, this.meshMaster);
        break;
      case 'smarthome':
        if (device.subtype === 'smarthome-switch' && device.energy)
          new SHOutletAccessory(this.api, accessory, this.accessories, this.meshMaster, HistoryService);
        else if (device.subtype === 'smarthome-switch' && !device.energy)
          new SHSwitchAccessory(this.api, accessory, this.accessories, this.meshMaster);
        else if (device.subtype === 'smarthome-temperature')
          new SHTemperatureAccessory(this.api, accessory, this.accessories, this.meshMaster, HistoryService);
        else if (device.subtype === 'smarthome-thermostat')
          new SHThermostatAccessory(this.api, accessory, this.accessories, this.meshMaster, HistoryService);
        else if (device.subtype === 'smarthome-blind')
          new SHBlindAccessory(this.api, accessory, this.accessories, this.meshMaster);
        else if (device.subtype === 'smarthome-contact')
          new SHContactAccessory(this.api, accessory, this.accessories, this.meshMaster, HistoryService);
        else if (device.subtype === 'smarthome-window')
          new SHWindowAccessory(this.api, accessory, this.accessories, this.meshMaster, HistoryService);
        else if (device.subtype === 'smarthome-lightbulb')
          new SHLightbulbAccessory(this.api, accessory, this.accessories, this.meshMaster);
        else if (device.subtype === 'smarthome-switch-lightbulb' && device.energy)
          new SHOutletLightbulbAccessory(this.api, accessory, this.accessories, this.meshMaster, HistoryService);
        else if (device.subtype === 'smarthome-switch-lightbulb' && !device.energy)
          new SHSwitchLightbulbAccessory(this.api, accessory, this.accessories, this.meshMaster);
        break;
      case 'presence':
        if (device.subtype === 'motion')
          new PresenceMotionAccessory(this.api, accessory, this.accessories, this.meshMaster, HistoryService);
        else if (device.subtype === 'occupancy')
          new PresenceOccupancyAccessory(this.api, accessory, this.accessories, this.meshMaster);
        break;
      case 'wol':
        new WolAccessory(this.api, accessory, this.accessories, this.meshMaster);
        break;
      case 'callmonitor':
        new CallmonitorAccessory(this.api, accessory, this.accessories, this.meshMaster, HistoryService);
        break;
      case 'extra':
        new ExtrasAccessory(this.api, accessory, this.accessories, this.meshMaster);
        break;
      default:
        logger.warn(`Can not setup accessory, type (${device.type}) unknown!`, device.name);
        break;
    }
  },

  configureAccessory: function (accessory) {
    this.accessories.push(accessory);
  },

  removeAccessory: function (accessory) {
    logger.info('Removing accessory...', `${accessory.displayName} (${this.accessory.context.config.subtype})`);
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

    this.accessories = this.accessories.filter(
      (cachedAccessory) => cachedAccessory.displayName !== accessory.displayName
    );
  },
};
