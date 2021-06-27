'use strict';

const crypto = require('crypto');
const fs = require('fs-extra');
const logger = require('./logger');

exports.generateConfig = (config) => {
  return {
    name: config.name || 'FritzPlatform',
    debug: config.debug || false,
    devices: config.devices || [],
    presence: config.presence || [],
    childLock: config.childLock || [],
    wol: config.wol || [],
    smarthome: config.smarthome || [],
    network: config.network || [],
    callmonitor: config.callmonitor || {},
    extras: {
      alarm: config.extras && config.extras.alarm ? config.extras.alarm : {},
      wakeup: config.extras && config.extras.wakeup ? config.extras.wakeup : {},
      ringlock: config.extras && config.extras.ringlock ? config.extras.ringlock : {},
      phoneBook: config.extras && config.extras.phoneBook ? config.extras.phoneBook : {},
      dnsServer: config.extras && config.extras.dnsServer ? config.extras.dnsServer : {},
      fallbackInternet: config.extras && config.extras.fallbackInternet ? config.extras.fallbackInternet : {},
    },
    options: {
      polling: {
        timer:
          config.options && config.options.polling && parseInt(config.options.polling.timer) > 14
            ? parseInt(config.options.polling.timer)
            : 15,
        timerSmarthomeButtons:
          config.options && config.options.polling && parseInt(config.options.polling.timerSmarthomeButtons) > 0
            ? parseInt(config.options.polling.timerSmarthomeButtons)
            : 5,
        exclude:
          config.options && config.options.polling && config.options.polling.exclude
            ? config.options.polling.exclude
            : [],
      },
      presence: {
        anyone: config.options && config.options.presence && config.options.presence.anyone ? true : false,
        accType:
          config.options && config.options.presence && config.options.presence.accType
            ? config.options.presence.accType
            : 'occupancy',
      },
      reboot: {
        on: config.options && config.options.reboot && config.options.reboot.on ? config.options.reboot.on : false,
        off: config.options && config.options.reboot && config.options.reboot.off ? config.options.reboot.off : false,
      },
    },
    telegram: {
      active: config.telegram && config.telegram.active ? true : false,
      token: config.telegram && config.telegram.token ? config.telegram.token : false,
      chatID: config.telegram && config.telegram.chatID ? config.telegram.chatID : false,
      messages: {
        presence:
          config.telegram && config.telegram && config.telegram.messages && config.telegram.messages.presence
            ? config.telegram.messages.presence
            : {},
        callmonitor:
          config.telegram && config.telegram && config.telegram.messages && config.telegram.messages.callmonitor
            ? config.telegram.messages.callmonitor
            : {},
        alarm:
          config.telegram && config.telegram && config.telegram.messages && config.telegram.messages.alarm
            ? config.telegram.messages.alarm
            : {},
        reboot:
          config.telegram && config.telegram && config.telegram.messages && config.telegram.messages.reboot
            ? config.telegram.messages.reboot
            : {},
        network:
          config.telegram && config.telegram && config.telegram.messages && config.telegram.messages.network
            ? config.telegram.messages.network
            : {},
        outlet:
          config.telegram && config.telegram && config.telegram.messages && config.telegram.messages.outlet
            ? config.telegram.messages.outlet
            : {},
      },
    },
  };
};

exports.createPluginStorageDir = async (path) => {
  try {
    await fs.ensureDir(path);
  } catch (err) {
    logger.warn('Can not create fritzbox directory into your homebridge directory. Please create it manually.');
  }
};

//github.com/homebridge/HAP-NodeJS/blob/master/src/lib/util/uuid.ts
exports.UUIDgenerate = (data) => {
  const sha1sum = crypto.createHash('sha1');
  sha1sum.update(data);
  const s = sha1sum.digest('hex');
  let i = -1;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    i += 1;
    switch (c) {
      case 'y':
        return ((parseInt('0x' + s[i], 16) & 0x3) | 0x8).toString(16);
      case 'x':
      default:
        return s[i];
    }
  });
};

exports.validIP = (ip) => {
  if (
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      ip
    )
  ) {
    return ip;
  }

  return false;
};

exports.validMAC = (mac) => {
  if (/^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/.test(mac)) {
    return mac;
  }

  return false;
};
