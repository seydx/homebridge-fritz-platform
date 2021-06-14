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
    let serviceSwitch = this.accessory.getService(this.api.hap.Service.Switch);
    let serviceLightbulb = this.accessory.getService(this.api.hap.Service.Lightbulb);
    let serviceTemp = this.accessory.getService(this.api.hap.Service.TemperatureSensor);
    let serviceOutlet = this.accessory.getService(this.api.hap.Service.Outlet);

    if (serviceOutlet) {
      logger.info('Removing Outlet service', this.accessory.displayName);
      this.accessory.removeService(serviceOutlet);
    }

    if (!serviceSwitch) {
      logger.info('Adding Switch service', this.accessory.displayName);
      serviceSwitch = this.accessory.addService(
        this.api.hap.Service.Switch,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    if (!serviceLightbulb) {
      logger.info('Adding Lightbulb service', this.accessory.displayName);
      serviceLightbulb = this.accessory.addService(
        this.api.hap.Service.Lightbulb,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    if (this.accessory.context.config.temperature) {
      if (!serviceTemp) {
        logger.info('Adding Temperature service', this.accessory.displayName);
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

    if (!this.accessory.context.config.readOnly) {
      serviceSwitch
        .getCharacteristic(this.api.hap.Characteristic.On)
        .onSet((state) => this.handler.set(state, this.accessory, null, 'on'));
    } else {
      serviceSwitch.getCharacteristic(this.api.hap.Characteristic.On).onSet((state) => {
        logger.info('Changing state not allowed - "readOnly" is active!', this.accessory.displayName);
        setTimeout(() => serviceSwitch.getCharacteristic(this.api.hap.Characteristic.On).updateValue(!state), 1000);
      });
    }

    if (this.accessory.context.config.brightness) {
      serviceLightbulb
        .getCharacteristic(this.api.hap.Characteristic.Brightness)
        .onSet((state) => this.handler.set(state, this.accessory, null, 'brightness'));
    }

    if (this.accessory.context.config.color) {
      serviceLightbulb
        .getCharacteristic(this.api.hap.Characteristic.ColorTemperature)
        .onSet((state) => this.handler.set(state, this.accessory, null, 'temperature'));

      serviceLightbulb
        .getCharacteristic(this.api.hap.Characteristic.Saturation)
        .onSet((state) => this.handler.set(state, this.accessory, null, 'color'));
    }
  }
}

module.exports = Accessory;
