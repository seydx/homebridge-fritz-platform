'use strict';

const inherits = require('util').inherits;

module.exports = {
  registerWith: function (hap) {
    const Characteristic = hap.Characteristic;
    
    
    /// /////////////////////////////////////////////////////////////////////////
    // Download Characteristic
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.Download = function() {
      Characteristic.call(this, 'Download', '37574b8e-2d7c-47ee-8b5e-6bfc42f195d9');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        maxValue: 9999,
        minValue: 0,
        minStep: 0.1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.Download, Characteristic);
    Characteristic.Download.UUID = '37574b8e-2d7c-47ee-8b5e-6bfc42f195d9';
    
    /// /////////////////////////////////////////////////////////////////////////
    // Upload Characteristic
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.Upload = function() {
      Characteristic.call(this, 'Upload', '9b2e94f7-a665-4575-9efd-1b37474d758b');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        maxValue: 9999,
        minValue: 0,
        minStep: 0.1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.Upload, Characteristic);
    Characteristic.Upload.UUID = '9b2e94f7-a665-4575-9efd-1b37474d758b';
    
    /// /////////////////////////////////////////////////////////////////////////
    // Ping Characteristic
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.Ping = function() {
      Characteristic.call(this, 'Ping', 'ce18aaef-1026-4538-943b-026501599dc0');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        maxValue: 9999,
        minValue: 0,
        minStep: 0.1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.Ping, Characteristic);
    Characteristic.Ping.UUID = 'ce18aaef-1026-4538-943b-026501599dc0';
    
    /// /////////////////////////////////////////////////////////////////////////
    // IP adresse Characteristic
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.Adresse = function() {
      Characteristic.call(this, 'Adresse', '1bc5457c-5a86-4a07-b0ee-ee2a0b08d837');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.Adresse, Characteristic);
    Characteristic.Adresse.UUID = '1bc5457c-5a86-4a07-b0ee-ee2a0b08d837';
    
    /// /////////////////////////////////////////////////////////////////////////
    // WifiTwo Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.WifiTwo = function() {
      Characteristic.call(this, 'WIFI 2.4GHZ', '0026e147-5d51-4f42-b157-6aca6050be8e');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.WifiTwo, Characteristic);
    Characteristic.WifiTwo.UUID = '0026e147-5d51-4f42-b157-6aca6050be8e';
    
    /// /////////////////////////////////////////////////////////////////////////
    // WifiFive Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.WifiFive = function() {
      Characteristic.call(this, 'WIFI 5GHZ', 'a72aeeca-c6ce-45ce-b026-5d400aab5fc9');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.WifiFive, Characteristic);
    Characteristic.WifiFive.UUID = 'a72aeeca-c6ce-45ce-b026-5d400aab5fc9';
    
    /// /////////////////////////////////////////////////////////////////////////
    // WifiGuest Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.WifiGuest = function() {
      Characteristic.call(this, 'WIFI Guest', 'a87bbf2b-885c-4713-8169-22abdbf0b2a1');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.WifiGuest, Characteristic);
    Characteristic.WifiGuest.UUID = 'a87bbf2b-885c-4713-8169-22abdbf0b2a1';
    
    /////////////////////////////////////////////////////////////////////////////
    // PhoneBook Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.PhoneBook = function() {
      Characteristic.call(this, 'Refresh Phone Book', '8f9aeaa4-092f-4c3a-85f1-dfd064a07c3d');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.PhoneBook, Characteristic);
    Characteristic.PhoneBook.UUID = '8f9aeaa4-092f-4c3a-85f1-dfd064a07c3d';
    
    /////////////////////////////////////////////////////////////////////////////
    // Alarm Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.DialAlarm = function() {
      Characteristic.call(this, 'Alarm', '8fe6e841-41e4-479f-b334-8af339ce5b30');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.DialAlarm, Characteristic);
    Characteristic.DialAlarm.UUID = '8fe6e841-41e4-479f-b334-8af339ce5b30';
    
    /// /////////////////////////////////////////////////////////////////////////
    // WPS Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.WifiWPS = function() {
      Characteristic.call(this, 'WIFI WPS', '991dd58c-7d8c-46b1-acd1-411d8f6902ac');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.WifiWPS, Characteristic);
    Characteristic.WifiWPS.UUID = '991dd58c-7d8c-46b1-acd1-411d8f6902ac';
    
    /// /////////////////////////////////////////////////////////////////////////
    // DECT Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.DECT = function() {
      Characteristic.call(this, 'DECT Station', '1718fc65-453b-403a-ab81-79a1c96ba195');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.DECT, Characteristic);
    Characteristic.DECT.UUID = '1718fc65-453b-403a-ab81-79a1c96ba195';
    
    /// /////////////////////////////////////////////////////////////////////////
    // AnsweringMachine Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.AnsweringMachine = function() {
      Characteristic.call(this, 'Answering Machine', 'd19ef9d5-3bc6-47ac-b6bb-7bdcf0df20b0');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.AnsweringMachine, Characteristic);
    Characteristic.AnsweringMachine.UUID = 'd19ef9d5-3bc6-47ac-b6bb-7bdcf0df20b0';
    
    /// /////////////////////////////////////////////////////////////////////////
    // Deflection Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.Deflection = function() {
      Characteristic.call(this, 'Deflection', '658086c7-274c-4988-bd5e-3c720fa3054d');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.Deflection, Characteristic);
    Characteristic.Deflection.UUID = '658086c7-274c-4988-bd5e-3c720fa3054d';
    
    /////////////////////////////////////////////////////////////////////////////
    // WakeUp Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.WakeUp = function() {
      Characteristic.call(this, 'Wake Up', 'c60a4aa9-cefb-4c61-8185-ad2b3ba52842');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.WakeUp, Characteristic);
    Characteristic.WakeUp.UUID = 'c60a4aa9-cefb-4c61-8185-ad2b3ba52842';
    
    /// /////////////////////////////////////////////////////////////////////////
    // DeviceLED Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.DeviceLED = function() {
      Characteristic.call(this, 'LED', 'fd81f0dc-4324-457e-8164-289743873fb1');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.DeviceLED, Characteristic);
    Characteristic.DeviceLED.UUID = 'fd81f0dc-4324-457e-8164-289743873fb1';
    
    /// /////////////////////////////////////////////////////////////////////////
    // DeviceLock Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.DeviceLock = function() {
      Characteristic.call(this, 'Device Lock', '56af4239-46bc-4bae-b55b-dbc5be2d0897');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.DeviceLock, Characteristic);
    Characteristic.DeviceLock.UUID = '56af4239-46bc-4bae-b55b-dbc5be2d0897';
    
    /// /////////////////////////////////////////////////////////////////////////
    // RingLock Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.RingLock = function() {
      Characteristic.call(this, 'Ring Lock', 'cab7d43e-422c-4452-bc9a-11c89454332b');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.RingLock, Characteristic);
    Characteristic.RingLock.UUID = 'cab7d43e-422c-4452-bc9a-11c89454332b';

  }
};