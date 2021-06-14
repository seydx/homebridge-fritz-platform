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
    let service = this.accessory.getService(this.api.hap.Service.ContactSensor);

    if (!service) {
      logger.info('Adding Window service', this.accessory.displayName);
      service = this.accessory.addService(
        this.api.hap.Service.ContactSensor,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

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

    if (!service.testCharacteristic(this.api.hap.Characteristic.LastActivation)) {
      service.addCharacteristic(this.api.hap.Characteristic.LastActivation);
    }

    if (!service.testCharacteristic(this.api.hap.Characteristic.TimesOpened)) {
      service.addCharacteristic(this.api.hap.Characteristic.TimesOpened);
    }

    if (!service.testCharacteristic(this.api.hap.Characteristic.ResetTotal)) {
      service.addCharacteristic(this.api.hap.Characteristic.ResetTotal);
    }

    if (!service.testCharacteristic(this.api.hap.Characteristic.OpenDuration)) {
      service.addCharacteristic(this.api.hap.Characteristic.OpenDuration);
    }

    if (!service.testCharacteristic(this.api.hap.Characteristic.ClosedDuration)) {
      service.addCharacteristic(this.api.hap.Characteristic.ClosedDuration);
    }

    service.getCharacteristic(this.api.hap.Characteristic.ResetTotal).onSet(() => {
      logger.info('Resetting FakeGato..', this.accessory.displayName);

      const now = Math.round(new Date().valueOf() / 1000);
      const epoch = Math.round(new Date('2001-01-01T00:00:00Z').valueOf() / 1000);

      service.getCharacteristic(this.api.hap.Characteristic.ResetTotal).updateValue(now - epoch);

      this.accessory.context.timesOpened = 0;

      service
        .getCharacteristic(this.api.hap.Characteristic.TimesOpened)
        .updateValue(this.accessory.context.timesOpened);
    });

    this.historyService = new this.HistoryService('door', this.accessory, {
      storage: 'fs',
      path: this.api.user.storagePath() + '/fritzbox/',
      disableTimer: true,
    });

    await timeout(250); //wait for historyService to load

    service
      .getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
      .on('change', (context) => this.handler.change(context, this.accessory, null, this.historyService));

    this.refreshHistory(service);
  }

  async refreshHistory(service) {
    let state = service.getCharacteristic(this.api.hap.Characteristic.ContactSensorState).value;

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
