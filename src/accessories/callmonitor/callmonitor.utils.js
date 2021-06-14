'use strict';

const fs = require('fs-extra');
const logger = require('../../utils/logger');

exports.getPhonebook = async (storagePath) => {
  let phoneBook = [];

  try {
    await fs.ensureFile(`${storagePath}/fritzbox/phonebook.json`);
    phoneBook = (await fs.readJson(`${storagePath}/fritzbox/phonebook.json`, { throws: false })) || [];
  } catch (err) {
    logger.error('An error occured during reading phonebook!');
    logger.error(err);
  }

  return phoneBook;
};

exports.getBlackbook = async (storagePath) => {
  let blackBook = [];

  try {
    await fs.ensureFile(`${storagePath}/fritzbox/blackbook.json`);
    blackBook = (await fs.readJson(`${storagePath}/fritzbox/blackbook.json`, { throws: false })) || [];
  } catch (err) {
    logger.error('An error occured during reading blackbook!');
    logger.error(err);
  }

  return blackBook;
};

exports.dateToUnix = (string) => {
  let d = string.match(/[0-9]{2}/g);

  let result = '';
  result += '20' + d[2] + '-' + d[1] + '-' + d[0];
  result += ' ' + d[3] + ':' + d[4] + ':' + d[5];

  return Math.floor(new Date(result).getTime() / 1000);
};

exports.parseMessage = (buffer) => {
  let message = buffer
    .toString()
    .toLowerCase()
    .replace(/[\n\r]$/, '')
    .replace(/;$/, '')
    .split(';');

  message[0] = this.dateToUnix(message[0]);

  return message;
};
