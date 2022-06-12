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
    let service = this.accessory.getService(this.api.hap.Service.SmokeSensor);

    if (!service) {
      logger.info('Adding Smoke service', `${this.accessory.displayName} (${this.accessory.context.config.subtype})`);
      service = this.accessory.addService(
        this.api.hap.Service.SmokeSensor,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    if (this.accessory.context.config.battery) {
      let batteryService = this.accessory.getService(this.api.hap.Service.BatteryService);

      if (!batteryService) {
        logger.info(
          'Adding Battery service',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
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

    this.historyService = new this.HistoryService('door', this.accessory, {
      storage: 'fs',
      path: this.api.user.storagePath() + '/fritzbox/',
      disableTimer: true,
    });

    await timeout(250); //wait for historyService to load

    service
      .getCharacteristic(this.api.hap.Characteristic.SmokeDetected)
      .on('change', (context) => this.handler.change(context, this.accessory, null, this.historyService));

    this.refreshHistory(service);
  }

  async refreshHistory(service) {
    let state = service.getCharacteristic(this.api.hap.Characteristic.SmokeDetected).value;

    this.historyService.addEntry({
      time: moment().unix(),
      status: state ? 1 : 0,
    });

    setTimeout(() => {
      this.refreshHistory(service);
    }, 10 * 60 * 1000);
  }
}

module.exports = Accessory;
