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
    let service = this.accessory.getService(this.api.hap.Service.Outlet);
    let serviceOld = this.accessory.getService(this.api.hap.Service.Switch);

    if (serviceOld) {
      logger.info(
        'Removing Switch service',
        `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
      );
      this.accessory.removeService(serviceOld);
    }

    if (!service) {
      logger.info('Adding Outlet service', `${this.accessory.displayName} (${this.accessory.context.config.subtype})`);
      service = this.accessory.addService(
        this.api.hap.Service.Outlet,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    if (!service.testCharacteristic(this.api.hap.Characteristic.CurrentConsumption)) {
      service.addCharacteristic(this.api.hap.Characteristic.CurrentConsumption);
    }

    if (!service.testCharacteristic(this.api.hap.Characteristic.TotalConsumption)) {
      service.addCharacteristic(this.api.hap.Characteristic.TotalConsumption);
    }

    if (!service.testCharacteristic(this.api.hap.Characteristic.Volts)) {
      service.addCharacteristic(this.api.hap.Characteristic.Volts);
    }

    if (!service.testCharacteristic(this.api.hap.Characteristic.Amperes)) {
      service.addCharacteristic(this.api.hap.Characteristic.Amperes);
    }

    if (!service.testCharacteristic(this.api.hap.Characteristic.ResetTotal)) {
      service.addCharacteristic(this.api.hap.Characteristic.ResetTotal);
    }

    this.historyService = new this.HistoryService('energy', this.accessory, {
      storage: 'fs',
      path: this.api.user.storagePath() + '/fritzbox/',
      disableTimer: true,
    });

    await timeout(250); //wait for historyService to load

    service
      .getCharacteristic(this.api.hap.Characteristic.CurrentConsumption)
      .on('change', (context) => this.handler.change(context, this.accessory, null, this.historyService));

    service.getCharacteristic(this.api.hap.Characteristic.ResetTotal).onSet(() => {
      logger.info('Resetting FakeGato..', `${this.accessory.displayName} (${this.accessory.context.config.subtype})`);

      const now = Math.round(new Date().valueOf() / 1000);
      const epoch = Math.round(new Date('2001-01-01T00:00:00Z').valueOf() / 1000);

      service.getCharacteristic(this.api.hap.Characteristic.ResetTotal).updateValue(now - epoch);

      this.accessory.context.timesOpened = 0;

      service
        .getCharacteristic(this.api.hap.Characteristic.TimesOpened)
        .updateValue(this.accessory.context.timesOpened);
    });

    if (!this.accessory.context.config.readOnly) {
      service
        .getCharacteristic(this.api.hap.Characteristic.On)
        .onSet((state) => this.handler.set(state, this.accessory));
    } else {
      service.getCharacteristic(this.api.hap.Characteristic.On).onSet((state) => {
        logger.info(
          'Changing state not allowed - "readOnly" is active!',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        setTimeout(() => service.getCharacteristic(this.api.hap.Characteristic.On).updateValue(!state), 1000);
      });
    }

    this.refreshHistory(service);
  }

  async refreshHistory(service) {
    let state = service.getCharacteristic(this.api.hap.Characteristic.CurrentConsumption).value;

    this.historyService.addEntry({
      time: moment().unix(),
      power: state || 0,
    });

    setTimeout(() => {
      this.refreshHistory(service);
    }, 10 * 60 * 1000);
  }
}

module.exports = Accessory;
