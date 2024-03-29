'use strict';

const logger = require('../../../utils/logger');
const Handler = require('../smarthome-button.handler');

class Accessory {
  constructor(api, accessory, accessories, meshMaster) {
    this.api = api;
    this.accessory = accessory;
    this.accessories = accessories;
    this.meshMaster = meshMaster;

    //Buttons needs own Handler due to shorter polling timer
    this.handler = Handler.configure(
      this.api,
      this.accessories,
      this.accessory.context.config.polling,
      this.meshMaster
    );

    this.getService();
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService() {
    /*
     * if buttons = 4
     * button 1: top left
     * button 2: top right
     * button 3: bottom left
     * bottom 4: bottom right
     */

    const buttons = this.accessory.context.config.buttons;

    if (buttons && this.accessory.context.config.battery) {
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

    for (let i = 0; i < buttons; i++) {
      let identifier = i + 1;

      let service = this.accessory.getServiceById(
        this.api.hap.Service.StatelessProgrammableSwitch,
        `${this.accessory.context.config.subtype}-${identifier}`
      );

      if (!service) {
        logger.info(
          `Adding StatelessProgrammableSwitch service (${this.accessory.context.config.subtype}-${identifier})`,
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service = this.accessory.addService(
          this.api.hap.Service.StatelessProgrammableSwitch,
          this.accessory.displayName,
          `${this.accessory.context.config.subtype}-${identifier}`
        );
      }

      service.getCharacteristic(this.api.hap.Characteristic.ProgrammableSwitchEvent).setProps({
        validValues: this.accessory.context.config.longPress ? [0, 2] : [0],
      });

      service.setCharacteristic(this.api.hap.Characteristic.ServiceLabelIndex, identifier);
    }
  }
}

module.exports = Accessory;
