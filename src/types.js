'use strict';

const inherits = require('util').inherits;

module.exports = {
  registerWith: function (hap) {
    const Characteristic = hap.Characteristic;
    /// /////////////////////////////////////////////////////////////////////////
    // EveMotionLastActivation Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.EveMotionLastActivation = function() {
      Characteristic.call(this, 'Last Activation', 'E863F11A-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.UINT32,
        unit: Characteristic.Units.SECONDS,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.EveMotionLastActivation, Characteristic);
    Characteristic.EveMotionLastActivation.UUID = 'E863F11A-079E-48FF-8F27-9C2605A29F52';
    
    /// /////////////////////////////////////////////////////////////////////////
    // WifiTwo Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.WifiTwo = function() {
      Characteristic.call(this, 'WIFI 2.4GHZ', 'a33a7443-ec88-4760-a48e-cff68f78e6d3');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.WifiTwo, Characteristic);
    Characteristic.WifiTwo.UUID = 'a33a7443-ec88-4760-a48e-cff68f78e6d3';
    
    /// /////////////////////////////////////////////////////////////////////////
    // WifiFive Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.WifiFive = function() {
      Characteristic.call(this, 'WIFI 5GHZ', '04cecc8d-5713-4c8b-bdb5-6987506be273');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.WifiFive, Characteristic);
    Characteristic.WifiFive.UUID = '04cecc8d-5713-4c8b-bdb5-6987506be273';
    
    /// /////////////////////////////////////////////////////////////////////////
    // WifiGuest Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.WifiGuest = function() {
      Characteristic.call(this, 'WIFI Guest', '10266737-caf1-40de-a902-210fbc692835');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.WifiGuest, Characteristic);
    Characteristic.WifiGuest.UUID = '10266737-caf1-40de-a902-210fbc692835';
    
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
    // RefreshChannel Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.RefreshChannel = function() {
      Characteristic.call(this, 'WIFI Refresh Channel', '6b4dbaa5-b30c-47c8-96f1-7b269cc1e512');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.RefreshChannel, Characteristic);
    Characteristic.RefreshChannel.UUID = '6b4dbaa5-b30c-47c8-96f1-7b269cc1e512';
    
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
    // Reboot Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.Reboot = function() {
      Characteristic.call(this, 'Reboot', '60c79a1f-f7c8-45e6-ae3d-5b51d8a6cd75');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.Reboot, Characteristic);
    Characteristic.Reboot.UUID = '60c79a1f-f7c8-45e6-ae3d-5b51d8a6cd75';
    
    /// /////////////////////////////////////////////////////////////////////////
    // Debug Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.Debug = function() {
      Characteristic.call(this, 'Debug', '5a790d94-b2cc-423c-aa78-1b013df766d3');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.Debug, Characteristic);
    Characteristic.Debug.UUID = '5a790d94-b2cc-423c-aa78-1b013df766d3';
    
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
    
    /// /////////////////////////////////////////////////////////////////////////
    // DownloadSpeed Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.DownloadSpeed = function() {
      Characteristic.call(this, 'Broadband Download', 'da70da1f-da72-4db3-81c2-99f158a15a9a');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'Mbps',
        maxValue: 99999,
        minValue: 0,
        minStep: 0.01,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.DownloadSpeed, Characteristic);
    Characteristic.DownloadSpeed.UUID = 'da70da1f-da72-4db3-81c2-99f158a15a9a';

    /// /////////////////////////////////////////////////////////////////////////
    // UploadSpeed Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.UploadSpeed = function() {
      Characteristic.call(this, 'Broadband Upload', 'ab74289e-d516-4a12-b2ae-1b32a74c035f');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'Mbps',
        maxValue: 99999,
        minValue: 0,
        minStep: 0.01,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.UploadSpeed, Characteristic);
    Characteristic.UploadSpeed.UUID = 'ab74289e-d516-4a12-b2ae-1b32a74c035f';

    /// /////////////////////////////////////////////////////////////////////////
    // Ping Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.Ping = function() {
      Characteristic.call(this, 'Broadband Ping', 'cc65a09a-e052-410c-981d-c11bde2c3f60');
      this.setProps({
        format: Characteristic.Formats.INT,
        unit: 'ms',
        maxValue: 999,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.Ping, Characteristic);
    Characteristic.Ping.UUID = 'cc65a09a-e052-410c-981d-c11bde2c3f60';
  }
};
