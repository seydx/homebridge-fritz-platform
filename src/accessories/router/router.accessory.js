'use strict';

const logger = require('../../utils/logger');
const Handler = require('./router.handler');
const ExtrasHandler = require('../extras/extras.handler');

class Accessory {
  constructor(api, accessory, accessories, meshMaster) {
    this.api = api;
    this.accessory = accessory;

    this.handler = Handler.configure(api, accessories, accessory.context.config.polling, meshMaster);
    ExtrasHandler.configure(api, accessories, accessory.context.config.polling, meshMaster);

    this.getService();
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService() {
    let service = this.accessory.getService(this.api.hap.Service.Switch);
    const polling = this.accessory.context.config.polling;

    if (!service) {
      logger.info('Adding Switch service', `${this.accessory.displayName} (${this.accessory.context.config.subtype})`);
      service = this.accessory.addService(
        this.api.hap.Service.Switch,
        this.accessory.displayName,
        this.accessory.context.config.subtype
      );
    }

    const characteristics = this.accessory.context.config.characteristics;

    //WifiTwo
    if (characteristics.includes('wifi_2ghz')) {
      if (!service.testCharacteristic(this.api.hap.Characteristic.WifiTwo)) {
        logger.info(
          'Adding WifiTwo characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.addCharacteristic(this.api.hap.Characteristic.WifiTwo);
      }

      service
        .getCharacteristic(this.api.hap.Characteristic.WifiTwo)
        .onSet((state) => this.handler.set(state, this.accessory, 'wifi_2ghz', this.api.hap.Characteristic.WifiTwo));

      if (polling.exclude.includes('wifi_2ghz')) {
        service
          .getCharacteristic(this.api.hap.Characteristic.WifiTwo)
          .onGet(() => this.handler.get(this.accessory, 'wifi_2ghz', this.api.hap.Characteristic.WifiTwo));
      }
    } else {
      if (service.testCharacteristic(this.api.hap.Characteristic.WifiTwo)) {
        logger.info(
          'Removing WifiTwo characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiTwo));
      }
    }

    //WifiFive
    if (characteristics.includes('wifi_5ghz')) {
      if (!service.testCharacteristic(this.api.hap.Characteristic.WifiFive)) {
        logger.info(
          'Adding WifiFive characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.addCharacteristic(this.api.hap.Characteristic.WifiFive);
      }

      service
        .getCharacteristic(this.api.hap.Characteristic.WifiFive)
        .onSet((state) => this.handler.set(state, this.accessory, 'wifi_5ghz', this.api.hap.Characteristic.WifiFive));

      if (polling.exclude.includes('wifi_5ghz')) {
        service
          .getCharacteristic(this.api.hap.Characteristic.WifiFive)
          .onGet(() => this.handler.get(this.accessory, 'wifi_5ghz', this.api.hap.Characteristic.WifiFive));
      }
    } else {
      if (service.testCharacteristic(this.api.hap.Characteristic.WifiFive)) {
        logger.info(
          'Removing WifiFive characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiFive));
      }
    }

    //WifiGuest
    if (characteristics.includes('wifi_guest')) {
      if (!service.testCharacteristic(this.api.hap.Characteristic.WifiGuest)) {
        logger.info(
          'Adding WifiGuest characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.addCharacteristic(this.api.hap.Characteristic.WifiGuest);
      }

      service
        .getCharacteristic(this.api.hap.Characteristic.WifiGuest)
        .onSet((state) => this.handler.set(state, this.accessory, 'wifi_guest', this.api.hap.Characteristic.WifiGuest));

      if (polling.exclude.includes('wifi_guest')) {
        service
          .getCharacteristic(this.api.hap.Characteristic.WifiGuest)
          .onGet(() => this.handler.get(this.accessory, 'wifi_guest', this.api.hap.Characteristic.WifiGuest));
      }
    } else {
      if (service.testCharacteristic(this.api.hap.Characteristic.WifiGuest)) {
        logger.info(
          'Removing WifiGuest characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiGuest));
      }
    }

    //WPS
    if (characteristics.includes('wps')) {
      if (!service.testCharacteristic(this.api.hap.Characteristic.WifiWPS)) {
        logger.info(
          'Adding WifiWPS characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.addCharacteristic(this.api.hap.Characteristic.WifiWPS);
      }

      service
        .getCharacteristic(this.api.hap.Characteristic.WifiWPS)
        .onSet((state) => this.handler.set(state, this.accessory, 'wps', this.api.hap.Characteristic.WifiWPS));

      if (polling.exclude.includes('wps')) {
        service
          .getCharacteristic(this.api.hap.Characteristic.WifiWPS)
          .onGet(() => this.handler.get(this.accessory, 'wps', this.api.hap.Characteristic.WifiWPS));
      }
    } else {
      if (service.testCharacteristic(this.api.hap.Characteristic.WifiWPS)) {
        logger.info(
          'Removing WifiWPS characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiWPS));
      }
    }

    //Reconnect
    if (characteristics.includes('reconnect')) {
      if (!service.testCharacteristic(this.api.hap.Characteristic.Reconnect)) {
        logger.info(
          'Adding Reconnect characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.addCharacteristic(this.api.hap.Characteristic.Reconnect);
      }

      service
        .getCharacteristic(this.api.hap.Characteristic.Reconnect)
        .onGet(() => this.handler.get(this.accessory, 'reconnect', this.api.hap.Characteristic.Reconnect))
        .onSet((state) => this.handler.set(state, this.accessory, 'reconnect', this.api.hap.Characteristic.Reconnect));
    } else {
      if (service.testCharacteristic(this.api.hap.Characteristic.Reconnect)) {
        logger.info(
          'Removing Reconnect characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Reconnect));
      }
    }

    //DECT
    if (characteristics.includes('dect') && this.accessory.context.config.master) {
      if (!service.testCharacteristic(this.api.hap.Characteristic.DECT)) {
        logger.info(
          'Adding DECT characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.addCharacteristic(this.api.hap.Characteristic.DECT);
      }

      service
        .getCharacteristic(this.api.hap.Characteristic.DECT)
        .onSet((state) => this.handler.set(state, this.accessory, 'dect', this.api.hap.Characteristic.DECT));

      if (polling.exclude.includes('dect')) {
        service
          .getCharacteristic(this.api.hap.Characteristic.DECT)
          .onGet(() => this.handler.get(this.accessory, 'dect', this.api.hap.Characteristic.DECT));
      }
    } else {
      if (service.testCharacteristic(this.api.hap.Characteristic.DECT)) {
        logger.info(
          'Removing DECT characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DECT));
      }
    }

    //AnsweringMachine
    if (characteristics.includes('aw') && this.accessory.context.config.master) {
      if (!service.testCharacteristic(this.api.hap.Characteristic.AnsweringMachine)) {
        logger.info(
          'Adding AnsweringMachine characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.addCharacteristic(this.api.hap.Characteristic.AnsweringMachine);
      }

      service
        .getCharacteristic(this.api.hap.Characteristic.AnsweringMachine)
        .onSet((state) => this.handler.set(state, this.accessory, 'aw', this.api.hap.Characteristic.AnsweringMachine));

      if (polling.exclude.includes('aw')) {
        service
          .getCharacteristic(this.api.hap.Characteristic.AnsweringMachine)
          .onGet(() => this.handler.get(this.accessory, 'aw', this.api.hap.Characteristic.AnsweringMachine));
      }
    } else {
      if (service.testCharacteristic(this.api.hap.Characteristic.AnsweringMachine)) {
        logger.info(
          'Removing AnsweringMachine characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.AnsweringMachine));
      }
    }

    //Deflection
    if (characteristics.includes('deflection') && this.accessory.context.config.master) {
      if (!service.testCharacteristic(this.api.hap.Characteristic.Deflection)) {
        logger.info(
          'Adding Deflection characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.addCharacteristic(this.api.hap.Characteristic.Deflection);
      }

      service
        .getCharacteristic(this.api.hap.Characteristic.Deflection)
        .onSet((state) =>
          this.handler.set(state, this.accessory, 'deflection', this.api.hap.Characteristic.Deflection)
        );

      if (polling.exclude.includes('deflection')) {
        service
          .getCharacteristic(this.api.hap.Characteristic.Deflection)
          .onGet(() => this.handler.get(this.accessory, 'deflection', this.api.hap.Characteristic.Deflection));
      }
    } else {
      if (service.testCharacteristic(this.api.hap.Characteristic.Deflection)) {
        logger.info(
          'Removing Deflection characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Deflection));
      }
    }

    //DeviceLED
    if (characteristics.includes('led')) {
      if (!service.testCharacteristic(this.api.hap.Characteristic.DeviceLED)) {
        logger.info(
          'Adding DeviceLED characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.addCharacteristic(this.api.hap.Characteristic.DeviceLED);
      }

      service
        .getCharacteristic(this.api.hap.Characteristic.DeviceLED)
        .onSet((state) => this.handler.set(state, this.accessory, 'led', this.api.hap.Characteristic.DeviceLED));

      if (polling.exclude.includes('led')) {
        service
          .getCharacteristic(this.api.hap.Characteristic.DeviceLED)
          .onGet(() => this.handler.get(this.accessory, 'led', this.api.hap.Characteristic.DeviceLED));
      }
    } else {
      if (service.testCharacteristic(this.api.hap.Characteristic.DeviceLED)) {
        logger.info(
          'Removing DeviceLED characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DeviceLED));
      }
    }

    //DeviceLock
    if (characteristics.includes('lock')) {
      if (!service.testCharacteristic(this.api.hap.Characteristic.DeviceLock)) {
        logger.info(
          'Adding DeviceLock characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.addCharacteristic(this.api.hap.Characteristic.DeviceLock);
      }

      service
        .getCharacteristic(this.api.hap.Characteristic.DeviceLock)
        .onSet((state) => this.handler.set(state, this.accessory, 'lock', this.api.hap.Characteristic.DeviceLock));

      if (polling.exclude.includes('lock')) {
        service
          .getCharacteristic(this.api.hap.Characteristic.DeviceLock)
          .onGet(() => this.handler.get(this.accessory, 'lock', this.api.hap.Characteristic.DeviceLock));
      }
    } else {
      if (service.testCharacteristic(this.api.hap.Characteristic.DeviceLock)) {
        logger.info(
          'Removing DeviceLock characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DeviceLock));
      }
    }

    //Broadband
    if (characteristics.includes('broadband') && this.accessory.context.config.master) {
      if (!service.testCharacteristic(this.api.hap.Characteristic.Download)) {
        logger.info(
          'Adding Download characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.addCharacteristic(this.api.hap.Characteristic.Download);
      }

      if (!service.testCharacteristic(this.api.hap.Characteristic.Upload)) {
        logger.info(
          'Adding Upload characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.addCharacteristic(this.api.hap.Characteristic.Upload);
      }

      service
        .getCharacteristic(this.api.hap.Characteristic.Download)
        .onGet(() => this.handler.get(this.accessory, 'broadband'));
    } else {
      if (service.testCharacteristic(this.api.hap.Characteristic.Download)) {
        logger.info(
          'Removing Download characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Download));
      }
      if (service.testCharacteristic(this.api.hap.Characteristic.Upload)) {
        logger.info(
          'Removing Upload characteristic',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Upload));
      }
    }

    if (this.accessory.context.config.master) {
      const extrasConfig = this.accessory.context.config.extras;

      //Alarm
      if (extrasConfig.alarm.accType === 'characteristic' && extrasConfig.alarm.active && extrasConfig.alarm.telNr) {
        if (!service.testCharacteristic(this.api.hap.Characteristic.DialAlarm)) {
          logger.info(
            'Adding DialAlarm characteristic',
            `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
          );
          service.addCharacteristic(this.api.hap.Characteristic.DialAlarm);
        }

        service
          .getCharacteristic(this.api.hap.Characteristic.DialAlarm)
          .onGet(() => ExtrasHandler.get(this.accessory, 'alarm', this.api.hap.Characteristic.DialAlarm))
          .onSet((state) => ExtrasHandler.set(state, this.accessory, 'alarm', this.api.hap.Characteristic.DialAlarm))
          .on('change', (context) => ExtrasHandler.change(context, this.accessory, 'alarm'));
      } else {
        if (service.testCharacteristic(this.api.hap.Characteristic.DialAlarm)) {
          logger.info(
            'Removing DialAlarm characteristic',
            `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
          );
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DialAlarm));
        }
      }

      //WakeUp
      if (
        extrasConfig.wakeup.accType === 'characteristic' &&
        extrasConfig.wakeup.active &&
        extrasConfig.wakeup.internNr
      ) {
        if (!service.testCharacteristic(this.api.hap.Characteristic.WakeUp)) {
          logger.info(
            'Adding WakeUp characteristic',
            `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
          );
          service.addCharacteristic(this.api.hap.Characteristic.WakeUp);
        }

        service
          .getCharacteristic(this.api.hap.Characteristic.WakeUp)
          .onGet(() => ExtrasHandler.get(this.accessory, 'wakeup', this.api.hap.Characteristic.WakeUp))
          .onSet((state) => ExtrasHandler.set(state, this.accessory, 'wakeup', this.api.hap.Characteristic.WakeUp));
      } else {
        if (service.testCharacteristic(this.api.hap.Characteristic.WakeUp)) {
          logger.info(
            'Removing WakeUp characteristic',
            `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
          );
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WakeUp));
        }
      }

      //RingLock
      if (
        extrasConfig.ringlock.accType === 'characteristic' &&
        extrasConfig.ringlock.active &&
        extrasConfig.ringlock.DECTphones
      ) {
        if (!service.testCharacteristic(this.api.hap.Characteristic.RingLock)) {
          logger.info(
            'Adding RingLock characteristic',
            `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
          );
          service.addCharacteristic(this.api.hap.Characteristic.RingLock);
        }

        service
          .getCharacteristic(this.api.hap.Characteristic.RingLock)
          .onSet((state) => ExtrasHandler.set(state, this.accessory, 'ringlock', this.api.hap.Characteristic.RingLock));

        if (polling.exclude.includes('ringlock')) {
          service
            .getCharacteristic(this.api.hap.Characteristic.RingLock)
            .onGet(() => ExtrasHandler.get(this.accessory, 'ringlock', this.api.hap.Characteristic.RingLock));
        }
      } else {
        if (service.testCharacteristic(this.api.hap.Characteristic.RingLock)) {
          logger.info(
            'Removing RingLock characteristic',
            `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
          );
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.RingLock));
        }
      }

      if (extrasConfig.phoneBook.accType === 'characteristic' && extrasConfig.phoneBook.active) {
        if (!service.testCharacteristic(this.api.hap.Characteristic.PhoneBook)) {
          logger.info(
            'Adding PhoneBook characteristic',
            `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
          );
          service.addCharacteristic(this.api.hap.Characteristic.PhoneBook);
        }

        service
          .getCharacteristic(this.api.hap.Characteristic.PhoneBook)
          .onGet(() => ExtrasHandler.get(this.accessory, 'phoneBook', this.api.hap.Characteristic.PhoneBook))
          .onSet((state) =>
            ExtrasHandler.set(state, this.accessory, 'phoneBook', this.api.hap.Characteristic.PhoneBook)
          );
      } else {
        if (service.testCharacteristic(this.api.hap.Characteristic.PhoneBook)) {
          logger.info(
            'Removing PhoneBook characteristic',
            `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
          );
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.PhoneBook));
        }
      }
    }

    service
      .getCharacteristic(this.api.hap.Characteristic.On)
      .on('change', (context) => this.handler.change(context, this.accessory));

    if (!this.accessory.context.config.readOnly) {
      service
        .getCharacteristic(this.api.hap.Characteristic.On)
        .onSet((state) => this.handler.set(state, this.accessory));
    } else {
      service.getCharacteristic(this.api.hap.Characteristic.On).onSet((state) => {
        logger.info(
          'Changing state not allowed - "readOnly" is active!',
          `${this.accessory.displayName} (${this.accessory.context.config.subtype})`
        );
        setTimeout(() => service.getCharacteristic(this.api.hap.Characteristic.On).updateValue(!state), 1000);
      });
    }

    if (polling.exclude.includes(this.accessory.displayName)) {
      service.getCharacteristic(this.api.hap.Characteristic.On).onGet(() => this.handler.get(this.accessory));
    }
  }
}

module.exports = Accessory;
