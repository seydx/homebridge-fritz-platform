'use strict';

const Config = (extrasName, extrasConfig, meshMaster) => {
  let name;

  switch (extrasName) {
    case 'alarm':
      name = meshMaster.config.name + ' Alarm';
      break;
    case 'wakeup':
      name = meshMaster.config.name + ' WakeUp';
      break;
    case 'ringlock':
      name = meshMaster.config.name + ' RingLock';
      break;
    case 'phoneBook':
      name = meshMaster.config.name + ' PhoneBook';
      break;
    case 'dnsServer':
      name = meshMaster.config.name + ' DNS';
      break;
    case 'fallbackInternet':
      name = meshMaster.config.name + ' Fallback';
      break;
    default:
      //fall through
      break;
  }

  const config = {
    name: name || null,
    type: 'extra',
    subtype: extrasName || null,
    oldFW: meshMaster.config.oldFW,
    extras: {},
  };

  config.extras[extrasName] = extrasConfig;

  return config;
};

module.exports = Config;
