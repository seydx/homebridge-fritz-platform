'use strict';

const Config = (smarthomeConfig) => {
  const validTypes = ['switch', 'contact', 'thermostat', 'lightbulb', 'temperature', 'window', 'blind'];
  const validTypesGroup = ['switch', 'lightbulb', 'thermostat', 'switch-lightbulb'];

  return {
    active: smarthomeConfig.active || false,
    name: smarthomeConfig.name,
    type: 'smarthome',
    subtype: `smarthome-${smarthomeConfig.group ? smarthomeConfig.accTypeGroup : smarthomeConfig.accType}`,
    group: smarthomeConfig.group || false,
    ain: smarthomeConfig.ain.replace(/\s/g, ''),
    accType: validTypes.find((el) => el === smarthomeConfig.accType) || false,
    accTypeGroup: validTypesGroup.find((el) => el === smarthomeConfig.accTypeGroup) || false,
    readOnly: smarthomeConfig.readOnly || false,
    energy: smarthomeConfig.energy || false,
    startValue: parseInt(smarthomeConfig.startValue) > 0 ? parseInt(smarthomeConfig.startValue) : false,
    temperature: smarthomeConfig.temperature || false,
    humidity: smarthomeConfig.humidity || false,
    window: smarthomeConfig.window || false,
    openWindow: smarthomeConfig.openWindow || false,
    brightness: smarthomeConfig.brightness || false,
    color: smarthomeConfig.color || false,
    battery: smarthomeConfig.battery || false,
  };
};

module.exports = Config;
