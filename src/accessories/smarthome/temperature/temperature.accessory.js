'use strict';

const moment = require('moment');
const logger = require('../../../utils/logger');
const Handler = require('../smarthome.handler');

const timeout = (ms) => new Promise((res) => setTimeout(res, ms));

class Accessory {
  constructor(api, accessory, accessories, meshMaster, HistoryService) {
    this.api = api;
    this.accessory = accessory;
    this.HistoryService = HistoryService;

    this.handler = Handler.configure(api, accessories, accessory.context.config.polling, meshMaster);
    this.getService();
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  async getService() {
    let service = this.accessory.getService(this.api.hap.Service.TemperatureSensor);

    if (!service) {
      logger.info('Adding Temperature service', this.accessory.displayName);
      service = this.accessory.addService(
        this.api.hap.Service.TemperatureSensor,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature).setProps({
      minValue: -100,
      maxValue: 100,
    });

    if (this.accessory.context.config.battery) {
      let batteryService = this.accessory.getService(this.api.hap.Service.BatteryService);

      if (!batteryService) {
        logger.info('Adding Battery service', this.accessory.displayName);
        batteryService = this.accessory.addService(this.api.hap.Service.BatteryService);
      }

      batteryService.setCharacteristic(
        this.api.hap.Characteristic.ChargingState,
        this.api.hap.Characteristic.ChargingState.NOT_CHARGEABLE
      );
    } else {
      if (this.accessory.getService(this.api.hap.Service.BatteryService)) {
        this.accessory.removeService(this.accessory.getService(this.api.hap.Service.BatteryService));
      }
    }

    if (this.accessory.context.config.humidity) {
      let humidityService = this.accessory.getService(this.api.hap.Service.HumiditySensor);

      if (!humidityService) {
        logger.info('Adding Humidity service', this.accessory.displayName);
        humidityService = this.accessory.addService(this.api.hap.Service.HumiditySensor);
      }
    } else {
      if (this.accessory.getService(this.api.hap.Service.HumiditySensor)) {
        this.accessory.removeService(this.accessory.getService(this.api.hap.Service.HumiditySensor));
      }
    }

    this.historyService = new this.HistoryService('room', this.accessory, {
      storage: 'fs',
      path: this.api.user.storagePath() + '/fritzbox/',
      disableTimer: true,
    });

    await timeout(250); //wait for historyService to load

    service
      .getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
      .on('change', (context) => this.handler.change(context, this.accessory, null, this.historyService));

    this.refreshHistory(service);
  }

  async refreshHistory(service) {
    let state = service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature).value;

    this.historyService.addEntry({
      time: moment().unix(),
      temp: state,
      humidity: 0,
      ppm: 0,
    });

    setTimeout(() => {
      this.refreshHistory(service);
    }, 10 * 60 * 1000);
  }
}

module.exports = Accessory;
