'use strict';

const Logger = require('../../helper/logger.js');

class RouterSwitchAccessory {

  constructor (api, accessory, extras, handler) {
    
    this.api = api;
    this.accessory = accessory;
    
    this.extras = extras;
    this.handler = handler;
    
    this.getService();

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService () {
    
    let service = this.accessory.getService(this.api.hap.Service.Switch);
    
    if(!service){
      Logger.info('Adding Switch service', this.accessory.displayName);
      service = this.accessory.addService(this.api.hap.Service.Switch, this.accessory.displayName, this.accessory.context.config.subtype);
    }
    
    if(this.accessory.context.config.options){
    
      let validChars = ['wifi_2ghz', 'wifi_5ghz', 'wifi_guest', 'wps', 'dect', 'aw', 'deflection', 'led', 'lock'];
      const characteristics = Object.keys(this.accessory.context.config.options).filter(extra => validChars.includes(extra) && this.accessory.context.config.options[extra] === 'characteristic');
      
      if(characteristics.includes('wifi_2ghz')){
        if(!service.testCharacteristic(this.api.hap.Characteristic.WifiTwo)){
          Logger.info('Adding WifiTwo characteristic', this.accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.WifiTwo);
        }
        if(this.accessory.context.polling.timer && !this.accessory.context.polling.exclude.includes('wifi_2ghz') && !this.accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.WifiTwo)
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiTwo, 'wifi_2ghz', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.WifiTwo)
            .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiTwo, 'wifi_2ghz', false))
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiTwo, 'wifi_2ghz', false)); 
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.WifiTwo)){
          Logger.info('Removing WifiTwo characteristic', this.accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiTwo));
        }
      }
      
      if(characteristics.includes('wifi_5ghz')){
        if(!service.testCharacteristic(this.api.hap.Characteristic.WifiFive)){
          Logger.info('Adding WifiFive characteristic', this.accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.WifiFive);
        }
        if(this.accessory.context.polling.timer && !this.accessory.context.polling.exclude.includes('wifi_5ghz') && !this.accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.WifiFive)
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiFive, 'wifi_5ghz', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.WifiFive)
            .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiFive, 'wifi_5ghz', false))
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiFive, 'wifi_5ghz', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.WifiFive)){
          Logger.info('Removing WifiFive characteristic', this.accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiFive));
        }
      }
      
      if(characteristics.includes('wifi_guest')){
        if(!service.testCharacteristic(this.api.hap.Characteristic.WifiGuest)){
          Logger.info('Adding WifiGuest characteristic', this.accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.WifiGuest);
        }
        if(this.accessory.context.polling.timer && !this.accessory.context.polling.exclude.includes('wifi_guest') && !this.accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.WifiGuest)
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiGuest, 'wifi_guest', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.WifiGuest)
            .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiGuest, 'wifi_guest', false))
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiGuest, 'wifi_guest', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.WifiGuest)){
          Logger.info('Removing WifiGuest characteristic', this.accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiGuest));
        }
      }
      
      if(characteristics.includes('wps')){
        if(!service.testCharacteristic(this.api.hap.Characteristic.WifiWPS)){
          Logger.info('Adding WifiWPS characteristic', this.accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.WifiWPS);
        }
        if(this.accessory.context.polling.timer && !this.accessory.context.polling.exclude.includes('wps') && !this.accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.WifiWPS)
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiWPS, 'wps', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.WifiWPS)
            .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiWPS, 'wps', false))
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiWPS, 'wps', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.WifiWPS)){
          Logger.info('Removing WifiWPS characteristic', this.accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiWPS));
        }
      }
      
      if(characteristics.includes('dect') && this.accessory.context.config.master){
        if(!service.testCharacteristic(this.api.hap.Characteristic.DECT)){
          Logger.info('Adding DECT characteristic', this.accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.DECT);
        }
        if(this.accessory.context.polling.timer && !this.accessory.context.polling.exclude.includes('dect') && !this.accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.DECT)
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DECT, 'dect', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.DECT)
            .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DECT, 'dect', false))
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DECT, 'dect', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.DECT)){
          Logger.info('Removing DECT characteristic', this.accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DECT));
        }
      }
      
      if(characteristics.includes('aw') && this.accessory.context.config.master){
        if(!service.testCharacteristic(this.api.hap.Characteristic.AnsweringMachine)){
          Logger.info('Adding AnsweringMachine characteristic', this.accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.AnsweringMachine);
        }
        if(this.accessory.context.polling.timer && !this.accessory.context.polling.exclude.includes('aw') && !this.accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.AnsweringMachine)
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.AnsweringMachine, 'aw', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.AnsweringMachine)
            .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.AnsweringMachine, 'aw', false))
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.AnsweringMachine, 'aw', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.AnsweringMachine)){
          Logger.info('Removing AnsweringMachine characteristic', this.accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.AnsweringMachine));
        }
      }
      
      if(characteristics.includes('deflection') && this.accessory.context.config.master){
        if(!service.testCharacteristic(this.api.hap.Characteristic.Deflection)){
          Logger.info('Adding Deflection characteristic', this.accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.Deflection);
        }
        if(this.accessory.context.polling.timer && !this.accessory.context.polling.exclude.includes('deflection') && !this.accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.Deflection)
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.Deflection, 'deflection', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.Deflection)
            .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.Deflection, 'deflection', false))
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.Deflection, 'deflection', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.Deflection)){
          Logger.info('Removing Deflection characteristic', this.accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Deflection));
        }
      }
      
      if(characteristics.includes('led')){
        if(!service.testCharacteristic(this.api.hap.Characteristic.DeviceLED)){
          Logger.info('Adding DeviceLED characteristic', this.accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.DeviceLED);
        }
        if(this.accessory.context.polling.timer && !this.accessory.context.polling.exclude.includes('led') && !this.accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.DeviceLED)
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DeviceLED, 'led', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.DeviceLED)
            .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DeviceLED, 'led', false))
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DeviceLED, 'led', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.DeviceLED)){
          Logger.info('Removing DeviceLED characteristic', this.accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DeviceLED));
        }
      }
      
      if(characteristics.includes('lock')){
        if(!service.testCharacteristic(this.api.hap.Characteristic.DeviceLock)){
          Logger.info('Adding DeviceLock characteristic', this.accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.DeviceLock);
        }
        if(this.accessory.context.polling.timer && !this.accessory.context.polling.exclude.includes('lock') && !this.accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.DeviceLock)
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DeviceLock, 'lock', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.DeviceLock)
            .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DeviceLock, 'lock', false))
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DeviceLock, 'lock', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.DeviceLock)){
          Logger.info('Removing DeviceLock characteristic', this.accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DeviceLock));
        }
      }

    } else {
    
      if(service.testCharacteristic(this.api.hap.Characteristic.WifiTwo)){
        Logger.info('Removing WifiTwo characteristic', this.accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Reconnect));
      }
      
      if(service.testCharacteristic(this.api.hap.Characteristic.WifiFive)){
        Logger.info('Removing WifiFive characteristic', this.accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiFive));
      }
      
      if(service.testCharacteristic(this.api.hap.Characteristic.WifiGuest)){
        Logger.info('Removing WifiGuest characteristic', this.accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiGuest));
      }
      
      if(service.testCharacteristic(this.api.hap.Characteristic.WifiWPS)){
        Logger.info('Removing WifiWPS characteristic', this.accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiWPS));
      }
      
      if(service.testCharacteristic(this.api.hap.Characteristic.AnsweringMachine)){
        Logger.info('Removing AnsweringMachine characteristic', this.accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.AnsweringMachine));
      }
      
      if(service.testCharacteristic(this.api.hap.Characteristic.Deflection)){
        Logger.info('Removing Deflection characteristic', this.accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Deflection));
      }
      
      if(service.testCharacteristic(this.api.hap.Characteristic.DeviceLED)){
        Logger.info('Removing DeviceLED characteristic', this.accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DeviceLED));
      }
      
      if(service.testCharacteristic(this.api.hap.Characteristic.DeviceLock)){
        Logger.info('Removing DeviceLock characteristic', this.accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DeviceLock));
      }
    
    }
    
    if(this.extras && this.accessory.context.config.master){
    
      const characteristics = Object.keys(this.extras).map(extra => {
        return extra;
      });
      
      if(characteristics.includes('alarm') && this.extras.alarm.telNr){
        if(!service.testCharacteristic(this.api.hap.Characteristic.DialAlarm)){
          Logger.info('Adding DialAlarm characteristic', this.accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.DialAlarm);
        }
        service.getCharacteristic(this.api.hap.Characteristic.DialAlarm)
          .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DialAlarm, 'alarm', this.extras.alarm))  
          .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DialAlarm, 'alarm', this.extras.alarm))
          .on('change', this.handler.change.bind(this, this.accessory, this.accessory.context.config.subtype, this.accessory.displayName, false));
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.DialAlarm)){
          Logger.info('Removing DialAlarm characteristic', this.accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DialAlarm));
        }
      }
      
      if(characteristics.includes('wakeup') && this.extras.wakeup.internNr){
        if(!service.testCharacteristic(this.api.hap.Characteristic.WakeUp)){
          Logger.info('Adding WakeUp characteristic', this.accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.WakeUp);
        }
        service.getCharacteristic(this.api.hap.Characteristic.WakeUp)
          .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WakeUp, 'wakeup', this.extras.wakeup))
          .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WakeUp, 'wakeup', this.extras.wakeup));
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.WakeUp)){
          Logger.info('Removing WakeUp characteristic', this.accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WakeUp));
        }
      }
      
      if(characteristics.includes('ringlock') && this.extras.ringlock.DECTphones){
        if(!service.testCharacteristic(this.api.hap.Characteristic.RingLock)){
          Logger.info('Adding RingLock characteristic', this.accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.RingLock);
        }
        if(this.accessory.context.polling.timer && !this.accessory.context.polling.exclude.includes('ringlock') && !this.accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.RingLock)
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.RingLock, 'ringlock', this.extras.ringlock));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.RingLock)
            .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.RingLock, 'ringlock', this.extras.ringlock))
            .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.RingLock, 'ringlock', this.extras.ringlock));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.RingLock)){
          Logger.info('Removing RingLock characteristic', this.accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.RingLock));
        }
      }
      
      if(characteristics.includes('phoneBook')){
        if(!service.testCharacteristic(this.api.hap.Characteristic.PhoneBook)){
          Logger.info('Adding PhoneBook characteristic', this.accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.PhoneBook);
        }
        service.getCharacteristic(this.api.hap.Characteristic.PhoneBook)
          .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.PhoneBook, 'phoneBook', this.extras.phoneBook))
          .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.PhoneBook, 'phoneBook', this.extras.phoneBook));
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.PhoneBook)){
          Logger.info('Removing PhoneBook characteristic', this.accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.PhoneBook));
        }
      }
    
    } else {
    
      if(service.testCharacteristic(this.api.hap.Characteristic.DialAlarm)){
        Logger.info('Removing DialAlarm characteristic', this.accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DialAlarm));
      }

      if(service.testCharacteristic(this.api.hap.Characteristic.WakeUp)){
        Logger.info('Removing WakeUp characteristic', this.accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WakeUp));
      }

      if(service.testCharacteristic(this.api.hap.Characteristic.RingLock)){
        Logger.info('Removing RingLock characteristic', this.accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.RingLock));
      }  

      if(service.testCharacteristic(this.api.hap.Characteristic.PhoneBook)){
        Logger.info('Removing PhoneBook characteristic', this.accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.PhoneBook));
      }
    
    }
    
    
    if(this.accessory.context.polling.timer && (!this.accessory.context.polling.exclude.includes(this.accessory.context.config.type) && !this.accessory.context.polling.exclude.includes(this.accessory.context.config.subtype) && !this.accessory.context.polling.exclude.includes(this.accessory.displayName))){
      service.getCharacteristic(this.api.hap.Characteristic.On)
        .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'router', false))
        .on('change', this.handler.change.bind(this, this.accessory, 'router', this.accessory.displayName, false));
    } else {
      service.getCharacteristic(this.api.hap.Characteristic.On)
        .on('get', this.handler.get.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'router', false))
        .on('set', this.handler.set.bind(this, this.accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'router', false))
        .on('change', this.handler.change.bind(this, this.accessory, 'router', this.accessory.displayName, false));
    }
    
  }

}

module.exports = RouterSwitchAccessory;