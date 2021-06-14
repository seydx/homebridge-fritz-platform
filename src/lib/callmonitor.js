'use strict';

const net = require('net');
const logger = require('../utils/logger');

class Callmonitor {
  constructor() {
    this.client = false;
    this.configured = false;
  }

  configure(options) {
    if (this.configured) {
      return;
    }

    this.ip = options.ip;
    this.port = options.port;

    this.configured = true;

    this.connect();
  }

  connect() {
    if (!this.configured) {
      throw new Error('Callmonitor is not configured!');
    }

    logger.debug('Connecting to Callmonitor...');

    this.client = net.createConnection(this.port, this.ip, () =>
      logger.info(`Callmonitor connection established with ${this.ip}:${this.port}`)
    );

    this.client.on('error', (error) => {
      logger.error('Callmonitor: An error occured!');

      if (error.errno == 'ECONNREFUSED' || error.code == 'ECONNREFUSED') {
        logger.warn(`Callmonitor: Can not connect to ${this.ip}:${this.port} - Dial #96*5* to enable port 1012`);
      } else if (error.errno == 'EHOSTUNREACH' || error.code == 'EHOSTUNREACH') {
        logger.warn(`Callmonitor: Can not connect to ${this.ip}:${this.port} - IP address seems to be wrong!`);
      } else if (error.errno == 'ENETUNREACH') {
        logger.warn('Callmonitor: Network currently not reachable!');
        this.reconnect();
      } else {
        logger.error(error);
      }
    });

    this.client.on('close', () => logger.info('Callmonitor: Connection closed!'));
    this.client.on('end', () => logger.info('Callmonitor: Connection ended!'));

    return;
  }

  stop() {
    if (this.client) {
      logger.info('Callmonitor: Shutting down...');
      this.client.destroy();
    }
  }

  reconnect() {
    logger.info('Callmonitor: Reconnecting...');

    setTimeout(() => {
      if (this.client) {
        this.client.removeAllListeners();
      }

      this.connect();
    }, 10000);
  }
}

const callmonitor = new Callmonitor();
module.exports = callmonitor;
