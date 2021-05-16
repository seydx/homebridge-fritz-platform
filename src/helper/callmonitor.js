'use strict';

const Logger = require('./logger.js');

const net = require('net');

class Callmonitor {
  constructor(options) {
    this.ip = options.ip;
    this.port = options.port;

    this.country = options.country;
    this.incomingTo = options.incomingTo;
    this.outgoingFrom = options.outgoingFrom;

    this.client = false;
  }

  connect() {
    Logger.debug('Connecting to Callmonitor...');

    this.client = net.createConnection(this.port, this.ip, () => {
      Logger.info('Callmonitor connection established with ' + this.ip + ':' + this.port);
    });

    this.client.on('error', (error) => {
      Logger.error('Callmonitor: An error occured!');

      if (error.errno == 'ECONNREFUSED' || error.code == 'ECONNREFUSED') {
        Logger.warn(
          'Callmonitor: Can not connect to ' + this.ip + ':' + this.port + ' - Dial #96*5* to enable port 1012'
        );
      } else if (error.errno == 'EHOSTUNREACH' || error.code == 'EHOSTUNREACH') {
        Logger.warn(
          'Callmonitor: Can not connect to ' + this.ip + ':' + this.port + ' - IP address seems to be wrong!'
        );
      } else if (error.errno == 'ENETUNREACH') {
        Logger.warn('Callmonitor: Network currently not reachable!');
        this.reconnect();
      } else {
        Logger.error(error);
      }
    });

    this.client.on('close', () => {
      Logger.info('Callmonitor: Connection closed!');
    });

    this.client.on('end', () => {
      Logger.info('Callmonitor: Connection ended!');
    });

    return;
  }

  stop() {
    if (this.client) {
      Logger.info('Callmonitor: Shutting down...');
      this.client.destroy();
    }

    return;
  }

  reconnect() {
    Logger.info('Callmonitor: Reconnecting...');

    setTimeout(() => {
      if (this.client) this.client.removeAllListeners();

      this.connect();
    }, 10000);
  }
}

module.exports = Callmonitor;
