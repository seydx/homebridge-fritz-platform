'use strict';

const logger = require('../../../utils/logger');
const Handler = require('../presence.handler');

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

  async getService() {
    let service = this.accessory.getService(this.api.hap.Service.OccupancySensor);
    let serviceOld = this.accessory.getService(this.api.hap.Service.MotionSensor);

    if (serviceOld) {
      logger.info('Removing Motion service', this.accessory.displayName);
      this.accessory.removeService(serviceOld);
    }

    if (!service) {
      logger.info('Adding Occupancy service', this.accessory.displayName);
      service = this.accessory.addService(
        this.api.hap.Service.OccupancySensor,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    service
      .getCharacteristic(this.api.hap.Characteristic.OccupancyDetected)
      .on('change', (context) => this.handler.change(context, this.accessory));
  }
}

module.exports = Accessory;
