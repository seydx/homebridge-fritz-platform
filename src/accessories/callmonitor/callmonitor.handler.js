'use strict';

const moment = require('moment');
const logger = require('../../utils/logger');
const { getPhonebook, getBlackbook, parseMessage } = require('./callmonitor.utils');
const Callmonitor = require('../../lib/callmonitor');
const Telegram = require('../../lib/telegram');

const timeout = (ms) => new Promise((res) => setTimeout(res, ms));

class Handler {
  constructor() {
    this.call = {};
    this.from = {};
    this.incomingState = 0;
    this.outgoingState = 0;

    this.callerNr = null;
    this.callerName = null;
    this.denyCall = null;
    this.inbound = null;
    this.outgoing = null;
    this.homeNr = null;

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

    this.poll();

    return this;
  }

  async change(context, accessory, subtype, historyService) {
    if (context.oldValue !== context.newValue) {
      if (!this.configured) {
        logger.debug('Callmonitor: Handler not configured yet. Skipping CHANGE event.');
        return;
      }

      subtype = subtype || accessory.context.config.subtype;

      if (context.newValue) {
        accessory.context.timesOpened = accessory.context.timesOpened || 0;
        accessory.context.timesOpened += 1;

        let lastActivation = moment().unix() - historyService.getInitialTime();
        let closeDuration = moment().unix() - historyService.getInitialTime();

        accessory
          .getService(this.api.hap.Service.ContactSensor)
          .getCharacteristic(this.api.hap.Characteristic.LastActivation)
          .updateValue(lastActivation);

        accessory
          .getService(this.api.hap.Service.ContactSensor)
          .getCharacteristic(this.api.hap.Characteristic.TimesOpened)
          .updateValue(accessory.context.timesOpened);

        accessory
          .getService(this.api.hap.Service.ContactSensor)
          .getCharacteristic(this.api.hap.Characteristic.ClosedDuration)
          .updateValue(closeDuration);
      } else {
        let openDuration = moment().unix() - historyService.getInitialTime();

        accessory
          .getService(this.api.hap.Service.ContactSensor)
          .getCharacteristic(this.api.hap.Characteristic.ClosedDuration)
          .updateValue(openDuration);
      }

      historyService.addEntry({ time: moment().unix(), status: context.newValue ? 1 : 0 });

      if (!this.denyCall) {
        let dest;

        if (context.newValue) {
          dest = this.inbound ? 'incoming' : 'outgoing';
        } else {
          dest = 'disconnected';
        }

        Telegram.send(
          'callmonitor',
          dest,
          this.callerName ? `${this.callerName} (${this.callerNr})` : this.callerNr,
          this.homeNr
        );
      }
    }
  }

  // eslint-disable-next-line no-unused-vars
  async get(accessory, subtype, ownCharacteristic) {
    if (!this.configured) {
      logger.debug('Callmonitor: Handler not configured yet. Skipping GET event.');
      return 0;
    }

    subtype = subtype || accessory.context.config.subtype;

    let state = accessory
      .getService(this.api.hap.Service.ContactSensor)
      .getCharacteristic(this.api.hap.Characteristic.ContactSensorState).value;

    if (subtype === 'incoming') {
      state = this.incomingState;

      if (this.from.caller) {
        accessory
          .getService(this.api.hap.Service.ContactSensor)
          .getCharacteristic(this.api.hap.Characteristic.Caller)
          .updateValue(this.from.caller);
      }
    } else if (subtype === 'outgoing') {
      state = this.outgoingState;

      if (this.from.called) {
        accessory
          .getService(this.api.hap.Service.ContactSensor)
          .getCharacteristic(this.api.hap.Characteristic.Called)
          .updateValue(this.from.called);
      }
    } else if (subtype === 'group') {
      state = this.incomingState || this.outgoingState;

      if (this.from.caller) {
        accessory
          .getService(this.api.hap.Service.ContactSensor)
          .getCharacteristic(this.api.hap.Characteristic.Caller)
          .updateValue(this.from.caller);
      }

      if (this.from.called) {
        accessory
          .getService(this.api.hap.Service.ContactSensor)
          .getCharacteristic(this.api.hap.Characteristic.Called)
          .updateValue(this.from.called);
      }
    } else {
      logger.warn(`Can not handle GET event. Unknown subtype (${subtype})`, `${accessory.displayName} (${subtype})`);
    }

    accessory
      .getService(this.api.hap.Service.ContactSensor)
      .getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
      .updateValue(state);

    return state;
  }

  // eslint-disable-next-line no-unused-vars
  async set(state, accessory, subtype, ownCharacteristic) {}

  async poll() {
    await timeout(1000); //wait for accessories to fully load
    logger.debug('Polling CALLMONITOR accessories');

    let accessory, text, message;

    Callmonitor.client.on('data', async (chunk) => {
      let data = parseMessage(chunk);

      if (data[1] === 'ring') {
        accessory =
          this.accessories.find((accessory) => accessory.context.config?.subtype === 'incoming') ||
          this.accessories.find((accessory) => accessory.context.config?.subtype === 'group');

        this.call[data[2]] = {
          type: 'inbound',
          start: data[0],
          caller: data[3],
          called: data[4],
        };

        message = {
          time: data[0],
          caller: data[3],
          called: data[4],
        };

        let called = message.called.replace(/\D/g, '');
        let caller = message.caller.replace(/\D/g, '');

        this.callerNr = caller;
        this.callerName = false;
        this.denyCall = false;
        this.inbound = true;
        this.outgoing = false;
        this.homeNr = called;

        text = `Incoming call from: ${
          this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr
        } to ${this.homeNr}`;

        let phoneBook = await getPhonebook(this.api.user.storagePath());
        let blackBook = await getBlackbook(this.api.user.storagePath());

        phoneBook.forEach((entry) => {
          let callerToNr = entry.number.find((nr) => nr === message.caller || nr === this.callerNr);

          if (callerToNr) {
            this.callerName = entry.name;
            text = `Incoming call from: ${this.callerName} (${this.callerNr}) to ${this.homeNr}`;
          }
        });

        blackBook.forEach((entry) => {
          let callerToNr = entry.number.find((nr) => nr === message.caller || nr === this.callerNr);
          this.denyCall = callerToNr ? true : false;
        });

        if (accessory.context.config.filterIncoming.length) {
          if (
            accessory.context.config.filterIncoming.includes(message.caller) ||
            accessory.context.config.filterIncoming.includes(this.callerNr)
          ) {
            logger.debug(
              '"filterIncoming" nr matched!',
              `${accessory.displayName} (${accessory.context.config.subtype})`
            );
            logger.info(text, `${accessory.displayName} (${accessory.context.config.subtype})`);

            this.denyCall = false;
            this.from = { caller: this.callerNr };
            this.incomingState = 1;
            this.outgoingState = 0;

            return await this.get(accessory, 'incoming');
          } else {
            logger.info(
              `"filterIncoming" nr not matched. Receiving new call from ${
                this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr
              } to ${this.homeNr}`,
              accessory.displayName
            );

            this.denyCall = true;
          }
        } else {
          if (accessory.context.config.incomingTo.length) {
            if (
              accessory.context.config.incomingTo.includes(message.called) ||
              accessory.context.config.incomingTo.includes(this.homeNr)
            ) {
              logger.debug(
                '"incomingTo" nr matched!',
                `${accessory.displayName} (${accessory.context.config.subtype})`
              );
              logger.info(text, `${accessory.displayName} (${accessory.context.config.subtype})`);

              if (this.denyCall) {
                logger.debug(
                  `Blocking notification for ${
                    this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr
                  }`,
                  accessory.displayName
                );

                return;
              }

              this.from = { caller: this.callerNr };
              this.incomingState = 1;
              this.outgoingState = 0;

              await this.get(accessory, 'incoming');
            } else {
              logger.info(
                `"incomingTo" nr not matched. Receiving new call from ${
                  this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr
                } to ${this.homeNr}`,
                accessory.displayName
              );
            }
          } else {
            logger.info(
              `Receiving new call from ${
                this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr
              } to ${this.homeNr}`,
              accessory.displayName
            );

            this.from = { caller: this.callerNr };
            this.incomingState = 1;
            this.outgoingState = 0;

            await this.get(accessory, 'incoming');
          }
        }
      }

      if (data[1] === 'call') {
        accessory =
          this.accessories.find((accessory) => accessory.context.config?.subtype === 'outgoing') ||
          this.accessories.find((accessory) => accessory.context.config?.subtype === 'group');

        this.call[data[2]] = {
          type: 'outbound',
          start: data[0],
          extension: data[3],
          caller: data[4],
          called: data[5],
        };

        message = {
          time: data[0],
          extension: data[3],
          caller: data[4],
          called: data[5],
        };

        let caller = message.caller.replace(/\D/g, '');
        let called = message.called.replace(/\D/g, '');

        this.callerName = false;
        this.callerNr = called;
        this.denyCall = false;
        this.outgoing = true;
        this.inbound = false;
        this.homeNr = caller;

        text = `Outgoing call from: ${this.homeNr} to ${
          this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr
        }`;

        const phoneBook = await getPhonebook(this.api.user.storagePath());
        const blackBook = await getBlackbook(this.api.user.storagePath());

        phoneBook.forEach((entry) => {
          let callerToNr = entry.number.find((nr) => nr === message.called || nr === this.callerNr);
          if (callerToNr) {
            this.callerName = entry.name;
            text = `Calling ${this.callerName} (${this.callerNr}) from ${this.homeNr}`;
          }
        });

        blackBook.forEach((entry) => {
          let callerToNr = entry.number.find((nr) => nr === message.called || nr === this.callerNr);
          this.denyCall = callerToNr ? true : false;
        });

        if (accessory.context.config.outgoingFrom.length) {
          if (
            accessory.context.config.outgoingFrom.includes(message.caller) ||
            accessory.context.config.outgoingFrom.includes(this.homeNr)
          ) {
            logger.debug(
              '"outgoingFrom" nr matched!',
              `${accessory.displayName} (${accessory.context.config.subtype})`
            );
            logger.info(text, `${accessory.displayName} (${accessory.context.config.subtype})`);

            if (!this.denyCall) {
              logger.debug(
                `Blocking notification for ${this.homeNr}`,
                `${accessory.displayName} (${accessory.context.config.subtype})`
              );

              return;
            }

            this.from = { called: this.callerNr };
            this.incomingState = 0;
            this.outgoingState = 1;

            await this.get(accessory, 'outgoing');
          } else {
            logger.info(
              `"outgoingFrom" nr not matched. Calling from ${this.homeNr} to ${
                this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr
              }`,
              accessory.displayName
            );
          }
        } else {
          logger.info(
            `Calling from ${this.homeNr} to ${
              this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr
            }`,
            accessory.displayName
          );

          this.from = { called: this.callerNr };
          this.incomingState = 0;
          this.outgoingState = 1;

          await this.get(accessory, 'outgoing');
        }
      }

      if (data[1] === 'connect') {
        if (this.call[data[2]]) {
          this.call[data[2]]['connect'] = data[0];

          message = {
            time: data[0],
            extension: this.call[data[2]]['extension'],
            caller: this.call[data[2]]['caller'],
            called: this.call[data[2]]['called'],
          };

          logger.debug(
            `Connection established between: ${this.homeNr} and ${
              this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr
            }`,
            accessory.displayName
          );
        }
      }

      if (data[1] === 'disconnect') {
        if (this.call[data[2]]) {
          this.call[data[2]].disconnect = data[0];
          this.call[data[2]].duration = parseInt(data[3], 10);

          let call = this.call[data[2]];
          delete this.call[data[2]];

          message = call;

          if (accessory.context.config.incomingTo.length || accessory.context.config.outgoingFrom.length) {
            if (
              accessory.context.config.incomingTo.includes(message.called) ||
              accessory.context.config.incomingTo.includes(this.homeNr) ||
              accessory.context.config.outgoingFrom.includes(message.caller) ||
              accessory.context.config.outgoingFrom.includes(this.callerNr)
            ) {
              logger.info(
                `Call disconnected with ${
                  this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr
                }`,
                accessory.displayName
              );

              if (this.denyCall) {
                logger.debug(
                  `Blocking notification for ${
                    this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr
                  }`,
                  accessory.displayName
                );

                return;
              }

              this.from = {};
              this.incomingState = 0;
              this.outgoingState = 0;

              await this.get(accessory, message.type === 'inbound' ? 'incoming' : 'outgoing');
            } else {
              logger.debug(
                `${
                  message.type === 'inbound' ? '"incomingTo"' : '"outgoingFrom"'
                } nr not matched. Call disconnected with ${
                  this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr
                }`,
                accessory.displayName
              );
            }
          } else {
            logger.debug(
              `Call disconnected with ${
                this.callerName ? this.callerName + ' (' + this.callerNr + ')' : this.callerNr
              }`,
              accessory.displayName
            );

            this.from = {};
            this.incomingState = 0;
            this.outgoingState = 0;

            await this.get(accessory, message.type === 'inbound' ? 'incoming' : 'outgoing');
          }
        }
      }
    });
  }
}

const handler = new Handler();
module.exports = handler;
