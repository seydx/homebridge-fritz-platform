'use strict';

const logger = require('../../../utils/logger');
const Handler = require('../smarthome.handler');

class Accessory {
  constructor(api, accessory, accessories, meshMaster) {
    this.api = api;
    this.accessory = accessory;

    this.handler = Handler.configure(api, accessories, accessory.context.config.polling, meshMaster);
    this.getService();
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService() {
    let service = this.accessory.getService(this.api.hap.Service.Lightbulb);

    if (!service) {
      logger.info(
        'Adding Lightbulb service',
        `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
      );
      service = this.accessory.addService(
        this.api.hap.Service.Lightbulb,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    if (this.accessory.context.config.brightness) {
      if (!service.testCharacteristic(this.api.hap.Characteristic.Brightness)) {
        service.addCharacteristic(this.api.hap.Characteristic.Brightness);
      }
    } else {
      if (service.testCharacteristic(this.api.hap.Characteristic.Brightness) && !this.accessory.context.config.color) {
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Brightness));
      }
    }

    if (this.accessory.context.config.color) {
      if (!service.testCharacteristic(this.api.hap.Characteristic.Brightness)) {
        service.addCharacteristic(this.api.hap.Characteristic.Brightness);
      }

      if (!service.testCharacteristic(this.api.hap.Characteristic.Hue)) {
        service.addCharacteristic(this.api.hap.Characteristic.Hue);
      }

      if (!service.testCharacteristic(this.api.hap.Characteristic.Saturation)) {
        service.addCharacteristic(this.api.hap.Characteristic.Saturation);
      }

      if (!service.testCharacteristic(this.api.hap.Characteristic.ColorTemperature)) {
        service.addCharacteristic(this.api.hap.Characteristic.ColorTemperature);
      }

      service.getCharacteristic(this.api.hap.Characteristic.ColorTemperature).setProps({
        minValue: 140,
        maxValue: 500,
      });

      this.adaptiveLightingController = new this.api.hap.AdaptiveLightingController(service, {
        controllerMode: this.api.hap.AdaptiveLightingControllerMode.AUTOMATIC,
      });

      this.accessory.configureController(this.adaptiveLightingController);
      this.accessory.adaptiveLightingController = this.adaptiveLightingController;
    } else {
      if (service.testCharacteristic(this.api.hap.Characteristic.Brightness)) {
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Brightness));
      }

      if (service.testCharacteristic(this.api.hap.Characteristic.Hue)) {
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Hue));
      }

      if (service.testCharacteristic(this.api.hap.Characteristic.Saturation)) {
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Saturation));
      }

      if (service.testCharacteristic(this.api.hap.Characteristic.ColorTemperature)) {
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.ColorTemperature));
      }
    }

    service
      .getCharacteristic(this.api.hap.Characteristic.On)
      .onSet((state) => this.handler.set(state, this.accessory, null, null, 'on'));

    if (this.accessory.context.config.brightness) {
      service
        .getCharacteristic(this.api.hap.Characteristic.Brightness)
        .onSet((state) => this.handler.set(state, this.accessory, null, null, 'brightness'));
    }

    if (this.accessory.context.config.color) {
      service
        .getCharacteristic(this.api.hap.Characteristic.ColorTemperature)
        .onSet((state) => this.handler.set(state, this.accessory, null, null, 'temperature'));

      service
        .getCharacteristic(this.api.hap.Characteristic.Saturation)
        .onSet((state) => this.handler.set(state, this.accessory, null, null, 'color'));
    }
  }
}

module.exports = Accessory;
