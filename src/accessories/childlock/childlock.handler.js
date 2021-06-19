'use strict';

const logger = require('../../utils/logger');

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

    setTimeout(() => this.poll(), 1000);

    return this;
  }

  // eslint-disable-next-line no-unused-vars
  async change(context, accessory, subtype, historyService) {}

  // eslint-disable-next-line no-unused-vars
  async get(accessory, subtype, ownCharacteristic) {
    if (!this.configured) {
      logger.debug(
        'Handler not configured yet. Skipping GET event.',
        `${accessory.displayName} (${accessory.context.config.subtype})`
      );
      return false;
    }

    subtype = subtype || accessory.context.config.subtype;

    let state = accessory
      .getService(this.api.hap.Service.Switch)
      .getCharacteristic(this.api.hap.Characteristic.On).value;

    if (accessory.context.busy) {
      return state;
    }

    try {
      const response = await this.fritzbox.exec(
        'urn:X_AVM-DE_HostFilter-com:serviceId:X_AVM-DE_HostFilter1',
        'GetWANAccessByIP',
        {
          NewIPv4Address: accessory.context.config.ip,
        }
      );
      logger.debug(response, `${accessory.displayName} (${subtype})`);

      state = response.NewWANAccess === 'granted' || response.NewDisallow === '0';
    } catch (err) {
      logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
      logger.error(err);
    }

    return state;
  }

  // eslint-disable-next-line no-unused-vars
  async set(state, accessory, subtype, ownCharacteristic) {
    if (!this.configured) {
      logger.debug(
        'Handler not configured yet. Skipping SET event.',
        `${accessory.displayName} (${accessory.context.config.subtype})`
      );
      return;
    }

    subtype = subtype || accessory.context.config.subtype;

    accessory.context.busy = true;

    logger.info(`${state ? 'ON' : 'OFF'} (${subtype})`, `${accessory.displayName} (${subtype})`);

    try {
      await this.fritzbox.exec('urn:X_AVM-DE_HostFilter-com:serviceId:X_AVM-DE_HostFilter1', 'DisallowWANAccessByIP', {
        NewIPv4Address: accessory.context.config.ip,
        NewDisallow: state ? 0 : 1, //0: allow - 1: disallow
      });
    } catch (err) {
      logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
      logger.error(err);
    }

    accessory.context.busy = false;
  }

  async poll() {
    try {
      const accessories = this.accessories.filter((accessory) => accessory.context.config.type === 'childlock');

      for (const accessory of accessories) {
        await this.get(accessory);
      }
    } catch (err) {
      logger.warn('An error occurred during polling smarthome devices!');
      logger.error(err);
    } finally {
      setTimeout(() => this.poll(), this.polling.timer * 1000);
    }
  }
}

const handler = new Handler();
module.exports = handler;
