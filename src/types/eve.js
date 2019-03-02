'use strict';

const inherits = require('util').inherits;

module.exports = {
  registerWith: function (hap) {
    const Characteristic = hap.Characteristic;
    const Service = hap.Service;

    /// /////////////////////////////////////////////////////////////////////////
    // ResetTotal
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.ResetTotal = function() {
      Characteristic.call(this, 'Reset Total', 'E863F112-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.UINT32,
        unit: Characteristic.Units.SECONDS,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.ResetTotal, Characteristic);
    Characteristic.ResetTotal.UUID = 'E863F112-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // HistoryStatus
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.HistoryStatus = function() {
      Characteristic.call(this, 'History Status', 'E863F116-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.DATA,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.HistoryStatus, Characteristic);
    Characteristic.HistoryStatus.UUID = 'E863F116-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // HistoryEntries
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.HistoryEntries = function() {
      Characteristic.call(this, 'History Entries', 'E863F117-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.DATA,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.HistoryEntries, Characteristic);
    Characteristic.HistoryEntries.UUID = 'E863F117-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // HistoryRequest
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.HistoryRequest = function() {
      Characteristic.call(this, 'History Request', 'E863F11C-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.DATA,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.HistoryRequest, Characteristic);
    Characteristic.HistoryRequest.UUID = 'E863F11C-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // SetTime
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.SetTime = function() {
      Characteristic.call(this, 'Set Time', 'E863F121-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.DATA,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.SetTime, Characteristic);
    Characteristic.SetTime.UUID = 'E863F121-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // LastActivation
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.LastActivation = function() {
      Characteristic.call(this, 'Last Activation', 'E863F11A-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.UINT32,
        unit: Characteristic.Units.SECONDS,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.LastActivation, Characteristic);
    Characteristic.LastActivation.UUID = 'E863F11A-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // TimesOpened
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.TimesOpened = function() {
      Characteristic.call(this, 'Times Opened', 'E863F129-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.UINT32,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.TimesOpened, Characteristic);
    Characteristic.TimesOpened.UUID = 'E863F129-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // OpenDuration
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.OpenDuration = function() {
      Characteristic.call(this, 'Open Duration', 'E863F118-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.UINT32,
        unit: Characteristic.Units.SECONDS,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.OpenDuration, Characteristic);
    Characteristic.OpenDuration.UUID = 'E863F118-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // ClosedDuration
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.ClosedDuration = function() {
      Characteristic.call(this, 'Closed Duration', 'E863F119-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.UINT32,
        unit: Characteristic.Units.SECONDS,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.ClosedDuration, Characteristic);
    Characteristic.ClosedDuration.UUID = 'E863F119-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // ContactSensor
    /// ///////////////////////////////////////////////////////////////////////// 
    Service.ContactSensor = function(displayName, subtype) {
      Service.call(this, displayName, '00000080-0000-1000-8000-0026BB765291', subtype);
      // Required Characteristics
      this.addCharacteristic(Characteristic.ContactSensorState);

      //EVE
      this.addCharacteristic(Characteristic.TimesOpened);
      this.addCharacteristic(Characteristic.OpenDuration);
      this.addCharacteristic(Characteristic.ClosedDuration);
      this.addCharacteristic(Characteristic.LastActivation);

      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.StatusActive);
      this.addOptionalCharacteristic(Characteristic.StatusFault);
      this.addOptionalCharacteristic(Characteristic.StatusTampered);
      this.addOptionalCharacteristic(Characteristic.StatusLowBattery);
      this.addOptionalCharacteristic(Characteristic.Name);
    };
    inherits(Service.ContactSensor, Service);
    Service.ContactSensor.UUID = '00000080-0000-1000-8000-0026BB765291';

  }
};
