'use strict';

const Logger = require('../helper/logger.js');

class routerService {

  constructor (api, accessory, extras, handler) {
    
    this.api = api;
    this.accessory = accessory;
    
    this.extras = extras;
    this.handler = handler;
    
    this.getService(this.accessory);

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  getService (accessory) {
    
    let service = accessory.getService(this.api.hap.Service.Switch);
    
    if(!service){
      Logger.info('Adding switch', accessory.displayName);
      service = accessory.addService(this.api.hap.Service.Switch, this.accessory.displayName, 'router');
    }
    
    if(accessory.context.config.options){
    
      let validChars = ['wifi_2ghz', 'wifi_5ghz', 'wifi_guest', 'wps', 'dect', 'aw', 'deflection', 'led', 'lock', 'broadband'];
      const characteristics = Object.keys(accessory.context.config.options).filter(extra => validChars.includes(extra) && accessory.context.config.options[extra] === 'characteristic');
      
      if(characteristics.includes('wifi_2ghz')){
        if(!service.testCharacteristic(this.api.hap.Characteristic.WifiTwo)){
          Logger.info('Adding WifiTwo Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.WifiTwo);
        }
        if(accessory.context.polling.timer && !accessory.context.polling.exclude.includes('wifi_2ghz') && !accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.WifiTwo)
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiTwo, 'wifi_2ghz', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.WifiTwo)
            .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiTwo, 'wifi_2ghz', false))
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiTwo, 'wifi_2ghz', false)); 
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.WifiTwo)){
          Logger.info('Removing WifiTwo Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiTwo));
        }
      }
      
      if(characteristics.includes('wifi_5ghz')){
        if(!service.testCharacteristic(this.api.hap.Characteristic.WifiFive)){
          Logger.info('Adding WifiFive Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.WifiFive);
        }
        if(accessory.context.polling.timer && !accessory.context.polling.exclude.includes('wifi_5ghz') && !accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.WifiTwo)
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiFive, 'wifi_5ghz', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.WifiTwo)
            .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiFive, 'wifi_5ghz', false))
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiFive, 'wifi_5ghz', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.WifiFive)){
          Logger.info('Removing WifiFive Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiFive));
        }
      }
      
      if(characteristics.includes('wifi_guest')){
        if(!service.testCharacteristic(this.api.hap.Characteristic.WifiGuest)){
          Logger.info('Adding WifiGuest Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.WifiGuest);
        }
        if(accessory.context.polling.timer && !accessory.context.polling.exclude.includes('wifi_guest') && !accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.WifiGuest)
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiGuest, 'wifi_guest', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.WifiGuest)
            .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiGuest, 'wifi_guest', false))
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiGuest, 'wifi_guest', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.WifiGuest)){
          Logger.info('Removing WifiGuest Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiGuest));
        }
      }
      
      if(characteristics.includes('wps')){
        if(!service.testCharacteristic(this.api.hap.Characteristic.WifiWPS)){
          Logger.info('Adding WifiWPS Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.WifiWPS);
        }
        if(accessory.context.polling.timer && !accessory.context.polling.exclude.includes('wps') && !accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.WifiWPS)
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiWPS, 'wps', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.WifiWPS)
            .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiWPS, 'wps', false))
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WifiWPS, 'wps', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.WifiWPS)){
          Logger.info('Removing WifiWPS Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiWPS));
        }
      }
      
      if(characteristics.includes('dect') && accessory.context.config.master){
        if(!service.testCharacteristic(this.api.hap.Characteristic.DECT)){
          Logger.info('Adding DECT Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.DECT);
        }
        if(accessory.context.polling.timer && !accessory.context.polling.exclude.includes('dect') && !accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.DECT)
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DECT, 'dect', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.DECT)
            .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DECT, 'dect', false))
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DECT, 'dect', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.DECT)){
          Logger.info('Removing DECT Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DECT));
        }
      }
      
      if(characteristics.includes('aw') && accessory.context.config.master){
        if(!service.testCharacteristic(this.api.hap.Characteristic.AnsweringMachine)){
          Logger.info('Adding AnsweringMachine Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.AnsweringMachine);
        }
        if(accessory.context.polling.timer && !accessory.context.polling.exclude.includes('aw') && !accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.AnsweringMachine)
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.AnsweringMachine, 'aw', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.AnsweringMachine)
            .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.AnsweringMachine, 'aw', false))
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.AnsweringMachine, 'aw', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.AnsweringMachine)){
          Logger.info('Removing AnsweringMachine Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.AnsweringMachine));
        }
      }
      
      if(characteristics.includes('deflection') && accessory.context.config.master){
        if(!service.testCharacteristic(this.api.hap.Characteristic.Deflection)){
          Logger.info('Adding Deflection Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.Deflection);
        }
        if(accessory.context.polling.timer && !accessory.context.polling.exclude.includes('deflection') && !accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.Deflection)
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.Deflection, 'deflection', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.Deflection)
            .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.Deflection, 'deflection', false))
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.Deflection, 'deflection', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.Deflection)){
          Logger.info('Removing Deflection Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Deflection));
        }
      }
      
      if(characteristics.includes('led')){
        if(!service.testCharacteristic(this.api.hap.Characteristic.DeviceLED)){
          Logger.info('Adding DeviceLED Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.DeviceLED);
        }
        if(accessory.context.polling.timer && !accessory.context.polling.exclude.includes('led') && !accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.DeviceLED)
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DeviceLED, 'led', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.DeviceLED)
            .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DeviceLED, 'led', false))
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DeviceLED, 'led', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.DeviceLED)){
          Logger.info('Removing DeviceLED Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DeviceLED));
        }
      }
      
      if(characteristics.includes('lock')){
        if(!service.testCharacteristic(this.api.hap.Characteristic.DeviceLock)){
          Logger.info('Adding DeviceLock Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.DeviceLock);
        }
        if(accessory.context.polling.timer && !accessory.context.polling.exclude.includes('lock') && !accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.DeviceLock)
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DeviceLock, 'lock', false));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.DeviceLock)
            .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DeviceLock, 'lock', false))
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DeviceLock, 'lock', false));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.DeviceLock)){
          Logger.info('Removing DeviceLock Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DeviceLock));
        }
      }
      
      if(characteristics.includes('broadband') && accessory.context.config.master){
        if(!service.testCharacteristic(this.api.hap.Characteristic.Download)){
          Logger.info('Adding Download Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.Download);
        }
        if(!service.testCharacteristic(this.api.hap.Characteristic.Upload)){
          Logger.info('Adding Upload Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.Upload);
        }
        if(!service.testCharacteristic(this.api.hap.Characteristic.Ping)){
          Logger.info('Adding Ping Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.Ping);
        }
        service.getCharacteristic(this.api.hap.Characteristic.Download)
          .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.Download, 'broadband', 'dl'))
          .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.Download, 'broadband', 'dl'));
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.Download)){
          Logger.info('Removing Download Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Download));
        }
        if(service.testCharacteristic(this.api.hap.Characteristic.Upload)){
          Logger.info('Removing Upload Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Upload));
        }
        if(service.testCharacteristic(this.api.hap.Characteristic.Ping)){
          Logger.info('Removing Ping Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Ping));
        }
      }

    } else {
    
      if(service.testCharacteristic(this.api.hap.Characteristic.WifiTwo)){
        Logger.info('Removing WifiTwo Characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Reconnect));
      }
      
      if(service.testCharacteristic(this.api.hap.Characteristic.WifiFive)){
        Logger.info('Removing WifiFive Characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiFive));
      }
      
      if(service.testCharacteristic(this.api.hap.Characteristic.WifiGuest)){
        Logger.info('Removing WifiGuest Characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiGuest));
      }
      
      if(service.testCharacteristic(this.api.hap.Characteristic.WifiWPS)){
        Logger.info('Removing WifiWPS Characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WifiWPS));
      }
      
      if(service.testCharacteristic(this.api.hap.Characteristic.AnsweringMachine)){
        Logger.info('Removing AnsweringMachine Characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.AnsweringMachine));
      }
      
      if(service.testCharacteristic(this.api.hap.Characteristic.Deflection)){
        Logger.info('Removing Deflection Characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Deflection));
      }
      
      if(service.testCharacteristic(this.api.hap.Characteristic.DeviceLED)){
        Logger.info('Removing DeviceLED Characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DeviceLED));
      }
      
      if(service.testCharacteristic(this.api.hap.Characteristic.DeviceLock)){
        Logger.info('Removing DeviceLock Characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DeviceLock));
      }
      
      if(service.testCharacteristic(this.api.hap.Characteristic.Download)){
        Logger.info('Removing Download Characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Download));
      } 
      
      if(service.testCharacteristic(this.api.hap.Characteristic.Upload)){
        Logger.info('Removing Upload Characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Upload));
      } 
      
      if(service.testCharacteristic(this.api.hap.Characteristic.Ping)){
        Logger.info('Removing Ping Characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.Ping));
      } 
    
    }
    
    if(this.extras && accessory.context.config.master){
    
      const characteristics = Object.keys(this.extras).map(extra => {
        return extra;
      });
      
      if(characteristics.includes('alarm') && this.extras.alarm.telNr){
        if(!service.testCharacteristic(this.api.hap.Characteristic.DialAlarm)){
          Logger.info('Adding DialAlarm Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.DialAlarm);
        }
        service.getCharacteristic(this.api.hap.Characteristic.DialAlarm)
          .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DialAlarm, 'alarm', this.extras.alarm))
          .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.DialAlarm, 'alarm', this.extras.alarm))
          .on('change', this.handler.change.bind(this, accessory, accessory.context.config.subtype, accessory.displayName));
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.DialAlarm)){
          Logger.info('Removing DialAlarm Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DialAlarm));
        }
      }
      
      if(characteristics.includes('wakeup') && this.extras.wakeup.internNr){
        if(!service.testCharacteristic(this.api.hap.Characteristic.WakeUp)){
          Logger.info('Adding WakeUp Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.WakeUp);
        }
        service.getCharacteristic(this.api.hap.Characteristic.WakeUp)
          .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WakeUp, 'wakeup', this.extras.wakeup))
          .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.WakeUp, 'wakeup', this.extras.wakeup));
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.WakeUp)){
          Logger.info('Removing WakeUp Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WakeUp));
        }
      }
      
      if(characteristics.includes('ringlock') && this.extras.ringlock.DECTphones){
        if(!service.testCharacteristic(this.api.hap.Characteristic.RingLock)){
          Logger.info('Adding RingLock Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.RingLock);
        }
        if(accessory.context.polling.timer && !accessory.context.polling.exclude.includes('ringlock') && !accessory.context.polling.exclude.includes('extra')){
          service.getCharacteristic(this.api.hap.Characteristic.RingLock)
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.RingLock, 'ringlock', this.extras.ringlock));
        } else {
          service.getCharacteristic(this.api.hap.Characteristic.RingLock)
            .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.RingLock, 'ringlock', this.extras.ringlock))
            .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.RingLock, 'ringlock', this.extras.ringlock));
        }
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.RingLock)){
          Logger.info('Removing RingLock Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.RingLock));
        }
      }
      
      if(characteristics.includes('phoneBook')){
        if(!service.testCharacteristic(this.api.hap.Characteristic.PhoneBook)){
          Logger.info('Adding PhoneBook Characteristic', accessory.displayName);
          service.addCharacteristic(this.api.hap.Characteristic.PhoneBook);
        }
        service.getCharacteristic(this.api.hap.Characteristic.PhoneBook)
          .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.PhoneBook, 'phoneBook', this.extras.phoneBook))
          .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.PhoneBook, 'phoneBook', this.extras.phoneBook));
      } else {
        if(service.testCharacteristic(this.api.hap.Characteristic.PhoneBook)){
          Logger.info('Removing PhoneBook Characteristic', accessory.displayName);
          service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.PhoneBook));
        }
      }
    
    } else {
    
      if(service.testCharacteristic(this.api.hap.Characteristic.DialAlarm)){
        Logger.info('Removing DialAlarm Characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.DialAlarm));
      }

      if(service.testCharacteristic(this.api.hap.Characteristic.WakeUp)){
        Logger.info('Removing WakeUp Characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.WakeUp));
      }

      if(service.testCharacteristic(this.api.hap.Characteristic.RingLock)){
        Logger.info('Removing RingLock Characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.RingLock));
      }  

      if(service.testCharacteristic(this.api.hap.Characteristic.PhoneBook)){
        Logger.info('Removing PhoneBook Characteristic', accessory.displayName);
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.PhoneBook));
      }
    
    }
    
    
    if(accessory.context.polling.timer && (!accessory.context.polling.exclude.includes('router') && !accessory.context.polling.exclude.includes(accessory.displayName))){
      service.getCharacteristic(this.api.hap.Characteristic.On)
        .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'router', false))
        .on('change', this.handler.change.bind(this, accessory, 'router', accessory.displayName));
    } else {
      service.getCharacteristic(this.api.hap.Characteristic.On)
        .on('get', this.handler.get.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'router', false))
        .on('set', this.handler.set.bind(this, accessory, this.api.hap.Service.Switch, this.api.hap.Characteristic.On, 'router', false))
        .on('change', this.handler.change.bind(this, accessory, 'router', accessory.displayName));
    }
    
  }

}

module.exports = routerService;
