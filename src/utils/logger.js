'use strict';

class Logger {
  constructor() {
    this.log = console;
    this.debugMode = false;
  }

  configure(logger, debug) {
    this.log = logger;
    this.debugMode = debug;
  }

  formatMessage(message, accessoryName, debug) {
    let formatted = debug ? '[DEBUG] ' : '';

    if (accessoryName) {
      formatted += accessoryName + ': ';
    }

    if (message instanceof Error) {
      formatted = message;
    } else if (typeof message === 'object') {
      formatted += JSON.stringify(message);
    } else {
      formatted += message;
    }

    return formatted;
  }

  info(message, accessoryName) {
    this.log.info(this.formatMessage(message, accessoryName));
  }

  warn(message, accessoryName) {
    this.log.warn(this.formatMessage(message, accessoryName));
  }

  error(message, accessoryName) {
    this.log.error(this.formatMessage(message, accessoryName));
  }

  debug(message, accessoryName) {
    if (this.debugMode) {
      this.log.info(this.formatMessage(message, accessoryName, true));
    }
  }
}

const logger = new Logger();
module.exports = logger;
