/**
 * v5
 *
 * @url https://github.com/SeydX/homebridge-fritz-platform
 * @author SeydX <seyd55@outlook.de>
 *
**/

'use strict';

module.exports = function (homebridge) {

  let FritzPlatform = require('./src/platform.js')(homebridge);
  homebridge.registerPlatform('homebridge-fritz-platform', 'FritzPlatform', FritzPlatform, true);

};