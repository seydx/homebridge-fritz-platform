'use strict';

const Logger = require('../../helper/logger.js');

class SmarthomeSwitchLightbulbAccessory {
  constructor(api, accessory, handler) {
    this.api = api;
    this.accessory = accessory;

    this.handler = handler;

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
      Logger.info('Removing Outlet service', this.accessory.displayName);
      this.accessory.removeService(serviceOutlet);
    }

    if (!serviceSwitch) {
      Logger.info('Adding Switch service', this.accessory.displayName);
      serviceSwitch = this.accessory.addService(
        this.api.hap.Service.Switch,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    if (!serviceLightbulb) {
      Logger.info('Adding Lightbulb service', this.accessory.displayName);
      serviceLightbulb = this.accessory.addService(
        this.api.hap.Service.Lightbulb,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    if (this.accessory.context.config.temperature) {
      if (!serviceTemp) {
        Logger.info('Adding Temperature service', this.accessory.displayName);
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
      if (!serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Brightness))
        serviceLightbulb.addCharacteristic(this.api.hap.Characteristic.Brightness);
    } else {
      if (
        serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Brightness) &&
        !this.accessory.context.config.color
      )
        serviceLightbulb.removeCharacteristic(
          serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.Brightness)
        );
    }

    if (this.accessory.context.config.color) {
      if (!serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Brightness))
        serviceLightbulb.addCharacteristic(this.api.hap.Characteristic.Brightness);

      if (!serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Hue))
        serviceLightbulb.addCharacteristic(this.api.hap.Characteristic.Hue);

      if (!serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Saturation))
        serviceLightbulb.addCharacteristic(this.api.hap.Characteristic.Saturation);

      if (!serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.ColorTemperature))
        serviceLightbulb.addCharacteristic(this.api.hap.Characteristic.ColorTemperature);

      serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.ColorTemperature).setProps({
        minValue: 140,
        maxValue: 500,
      });

      if (this.api.versionGreaterOrEqual && this.api.versionGreaterOrEqual('v1.3.0-beta.23')) {
        this.adaptiveLightingController = new this.api.hap.AdaptiveLightingController(serviceLightbulb, {
          controllerMode: this.api.hap.AdaptiveLightingControllerMode.AUTOMATIC,
        });

        this.accessory.configureController(this.adaptiveLightingController);
        this.accessory.adaptiveLightingController = this.adaptiveLightingController;
      }
    } else {
      if (serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Brightness))
        serviceLightbulb.removeCharacteristic(
          serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.Brightness)
        );

      if (serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Hue))
        serviceLightbulb.removeCharacteristic(serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.Hue));

      if (serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.Saturation))
        serviceLightbulb.removeCharacteristic(
          serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.Saturation)
        );

      if (serviceLightbulb.testCharacteristic(this.api.hap.Characteristic.ColorTemperature))
        serviceLightbulb.removeCharacteristic(
          serviceLightbulb.getCharacteristic(this.api.hap.Characteristic.ColorTemperature)
        );
    }

    if (
      this.accessory.context.polling.timer &&
      !this.accessory.context.polling.exclude.includes(this.accessory.context.config.type) &&
      !this.accessory.context.polling.exclude.includes(this.accessory.context.config.subtype) &&
      !this.accessory.context.polling.exclude.includes(this.accessory.displayName)
    ) {
      if (!this.accessory.context.config.readOnly) {
        serviceSwitch
          .getCharacteristic(this.api.hap.Characteristic.On)
          .on(
            'set',
            this.handler.set.bind(
              this,
              this.accessory,
              this.api.hap.Service.Switch,
              this.api.hap.Characteristic.On,
              this.accessory.context.config.subtype,
              'on'
            )
          );
      } else {
        serviceSwitch.getCharacteristic(this.api.hap.Characteristic.On).on('set', (state, callback) => {
          Logger.info(
            'Can not be switched ' + (state ? 'ON' : 'OFF') + ' - "readOnly" is active!',
            this.accessory.displayName
          );

          setTimeout(() => {
            serviceSwitch.getCharacteristic(this.api.hap.Characteristic.On).updateValue(!state);
          }, 1000);

          callback(null);
        });
      }
    } else {
      if (!this.accessory.context.config.readOnly) {
        serviceSwitch
          .getCharacteristic(this.api.hap.Characteristic.On)
          .on(
            'get',
            this.handler.get.bind(
              this,
              this.accessory,
              this.api.hap.Service.Switch,
              this.api.hap.Characteristic.On,
              this.accessory.context.config.subtype,
              'on'
            )
          )
          .on(
            'set',
            this.handler.set.bind(
              this,
              this.accessory,
              this.api.hap.Service.Switch,
              this.api.hap.Characteristic.On,
              this.accessory.context.config.subtype,
              'on'
            )
          );
      } else {
        serviceSwitch
          .getCharacteristic(this.api.hap.Characteristic.On)
          .on(
            'get',
            this.handler.get.bind(
              this,
              this.accessory,
              this.api.hap.Service.Switch,
              this.api.hap.Characteristic.On,
              this.accessory.context.config.subtype,
              'on'
            )
          )
          .on('set', (state, callback) => {
            Logger.info(
              'Can not be switched ' + (state ? 'ON' : 'OFF') + ' - "readOnly" is active!',
              this.accessory.displayName
            );

            setTimeout(() => {
              serviceSwitch.getCharacteristic(this.api.hap.Characteristic.On).updateValue(!state);
            }, 1000);

            callback(null);
          });
      }
    }

    if (this.accessory.context.config.brightness)
      serviceLightbulb
        .getCharacteristic(this.api.hap.Characteristic.Brightness)
        .on(
          'set',
          this.handler.set.bind(
            this,
            this.accessory,
            this.api.hap.Service.Lightbulb,
            this.api.hap.Characteristic.Brightness,
            this.accessory.context.config.subtype,
            'brightness'
          )
        );

    if (this.accessory.context.config.color) {
      serviceLightbulb
        .getCharacteristic(this.api.hap.Characteristic.ColorTemperature)
        .on(
          'set',
          this.handler.set.bind(
            this,
            this.accessory,
            this.api.hap.Service.Lightbulb,
            this.api.hap.Characteristic.ColorTemperature,
            this.accessory.context.config.subtype,
            'temperature'
          )
        );

      serviceLightbulb
        .getCharacteristic(this.api.hap.Characteristic.Saturation)
        .on(
          'set',
          this.handler.set.bind(
            this,
            this.accessory,
            this.api.hap.Service.Lightbulb,
            this.api.hap.Characteristic.Saturation,
            this.accessory.context.config.subtype,
            'color'
          )
        );
    }
  }
}

module.exports = SmarthomeSwitchLightbulbAccessory;
