/* eslint-disable no-unused-vars */
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
    this.fritzbox = meshMaster?.fritzbox;

    this.configured = true;

    this.poll();

    return this;
  }

  async change(context, accessory, subtype, historyService) {}

  async get(accessory, subtype) {}

  async set(state, accessory, subtype) {}

  async poll() {
    await timeout(1000); //wait for accessories to fully load
    logger.debug('Polling NETWORK accessories');
  }
}

const handler = new Handler();
module.exports = handler;
