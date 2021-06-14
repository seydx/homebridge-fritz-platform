'use strict';

const FormData = require('form-data');
const logger = require('../utils/logger');

class Telegram {
  constructor() {
    this.configured = false;

    this.request = {
      protocol: 'https:',
      host: 'api.telegram.org',
      port: 443,
      method: 'POST',
    };
  }

  configure(options) {
    this.token = options.token;
    this.chatID = options.chatID;
    this.messages = options.messages;
    this.request.path = `/bot${options.token}/sendMessage`;

    this.configured = true;
    logger.debug('Telegram successfully configured!');

    return this;
  }

  send(target, dest, replacer, additional) {
    if (!this.configured) {
      logger.debug('Telegram is not configured! Skipping message.');
      return;
    }

    if (this.messages[target] && this.messages[target][dest]) {
      let message = this.messages[target][dest];

      if (message.includes('@') && replacer) {
        message = message.replace('@', replacer);
      }

      if (message.includes('%') && additional) {
        message = message.replace('%', additional);
      }

      logger.debug(`Telegram: Sending Message: ${message}`);

      const form = new FormData();

      this.request.headers = form.getHeaders();
      form.append('chat_id', this.chatID);
      form.append('parse_mode', 'Markdown');
      form.append('text', message);

      form.submit(this.request, (err, res) => {
        if (err) {
          logger.error('An error occured during sending telegram message!');
          logger.error(err);
        }

        if (res.statusCode < 200 || res.statusCode > 200) {
          logger.error('A response error occured during sending telegram message!');
          logger.error({
            code: res.statusCode,
            message: res.statusMessage,
          });
        }
      });
    } else {
      logger.debug(`Telegram: Skip sending, no message defined for ${target}`);
    }
  }
}

const telegram = new Telegram();
module.exports = telegram;
