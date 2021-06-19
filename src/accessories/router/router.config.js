'use strict';

const Config = (routerConfig, extrasConfig, optionsConfig) => {
  const validTypes = ['dsl', 'cable', 'repeater'];
  const validOptionsSwitches = ['wifi_2ghz', 'wifi_5ghz', 'wifi_guest', 'wps', 'led', 'lock'];
  const validOptionCharacteristics = [...validOptionsSwitches];

  if (routerConfig.master) {
    validOptionsSwitches.push('aw', 'dect', 'deflection');
    validOptionCharacteristics.push('aw', 'broadband', 'dect', 'deflection');
  }

  if (routerConfig.connection !== 'repeater') {
    validOptionsSwitches.push('reconnect');
    validOptionCharacteristics.push('reconnect');
  }

  return {
    active: routerConfig.active || false,
    name: routerConfig.name,
    type: 'router',
    subtype: validTypes.find((el) => el === routerConfig.connection) || 'dsl',
    host: routerConfig.host,
    port: routerConfig.port || 49000,
    username: routerConfig.username || false,
    password: routerConfig.password || false,
    manufacturer: routerConfig.manufacturer || false,
    model: routerConfig.model || false,
    serialNumber: routerConfig.serialNumber || false,
    master: routerConfig.master || false,
    ssl: routerConfig.ssl || false,
    tr064: routerConfig.tr064 || false,
    igd: false, //not used
    readOnly: routerConfig.readOnly || false,
    hide: routerConfig.hide || false,
    wifiUnits: parseInt(routerConfig.wifiUnits) > 0 ? parseInt(routerConfig.wifiUnits) : 2,
    oldFW: routerConfig.oldFW || false,
    connection: validTypes.find((el) => el === routerConfig.connection) || 'dsl',
    options: routerConfig.options || {},
    extras: extrasConfig,
    characteristics: Object.keys(routerConfig.options || {}).filter(
      (option) => validOptionCharacteristics.includes(option) && routerConfig.options[option] === 'characteristic'
    ),
    switches: Object.keys(routerConfig.options || {}).filter(
      (option) => validOptionsSwitches.includes(option) && routerConfig.options[option] === 'switch'
    ),
    reboot: optionsConfig.reboot,
  };
};

module.exports = Config;
