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
    let service = this.accessory.getService(this.api.hap.Service.HeaterCooler);
    let serviceOld = this.accessory.getService(this.api.hap.Service.Thermostat);

    if (serviceOld) {
      logger.info(
        'Removing Thermostat service',
        `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
      );
      service = this.accessory.removeService(serviceOld);
    }

    if (!service) {
      logger.info(
        'Adding HeaterCooler service',
        `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
      );
      service = this.accessory.addService(
        this.api.hap.Service.HeaterCooler,
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

    service.getCharacteristic(this.api.hap.Characteristic.CurrentHeaterCoolerState).setProps({
      maxValue: 3,
      minValue: 0,
      validValues: [0, 1, 2, 3],
    });

    service.getCharacteristic(this.api.hap.Characteristic.TargetHeaterCoolerState).updateValue(1);

    service.getCharacteristic(this.api.hap.Characteristic.TargetHeaterCoolerState).setProps({
      maxValue: 1,
      minValue: 1,
      validValues: [1],
    });

    let minValue = 8;
    let maxValue = 28;

    if (!service.testCharacteristic(this.api.hap.Characteristic.CoolingThresholdTemperature)) {
      service.addCharacteristic(this.api.hap.Characteristic.CoolingThresholdTemperature);
    }

    if (service.getCharacteristic(this.api.hap.Characteristic.CoolingThresholdTemperature).value < minValue) {
      service.getCharacteristic(this.api.hap.Characteristic.CoolingThresholdTemperature).updateValue(minValue);
    }

    if (service.getCharacteristic(this.api.hap.Characteristic.CoolingThresholdTemperature).value > maxValue) {
      service.getCharacteristic(this.api.hap.Characteristic.CoolingThresholdTemperature).updateValue(maxValue);
    }

    service.getCharacteristic(this.api.hap.Characteristic.CoolingThresholdTemperature).setProps({
      minValue: minValue,
      maxValue: maxValue,
      minStep: 0.5,
    });

    if (!service.testCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature)) {
      service.addCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature);
    }

    if (service.getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature).value < minValue) {
      service.getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature).updateValue(minValue);
    }

    if (service.getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature).value > maxValue) {
      service.getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature).updateValue(maxValue);
    }

    service.getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature).setProps({
      minValue: minValue,
      maxValue: maxValue,
      minStep: 0.5,
    });

    service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature).setProps({
      minValue: -100,
      maxValue: 100,
    });

    if (!service.testCharacteristic(this.api.hap.Characteristic.ValvePosition)) {
      service.addCharacteristic(this.api.hap.Characteristic.ValvePosition);
    }

    this.historyService = new this.HistoryService('thermo', this.accessory, {
      storage: 'fs',
      path: this.api.user.storagePath() + '/fritzbox/',
      disableTimer: true,
    });

    await timeout(250); //wait for historyService to load

    service
      .getCharacteristic(this.api.hap.Characteristic.Active)
      .onSet((state) => this.handler.set(state, this.accessory, null, 'state'));

    service
      .getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
      .on('change', (context) => this.handler.change(context, this.accessory, null, this.historyService));

    service
      .getCharacteristic(this.api.hap.Characteristic.CoolingThresholdTemperature)
      .onSet((state) => this.handler.set(state, this.accessory, null, 'temperature'))
      .on('change', (context) => this.handler.change(context, this.accessory, null, this.historyService));

    service
      .getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature)
      .onSet((state) => this.handler.set(state, this.accessory, null, 'temperature'))
      .on('change', (context) => this.handler.change(context, this.accessory, null, this.historyService));

    service
      .getCharacteristic(this.api.hap.Characteristic.ValvePosition)
      .on('change', (context) => this.handler.change(context, this.accessory, null, this.historyService));

    this.refreshHistory(service);
  }

  async refreshHistory(service) {
    let currentState = service.getCharacteristic(this.api.hap.Characteristic.CurrentHeaterCoolerState).value;
    let currentTemp = service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature).value;
    let targetTemp = service.getCharacteristic(this.api.hap.Characteristic.HeatingThresholdTemperature).value;

    let valvePos =
      currentTemp <= targetTemp && currentState !== 0
        ? Math.round(targetTemp - currentTemp >= 5 ? 100 : (targetTemp - currentTemp) * 20)
        : 0;

    this.historyService.addEntry({
      time: moment().unix(),
      currentTemp: currentTemp,
      setTemp: targetTemp,
      valvePosition: valvePos,
    });

    setTimeout(() => {
      this.refreshHistory(service);
    }, 10 * 60 * 1000);
  }
}

module.exports = Accessory;
