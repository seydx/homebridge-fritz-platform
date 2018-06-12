
/**
 * v2.4
 *
 * @url https://github.com/SeydX/homebridge-fritz-platform
 * @author SeydX <seyd55@outlook.de>
 *
**/

'use strict';

const fs = require('fs');

module.exports = function (homebridge) {
  if(!isConfig(homebridge.user.configPath(), 'platforms', 'FritzPlatform')) {
    return;
  }
  let FritzPlatform = require('./src/platform.js')(homebridge);
  homebridge.registerPlatform('homebridge-fritz-platform', 'FritzPlatform', FritzPlatform, true);
};

function isConfig(configFile, type, name) {
  let config = JSON.parse(fs.readFileSync(configFile));
  if('accessories' === type) {
    let accessories = config.accessories;
    for(const i in accessories) {
      if(accessories[i]['accessory'] === name) {
        return true;
      }
    }
  } else if('platforms' === type) {
    let platforms = config.platforms;
    for(const i in platforms) {
      if(platforms[i]['platform'] === name) {
        return true;
      }
    }
  }
  return false;
}
