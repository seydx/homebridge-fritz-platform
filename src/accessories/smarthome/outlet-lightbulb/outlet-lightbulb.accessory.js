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
    let serviceOutlet = this.accessory.getService(this.api.hap.Service.Outlet);
    let serviceLightbulb = this.accessory.getService(this.api.hap.Service.Lightbulb);
    let serviceTemp = this.accessory.getService(this.api.hap.Service.TemperatureSensor);
    let serviceSwitch = this.accessory.getService(this.api.hap.Service.Switch);

    if (serviceSwitch) {
      logger.info(
        'Removing Switch service',
        `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
      );
      this.accessory.removeService(serviceSwitch);
    }

    if (!serviceOutlet) {
      logger.info('Adding Outlet service', `${this.accessory.displayName} (${this.accessory.context.config.subtype})`);
      serviceOutlet = this.accessory.addService(
        this.api.hap.Service.Outlet,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    if (!serviceLightbulb) {
      logger.info(
        'Adding Lightbulb service',
        `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
      );
      serviceLightbulb = this.accessory.addService(
        this.api.hap.Service.Lightbulb,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    if (this.accessory.context.config.temperature) {
      if (!serviceTemp) {
        logger.info(
          'Adding Temperature service',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        serviceTemp = this.accessory.addService(
          this.api.hap.Service.TemperatureSensor,
          this.accessory.displayName,
          this.accessory.context.config.subtype
        );
      }

      serviceTemp.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature).setProps({
        minValue: -100,
        maxValue: 100,
      });
    }

    if (this.accessory.context.config.brightness) {
      if (!serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Brightness)) {
        serviceLightbulb.addCharacteristic(this.api.hap.Characteristic.Brightness);
      }
    } else {
      if (
        serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Brightness) &&
        !this.accessory.context.config.color
      ) {
        serviceLightbulb.removeCharacteristic(
          serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.Brightness)
        );
      }
    }

    if (this.accessory.context.config.color) {
      if (!serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Brightness)) {
        serviceLightbulb.addCharacteristic(this.api.hap.Characteristic.Brightness);
      }

      if (!serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Hue)) {
        serviceLightbulb.addCharacteristic(this.api.hap.Characteristic.Hue);
      }

      if (!serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Saturation)) {
        serviceLightbulb.addCharacteristic(this.api.hap.Characteristic.Saturation);
      }

      if (!serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.ColorTemperature)) {
        serviceLightbulb.addCharacteristic(this.api.hap.Characteristic.ColorTemperature);
      }

      serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.ColorTemperature).setProps({
        minValue: 140,
        maxValue: 500,
      });

      this.adaptiveLightingController = new this.api.hap.AdaptiveLightingController(serviceLightbulb, {
        controllerMode: this.api.hap.AdaptiveLightingControllerMode.AUTOMATIC,
      });

      this.accessory.configureController(this.adaptiveLightingController);
      this.accessory.adaptiveLightingController = this.adaptiveLightingController;
    } else {
      if (serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Brightness)) {
        serviceLightbulb.removeCharacteristic(
          serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.Brightness)
        );
      }

      if (serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Hue)) {
        serviceLightbulb.removeCharacteristic(serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.Hue));
      }

      if (serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Saturation)) {
        serviceLightbulb.removeCharacteristic(
          serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.Saturation)
        );
      }

      if (serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.ColorTemperature)) {
        serviceLightbulb.removeCharacteristic(
          serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.ColorTemperature)
        );
      }
    }

    if (!serviceOutlet.testCharacteristic(this.api.hap.Characteristic.CurrentConsumption)) {
      serviceOutlet.addCharacteristic(this.api.hap.Characteristic.CurrentConsumption);
    }

    if (!serviceOutlet.testCharacteristic(this.api.hap.Characteristic.TotalConsumption)) {
      serviceOutlet.addCharacteristic(this.api.hap.Characteristic.TotalConsumption);
    }

    if (!serviceOutlet.testCharacteristic(this.api.hap.Characteristic.Volts)) {
      serviceOutlet.addCharacteristic(this.api.hap.Characteristic.Volts);
    }

    if (!serviceOutlet.testCharacteristic(this.api.hap.Characteristic.Amperes)) {
      serviceOutlet.addCharacteristic(this.api.hap.Characteristic.Amperes);
    }

    if (!serviceOutlet.testCharacteristic(this.api.hap.Characteristic.ResetTotal)) {
      serviceOutlet.addCharacteristic(this.api.hap.Characteristic.ResetTotal);
    }

    this.historyService = new this.HistoryService('energy', this.accessory, {
      storage: 'fs',
      path: this.api.user.storagePath() + '/fritzbox/',
      disableTimer: true,
    });

    await timeout(250); //wait for historyService to load

    serviceOutlet
      .getCharacteristic(this.api.hap.Characteristic.CurrentConsumption)
      .on('change', (context) => this.handler.change(context, this.accessory, null, this.historyService));

    serviceOutlet.getCharacteristic(this.api.hap.Characteristic.ResetTotal).onSet(() => {
      logger.info('Resetting FakeGato..', `${this.accessory.displayName} (${this.accessory.context.config.subtype})`);

      const now = Math.round(new Date().valueOf() / 1000);
      const epoch = Math.round(new Date('2001-01-01T00:00:00Z').valueOf() / 1000);

      serviceOutlet.getCharacteristic(this.api.hap.Characteristic.ResetTotal).updateValue(now - epoch);

      this.accessory.context.timesOpened = 0;

      serviceOutlet
        .getCharacteristic(this.api.hap.Characteristic.TimesOpened)
        .updateValue(this.accessory.context.timesOpened);
    });

    if (!this.accessory.context.config.readOnly) {
      serviceOutlet
        .getCharacteristic(this.api.hap.Characteristic.On)
        .onSet((state) => this.handler.set(state, this.accessory, null, null, 'on'));
    } else {
      serviceOutlet.getCharacteristic(this.api.hap.Characteristic.On).onSet((state) => {
        logger.info(
          'Changing state not allowed - "readOnly" is active!',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        setTimeout(() => serviceOutlet.getCharacteristic(this.api.hap.Characteristic.On).updateValue(!state), 1000);
      });
    }

    if (this.accessory.context.config.brightness) {
      serviceLightbulb
        .getCharacteristic(this.api.hap.Characteristic.Brightness)
        .onSet((state) => this.handler.set(state, this.accessory, null, null, 'brightness'));
    }

    if (this.accessory.context.config.color) {
      serviceLightbulb
        .getCharacteristic(this.api.hap.Characteristic.ColorTemperature)
        .onSet((state) => this.handler.set(state, this.accessory, null, null, 'temperature'));

      serviceLightbulb
        .getCharacteristic(this.api.hap.Characteristic.Saturation)
        .onSet((state) => this.handler.set(state, this.accessory, null, null, 'color'));
    }

    this.refreshHistory(serviceOutlet);
  }

  async refreshHistory(serviceOutlet) {
    let state = serviceOutlet.getCharacteristic(this.api.hap.Characteristic.CurrentConsumption).value;

    this.historyService.addEntry({
      time: moment().unix(),
      power: state || 0,
    });

    setTimeout(() => {
      this.refreshHistory(serviceOutlet);
    }, 10 * 60 * 1000);
  }
}

module.exports = Accessory;
