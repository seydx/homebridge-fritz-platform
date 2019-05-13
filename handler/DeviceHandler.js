'use strict';

var Service, Characteristic;

class DeviceHandler {
  constructor (platform, accessory, device) {
  
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;

    this.log = platform.log;
    this.logger = platform.logger;
    this.debug = platform.debug;
    this.platform = platform;

    this.device = device;
    
    this.accessory = accessory;
    this.mainService = this.accessory.getService(Service.Switch);

  }
  
  async inspectCharacteristics(){
  
    try{
  
      if((!Array.isArray(this.accessory.context.options.wifi2) && this.accessory.context.options.wifi2) || (Array.isArray(this.accessory.context.options.wifi2) && this.accessory.context.options.wifi2[0])){
        
        if (!this.mainService.testCharacteristic(Characteristic.WifiTwo)){
         
          this.logger.initinfo(this.accessory.displayName + ': Adding WIFI 2.4Ghz Characteristic');
          this.mainService.addCharacteristic(Characteristic.WifiTwo);
        
        }
      
      } else {
        
        if(this.mainService.testCharacteristic(Characteristic.WifiTwo)){
         
          this.logger.info(this.accessory.displayName + ': Removing WIFI 2.4Ghz Characteristic');
          this.mainService.removeCharacteristic(this.mainService.getCharacteristic(Characteristic.WifiTwo));
  
        }
     
      } 
  
      if((!Array.isArray(this.accessory.context.options.wifi5) && this.accessory.context.options.wifi5) || (Array.isArray(this.accessory.context.options.wifi5) && this.accessory.context.options.wifi5[0])){
      
        if(this.device.services['urn:dslforum-org:service:WLANConfiguration:3']){
        
          if (!this.mainService.testCharacteristic(Characteristic.WifiFive)){
          
            this.logger.info(this.accessory.displayName + ': Adding WIFI 5Ghz Characteristic');
            this.mainService.addCharacteristic(Characteristic.WifiFive);
         
          }
       
        } else {
               
          this.logger.info(this.accessory.displayName + ': Can not add WIFI 5Ghz Characteristic - Not supported!');
    
        }
     
      } else {
       
        if(this.mainService.testCharacteristic(Characteristic.WifiFive)){
         
          this.logger.info(this.accessory.displayName + ': Removing WIFI 5Ghz Characteristic');
          this.mainService.removeCharacteristic(this.mainService.getCharacteristic(Characteristic.WifiFive));
        
        }
     
      } 
  
      if((!Array.isArray(this.accessory.context.options.wifiGuest) && this.accessory.context.options.wifiGuest) || (Array.isArray(this.accessory.context.options.wifiGuest) && this.accessory.context.options.wifiGuest[0])){
        
        if (!this.mainService.testCharacteristic(Characteristic.WifiGuest)){
          
          this.logger.info(this.accessory.displayName + ': Adding WIFI Guest Characteristic');
          this.mainService.addCharacteristic(Characteristic.WifiGuest);
        
        }
      
      } else {
       
        if(this.mainService.testCharacteristic(Characteristic.WifiGuest)){
          
          this.logger.info(this.accessory.displayName + ': Removing WIFI Guest Characteristic');
          this.mainService.removeCharacteristic(this.mainService.getCharacteristic(Characteristic.WifiGuest));
        
        }
     
      }
      
      if((!Array.isArray(this.accessory.context.options.wps) && this.accessory.context.options.wps) || (Array.isArray(this.accessory.context.options.wps) && this.accessory.context.options.wps[0])){
     
        if (!this.mainService.testCharacteristic(Characteristic.WifiWPS)){
        
          this.logger.info(this.accessory.displayName + ': Adding WIFI WPS Characteristic');
          this.mainService.addCharacteristic(Characteristic.WifiWPS);
      
        }
      
      } else {
      
        if(this.mainService.testCharacteristic(Characteristic.WifiWPS)){
     
          this.logger.info(this.accessory.displayName + ': Removing WIFI WPS Characteristic');
          this.mainService.removeCharacteristic(this.mainService.getCharacteristic(Characteristic.WifiWPS));
      
        }
     
      }
  
      if((!Array.isArray(this.accessory.context.options.led) && this.accessory.context.options.led) || (Array.isArray(this.accessory.context.options.led) && this.accessory.context.options.led[0])){
        
        if (!this.mainService.testCharacteristic(Characteristic.DeviceLED)){
          
          this.logger.info(this.accessory.displayName + ': Adding LED Characteristic');
          this.mainService.addCharacteristic(Characteristic.DeviceLED);
       
        }
     
      } else {
      
        if(this.mainService.testCharacteristic(Characteristic.DeviceLED)){
       
          this.logger.info(this.accessory.displayName + ': Removing LED Characteristic');
          this.mainService.removeCharacteristic(this.mainService.getCharacteristic(Characteristic.DeviceLED));
       
        }
     
      }
      
      if(this.accessory.context.master){
  
        if((!Array.isArray(this.accessory.context.options.lock) && this.accessory.context.options.lock) || (Array.isArray(this.accessory.context.options.lock) && this.accessory.context.options.lock[0])){
         
          if (!this.mainService.testCharacteristic(Characteristic.DeviceLock)){
          
            this.logger.info(this.accessory.displayName + ': Adding Device Lock Characteristic');
            this.mainService.addCharacteristic(Characteristic.DeviceLock);
          
          }
       
        } else {
         
          if(this.mainService.testCharacteristic(Characteristic.DeviceLock)){
          
            this.logger.info(this.accessory.displayName + ': Removing Device Lock Characteristic');
            this.mainService.removeCharacteristic(this.mainService.getCharacteristic(Characteristic.DeviceLock));
         
          }
       
        }
        
        if(this.accessory.context.options.phoneBook){
          
          if (!this.mainService.testCharacteristic(Characteristic.PhoneBook)){
           
            this.logger.info(this.accessory.displayName + ': Adding PhoneBook Characteristic');
            this.mainService.addCharacteristic(Characteristic.PhoneBook);
          
          }
       
        } else {
         
          if(this.mainService.testCharacteristic(Characteristic.PhoneBook)){
         
            this.logger.info(this.accessory.displayName + ': Removing PhoneBook Characteristic');
            this.mainService.removeCharacteristic(this.mainService.getCharacteristic(Characteristic.PhoneBook));
        
          }
        
        }
    
        if(this.accessory.context.extras.ringlock){
          
          if (!this.mainService.testCharacteristic(Characteristic.RingLock)){
            
            this.logger.info(this.accessory.displayName + ': Adding Ring Lock Characteristic');
            this.mainService.addCharacteristic(Characteristic.RingLock);
         
          }
       
        } else {
         
          if(this.mainService.testCharacteristic(Characteristic.RingLock)){
           
            this.logger.info(this.accessory.displayName + ': Removing Ring Lock Characteristic');
            this.mainService.removeCharacteristic(this.mainService.getCharacteristic(Characteristic.RingLock));
          
          }
       
        }
    
        if(this.accessory.context.extras.alarm){
         
          if (!this.mainService.testCharacteristic(Characteristic.DialAlarm)){
         
            this.logger.info(this.accessory.displayName + ': Adding Alarm Characteristic');
            this.mainService.addCharacteristic(Characteristic.DialAlarm);
         
          }
       
        } else {
       
          if(this.mainService.testCharacteristic(Characteristic.DialAlarm)){
        
            this.logger.info(this.accessory.displayName + ': Removing Alarm Characteristic');
            this.mainService.removeCharacteristic(this.mainService.getCharacteristic(Characteristic.DialAlarm));
         
          }
        
        }
    
        if((!Array.isArray(this.accessory.context.options.aw) && this.accessory.context.options.aw) || (Array.isArray(this.accessory.context.options.aw) && this.accessory.context.options.aw[0])){
        
          if (!this.mainService.testCharacteristic(Characteristic.AnsweringMachine)){
         
            this.logger.info(this.accessory.displayName + ': Adding Answering Machine Characteristic');
            this.accessory.context.lastAWState = false;
            this.mainService.addCharacteristic(Characteristic.AnsweringMachine);
          
          } 
       
        } else {
       
          if(this.mainService.testCharacteristic(Characteristic.AnsweringMachine)){
        
            this.logger.info(this.accessory.displayName + ': Removing Answering Machine Characteristic');
            this.mainService.removeCharacteristic(this.mainService.getCharacteristic(Characteristic.AnsweringMachine));
        
          }
       
        }
    
        if((!Array.isArray(this.accessory.context.options.deflection) && this.accessory.context.options.deflection) || (Array.isArray(this.accessory.context.options.deflection) && this.accessory.context.options.deflection[0])){
         
          if (!this.mainService.testCharacteristic(Characteristic.Deflection)){
          
            this.logger.info(this.accessory.displayName + ': Adding Deflection Characteristic');
            this.mainService.addCharacteristic(Characteristic.Deflection);
            this.accessory.context.lastDeflectionState = false;
         
          }
        
        } else {
         
          if(this.mainService.testCharacteristic(Characteristic.Deflection)){
         
            this.logger.info(this.accessory.displayName + ': Removing Deflection Characteristic');
            this.mainService.removeCharacteristic(this.mainService.getCharacteristic(Characteristic.Deflection));
        
          }
       
        }
    
        if(this.accessory.context.extras.wakeup){
        
          if (!this.mainService.testCharacteristic(Characteristic.WakeUp)){
          
            this.logger.info(this.accessory.displayName + ': Adding WakeUp Characteristic'); 
            this.mainService.addCharacteristic(Characteristic.WakeUp);
         
          } 
        
        } else {
        
          if(this.mainService.testCharacteristic(Characteristic.WakeUp)){
        
            this.logger.info(this.accessory.displayName + ': Removing WakeUp Characteristic');
            this.mainService.removeCharacteristic(this.mainService.getCharacteristic(Characteristic.WakeUp));
        
          }
       
        }
        
        if(this.accessory.context.extras.broadband){
         
          if (!this.mainService.testCharacteristic(Characteristic.Download)){
          
            this.logger.info(this.accessory.displayName + ': Adding Download Characteristic'); 
            this.mainService.addCharacteristic(Characteristic.Download);
         
          } 
          
          if (!this.mainService.testCharacteristic(Characteristic.Upload)){
          
            this.logger.info(this.accessory.displayName + ': Adding Upload Characteristic'); 
            this.mainService.addCharacteristic(Characteristic.Upload);
         
          } 
         
          if (!this.mainService.testCharacteristic(Characteristic.Ping)){
          
            this.logger.info(this.accessory.displayName + ': Adding Ping Characteristic'); 
            this.mainService.addCharacteristic(Characteristic.Ping);
         
          } 
        
        } else {
         
          if(this.mainService.testCharacteristic(Characteristic.Download)){
         
            this.logger.info(this.accessory.displayName + ': Removing Download Characteristic');
            this.mainService.removeCharacteristic(this.mainService.getCharacteristic(Characteristic.Download));
         
          }
         
          if(this.mainService.testCharacteristic(Characteristic.Upload)){
         
            this.logger.info(this.accessory.displayName + ': Removing Upload Characteristic');
            this.mainService.removeCharacteristic(this.mainService.getCharacteristic(Characteristic.Upload));
         
          }
         
          if(this.mainService.testCharacteristic(Characteristic.Ping)){
         
            this.logger.info(this.accessory.displayName + ': Removing Ping Characteristic');
            this.mainService.removeCharacteristic(this.mainService.getCharacteristic(Characteristic.Ping));
         
          }
       
        }
        
      }
      
      return this.mainService;
    
    } catch(err){
      
      throw err;
    
    }
  
  }

}

module.exports = DeviceHandler;