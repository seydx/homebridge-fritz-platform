'use strict';

const logger = require('../../utils/logger');

const timeout = (ms) => new Promise((res) => setTimeout(res, ms));

class Handler {
  constructor() {
    this.configured = false;
  }

  configure(api, accessories, polling, meshMaster) {
    if (this.configured) {
      return this;
    }

    this.api = api;
    this.accessories = accessories;
    this.polling = polling;
    this.fritzbox = meshMaster.fritzbox;

    this.configured = true;

    return this;
  }

  // eslint-disable-next-line no-unused-vars
  async change(context, accessory, subtype, historyService) {}

  // eslint-disable-next-line no-unused-vars
  async get(accessory, subtype, ownCharacteristic) {
    return false;
  }

  // eslint-disable-next-line no-unused-vars
  async set(state, accessory, subtype, ownCharacteristic) {
    if (!state) {
      return;
    }

    if (!this.configured) {
      logger.debug('WOL: Handler not configured yet. Skipping SET event.');
      return;
    }

    // eslint-disable-next-line no-unused-vars
    subtype = subtype || accessory.context.config.subtype;

    accessory.context.busy = true;

    try {
      logger.info('ON', `${accessory.displayName} (${subtype})`);

      await this.fritzbox.exec('urn:LanDeviceHosts-com:serviceId:Hosts1', 'X_AVM-DE_WakeOnLANByMACAddress', {
        NewMACAddress: accessory.context.config.address,
      });
    } catch (err) {
      logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
      logger.error(err);
    } finally {
      setTimeout(
        () =>
          accessory
            .getService(this.api.hap.Service.Switch)
            .getCharacteristic(this.api.hap.Characteristic.On)
            .updateValue(false),
        1000
      );
    }

    accessory.context.busy = false;
  }

  async poll() {
    await timeout(1000); //wait for accessories to fully load
    logger.debug('Polling WOL accessories');
  }
}

const handler = new Handler();
module.exports = handler;
