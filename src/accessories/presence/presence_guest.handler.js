'use strict';

const moment = require('moment');
const logger = require('../../utils/logger');
const Telegram = require('../../lib/telegram');

class Handler {
  constructor() {
    this.hosts = [];
    this.configured = false;
  }

  configure(api, accessories, polling, meshMaster) {
    if (this.configured) {
      return this;
    }

    this.api = api;
    this.accessories = accessories;
    this.polling = polling;
    this.wifiUnitGuest = meshMaster.wifiUnits + 1;
    this.fritzbox = meshMaster.fritzbox;

    this.configured = true;

    setTimeout(() => this.poll(), 1000);

    return this;
  }

  // eslint-disable-next-line no-unused-vars
  async change(context, accessory, subtype, historyService) {
    if (context.oldValue !== context.newValue) {
      if (!this.configured) {
        logger.debug(
          'Handler not configured yet. Skipping CHANGE event.',
          `${accessory.displayName} (${accessory.context.config.subtype})`
        );
        return;
      }

      subtype = subtype || accessory.context.config.subtype;

      if (historyService) {
        const lastActivation = moment().unix() - historyService.getInitialTime();

        accessory
          .getService(this.api.hap.Service.MotionSensor)
          .getCharacteristic(this.api.hap.Characteristic.LastActivation)
          .updateValue(lastActivation);

        historyService.addEntry({ time: moment().unix(), status: context.newValue ? 1 : 0 });
      }

      let dest = false;

      if (context.newValue) {
        dest = 'guest_in';

        logger.info(
          'Someone connected to Guest Wifi',
          `${accessory.displayName} (${accessory.context.config.subtype})`
        );
      } else {
        dest = 'guest_out';

        logger.info('No one connected to Guest Wifi', `${accessory.displayName} (${accessory.context.config.subtype})`);
      }

      Telegram.send('presence', dest, false);
    }
  }

  // eslint-disable-next-line no-unused-vars
  async get(accessory, subtype, ownCharacteristic) {
    if (!this.configured) {
      logger.debug(
        'Handler not configured yet. Skipping GET event.',
        `${accessory.displayName} (${accessory.context.config.subtype})`
      );
      return accessory.context.config.subtype === 'motion' ? false : 0;
    }

    // eslint-disable-next-line no-unused-vars
    subtype = subtype || accessory.context.config.subtype;

    const service =
      accessory.context.config.subtype === 'motion'
        ? this.api.hap.Service.MotionSensor
        : this.api.hap.Service.OccupancySensor;

    const characteristic =
      accessory.context.config.subtype === 'motion'
        ? this.api.hap.Characteristic.MotionDetected
        : this.api.hap.Characteristic.OccupancyDetected;

    let state = accessory.getService(service).getCharacteristic(characteristic).value;

    const response = await this.fritzbox.exec(
      `urn:WLANConfiguration-com:serviceId:WLANConfiguration${this.wifiUnitGuest}`,
      'GetTotalAssociations'
    );

    logger.debug(response, `${accessory.displayName} (${subtype})`);

    const connectedToGuestWifi = parseInt(response.NewTotalAssociations);

    if (connectedToGuestWifi) {
      state = accessory.context.config.subtype === 'motion' ? true : 1;
    } else {
      state = accessory.context.config.subtype === 'motion' ? false : 0;
    }

    accessory.getService(service).getCharacteristic(characteristic).updateValue(state);

    return state;
  }

  // eslint-disable-next-line no-unused-vars
  async set(state, accessory, subtype, ownCharacteristic) {}

  async poll() {
    try {
      const guestAccessory = this.accessories.find((accessory) => accessory && accessory.displayName === 'Guest');

      await this.get(guestAccessory);
    } catch (err) {
      logger.warn('An error occurred during polling guest device!');
      logger.error(err);
    } finally {
      setTimeout(() => this.poll(), this.polling.timer * 1000);
    }
  }
}

const handler = new Handler();
module.exports = handler;
