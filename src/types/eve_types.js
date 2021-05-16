'use strict';

const inherits = require('util').inherits;

module.exports = {
  registerWith: function (hap) {
    const Characteristic = hap.Characteristic;
    const Service = hap.Service;

    /// /////////////////////////////////////////////////////////////////////////
    // ResetTotal
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.ResetTotal = function () {
      Characteristic.call(this, 'Reset Total', 'E863F112-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.UINT32,
        unit: Characteristic.Units.SECONDS,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.ResetTotal, Characteristic);
    Characteristic.ResetTotal.UUID = 'E863F112-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // HistoryStatus
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.HistoryStatus = function () {
      Characteristic.call(this, 'History Status', 'E863F116-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.DATA,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.HistoryStatus, Characteristic);
    Characteristic.HistoryStatus.UUID = 'E863F116-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // HistoryEntries
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.HistoryEntries = function () {
      Characteristic.call(this, 'History Entries', 'E863F117-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.DATA,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.HistoryEntries, Characteristic);
    Characteristic.HistoryEntries.UUID = 'E863F117-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // HistoryRequest
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.HistoryRequest = function () {
      Characteristic.call(this, 'History Request', 'E863F11C-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.DATA,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.HistoryRequest, Characteristic);
    Characteristic.HistoryRequest.UUID = 'E863F11C-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // SetTime
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.SetTime = function () {
      Characteristic.call(this, 'Set Time', 'E863F121-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.DATA,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.SetTime, Characteristic);
    Characteristic.SetTime.UUID = 'E863F121-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // LastActivation
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.LastActivation = function () {
      Characteristic.call(this, 'Last Activation', 'E863F11A-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.UINT32,
        unit: Characteristic.Units.SECONDS,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.LastActivation, Characteristic);
    Characteristic.LastActivation.UUID = 'E863F11A-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // TimesOpened
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.TimesOpened = function () {
      Characteristic.call(this, 'Times Opened', 'E863F129-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.UINT32,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.TimesOpened, Characteristic);
    Characteristic.TimesOpened.UUID = 'E863F129-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // OpenDuration
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.OpenDuration = function () {
      Characteristic.call(this, 'Open Duration', 'E863F118-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.UINT32,
        unit: Characteristic.Units.SECONDS,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.OpenDuration, Characteristic);
    Characteristic.OpenDuration.UUID = 'E863F118-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // ClosedDuration
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.ClosedDuration = function () {
      Characteristic.call(this, 'Closed Duration', 'E863F119-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.UINT32,
        unit: Characteristic.Units.SECONDS,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.ClosedDuration, Characteristic);
    Characteristic.ClosedDuration.UUID = 'E863F119-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // CurrentConsumption
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.CurrentConsumption = function () {
      Characteristic.call(this, 'Current Consumption', 'E863F10D-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'W',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.CurrentConsumption, Characteristic);
    Characteristic.CurrentConsumption.UUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // TotalConsumption
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.TotalConsumption = function () {
      Characteristic.call(this, 'Total Consumption', 'E863F10C-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kWh',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.TotalConsumption, Characteristic);
    Characteristic.TotalConsumption.UUID = 'E863F10C-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // Volts
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.Volts = function () {
      Characteristic.call(this, 'Volts', 'E863F10A-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'V',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.Volts, Characteristic);
    Characteristic.Volts.UUID = 'E863F10A-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // Amperes
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.Amperes = function () {
      Characteristic.call(this, 'Amperes', 'E863F126-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'A',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.Amperes, Characteristic);
    Characteristic.Amperes.UUID = 'E863F126-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // ValvePosition
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.ValvePosition = function () {
      Characteristic.call(this, 'Valve Position', 'E863F12E-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: Characteristic.Units.PERCENTAGE,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.ValvePosition, Characteristic);
    Characteristic.ValvePosition.UUID = 'E863F12E-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // ProgramCommand
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.ProgramCommand = function () {
      Characteristic.call(this, 'Program Command', 'E863F12C-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.DATA,
        perms: [Characteristic.Perms.WRITE],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.ProgramCommand, Characteristic);
    Characteristic.ProgramCommand.UUID = 'E863F12C-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // ProgramData
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.ProgramData = function () {
      Characteristic.call(this, 'Program Data', 'E863F12F-079E-48FF-8F27-9C2605A29F52');
      this.setProps({
        format: Characteristic.Formats.DATA,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.ProgramData, Characteristic);
    Characteristic.ProgramData.UUID = 'E863F12F-079E-48FF-8F27-9C2605A29F52';

    /// /////////////////////////////////////////////////////////////////////////
    // Outlet
    /// /////////////////////////////////////////////////////////////////////////
    Service.Outlet = function (displayName, subtype) {
      Service.call(this, displayName, '00000047-0000-1000-8000-0026BB765291', subtype);

      // Required Characteristics
      this.addCharacteristic(Characteristic.On);
      this.addCharacteristic(Characteristic.OutletInUse);

      // Optional Characteristics EVE
      this.addOptionalCharacteristic(Characteristic.CurrentConsumption);
      this.addOptionalCharacteristic(Characteristic.TotalConsumption);
      this.addOptionalCharacteristic(Characteristic.Volts);
      this.addOptionalCharacteristic(Characteristic.Amperes);

      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.Name);
    };
    inherits(Service.Outlet, Service);
    Service.Outlet.UUID = '00000047-0000-1000-8000-0026BB765291';

    /// /////////////////////////////////////////////////////////////////////////
    // Thermostat
    /// /////////////////////////////////////////////////////////////////////////
    Service.Thermostat = function (displayName, subtype) {
      Service.call(this, displayName, '0000004A-0000-1000-8000-0026BB765291', subtype);
      // Required Characteristics
      this.addCharacteristic(Characteristic.CurrentHeatingCoolingState);
      this.addCharacteristic(Characteristic.TargetHeatingCoolingState);
      this.addCharacteristic(Characteristic.CurrentTemperature);
      this.addCharacteristic(Characteristic.TargetTemperature);
      this.addCharacteristic(Characteristic.TemperatureDisplayUnits);

      // Optional Characteristics EVE
      this.addOptionalCharacteristic(Characteristic.ValvePosition);
      this.addOptionalCharacteristic(Characteristic.ProgramCommand);
      this.addOptionalCharacteristic(Characteristic.ProgramData);

      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.CurrentRelativeHumidity);
      this.addOptionalCharacteristic(Characteristic.TargetRelativeHumidity);
      this.addOptionalCharacteristic(Characteristic.CoolingThresholdTemperature);
      this.addOptionalCharacteristic(Characteristic.HeatingThresholdTemperature);
      this.addOptionalCharacteristic(Characteristic.Name);
    };
    inherits(Service.Thermostat, Service);
    Service.Thermostat.UUID = '0000004A-0000-1000-8000-0026BB765291';

    /// /////////////////////////////////////////////////////////////////////////
    // ContactSensor
    /// /////////////////////////////////////////////////////////////////////////
    Service.ContactSensor = function (displayName, subtype) {
      Service.call(this, displayName, '00000080-0000-1000-8000-0026BB765291', subtype);
      // Required Characteristics
      this.addCharacteristic(Characteristic.ContactSensorState);

      // Optional Characteristics EVE
      this.addOptionalCharacteristic(Characteristic.TimesOpened);
      this.addOptionalCharacteristic(Characteristic.OpenDuration);
      this.addOptionalCharacteristic(Characteristic.ClosedDuration);
      this.addOptionalCharacteristic(Characteristic.LastActivation);

      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.StatusActive);
      this.addOptionalCharacteristic(Characteristic.StatusFault);
      this.addOptionalCharacteristic(Characteristic.StatusTampered);
      this.addOptionalCharacteristic(Characteristic.StatusLowBattery);
      this.addOptionalCharacteristic(Characteristic.Name);
    };
    inherits(Service.ContactSensor, Service);
    Service.ContactSensor.UUID = '00000080-0000-1000-8000-0026BB765291';

    /// /////////////////////////////////////////////////////////////////////////
    // MotionSensor
    /// /////////////////////////////////////////////////////////////////////////
    Service.MotionSensor = function (displayName, subtype) {
      Service.call(this, displayName, '00000085-0000-1000-8000-0026BB765291', subtype);
      // Required Characteristics
      this.addCharacteristic(Characteristic.MotionDetected);

      // Optional Characteristics EVE
      this.addOptionalCharacteristic(Characteristic.LastActivation);

      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.StatusActive);
      this.addOptionalCharacteristic(Characteristic.StatusFault);
      this.addOptionalCharacteristic(Characteristic.StatusTampered);
      this.addOptionalCharacteristic(Characteristic.StatusLowBattery);
      this.addOptionalCharacteristic(Characteristic.Name);
    };
    inherits(Service.MotionSensor, Service);
    Service.MotionSensor.UUID = '00000085-0000-1000-8000-0026BB765291';
  },
};
