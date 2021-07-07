'use strict';

module.exports = {
  SHBlindAccessory: require('./blind/blind.accessory'),
  SHButtonAccessory: require('./button/button.accessory'),
  SHContactAccessory: require('./contact/contact.accessory'),
  SHHumidityAccessory: require('./humidity/humidity.accessory'),
  SHLightbulbAccessory: require('./lightbulb/lightbulb.accessory'),
  SHOutletAccessory: require('./outlet/outlet.accessory'),
  SHOutletLightbulbAccessory: require('./outlet-lightbulb/outlet-lightbulb.accessory'),
  SHSwitchAccessory: require('./switch/switch.accessory'),
  SHSwitchLightbulbAccessory: require('./switch-lightbulb/switch-lightbulb.accessory'),
  SHTemperatureAccessory: require('./temperature/temperature.accessory'),
  SHThermostatAccessory: require('./thermostat/thermostat.accessory'),
  SHWindowAccessory: require('./window/window.accessory'),
  SHWindowSwitchAccessory: require('./window-switch/window-switch.accessory'),
  SHHandler: require('./smarthome.handler'),
  SHConfig: require('./smarthome.config'),
  SHSetup: require('./smarthome.setup'),
  SHUtils: require('./smarthome.utils'),
};
