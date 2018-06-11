# Changelog

## v2.3.9 - 2018-06-11
- Fixed telegram notification for callmonitor

## v2.3.8 - 2018-06-11
- Changed presence polling
- Added possibility to remove/add "Anyone" sensor from config.json (see [example-config.json](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/example-config.json))

## v2.3.7 - 2018-06-11
- Better presence detection
- Changed telegram notification for presence (see [example-config.json](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/example-config.json))
- Changed telegram function (possibility to choose which message should pushed as notification, if any message field = "" or not exist, you will not receive any notification for only this function without affecting other functions)
- Polling limit reduced from 10s to 5s
- Bugfixes
- New [Debug tool](https://github.com/SeydX/fritzplatform-util)

## v2.3.6 - 2018-06-08
- Fixed Auth. failure (presence)
- Fixed Telegram push notification (presence)

## v2.3.4 - 2018-06-08
- Fixed Auth. failure (presence)

## v2.3.3 - 2018-06-08
- Changed presence structure (see [example-config.json](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/example-config.json))
- An error has been fixed that caused the presence sensors not to switch correctly (if no presence detected)
- Improved presence adresse detection
- Possiblitiy to add ip adress to presence

## v2.3.2 - 2018-06-08
- Added "type" option to presence sensors (motion/occupancy)
- Fixed a bug with presence delay
- Update dependencies
- Clean up code

## v2.3.1 - 2018-06-07
- Added type to config.json to support cable router _("type":"cable" , Default: "type":"dsl")_

## v2.3.0 - 2018-06-07
- Added "delay" option to presence
- Bugfixes (callmonitor)
- Fixed a bug with initializing config.json

## v2.2.7 - 2018-06-07
- Added ip information for Reboot and Reconnect
- Clean up code

## v2.2.5 - 2018-06-06
- Created initial basic accessory and initial work


# Functions in progress
- [ ] Fritz!SmartHome device implementations
- [ ] Ring lock
- [x] Debug tool (in work)
- [x] Support for cable router like Fritz!Box 6490 etc
