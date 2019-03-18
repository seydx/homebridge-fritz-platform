# Changelog


## 3.1.3 - 2019-03-18
- Rewrite smarthome (fixed a bug with 404 not found error)

## 3.1.2 - 2019-03-17
- Bugfixes

## 3.1.1 - 2019-03-17
- Bugfixes (Smarthome, presence)

## 3.1.0 - 2019-03-17
- Smarthome: Changed "switch" accessory to "outlet" accessory
- Smarthome: Better "present" detection for smarthome devices
- PhoneBook: Auto refresh phonebook (polling: 1h)

Info: If you have Smarthome devices of type "switch" please REMOVE it first from HomeKit and config.json, restart homebridge and be sure that the accessory is removed from HomeKit! Re-add it again to config.json with the same parameter as before! This time it will expose as "outlet" to HomeKit, otherwise it can break your setup!

## v3.0.7 - 2019-03-16
- Fixed a bug with smarthome

## v3.0.6 - 2019-03-16
- Fixed a bug with callmonitor (outgoing calls)
- Added "test" file

## v3.0.5 - 2019-03-16
- Fixed a bug with empty config.json
- Fixed several bugs with smarthome
- Added 'present' function to smarthome

## v3.0.4 - 2019-03-03
- Fixed a bug with fetching SIDs for multiple devices

## v3.0.3 - 2019-03-03
- Added new function to callmonitor: Specify numbers for "incoming to" and "outgoing from" calls (usefull if using multiple numbers at home and want to trigger only for specified number in config

## v3.0.2 - 2019-03-02
- Added new function to devices: "Read Only" 

## v3.0.1 - 2019-03-02
- Fixed FakeGato for callmonitor and smarthome devices

## v3.0.0 - 2019-03-02

**Breaking changes, remove v2.x first before continue! Check also the new [example-config.json](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/example-config.json) !**

- **[NEW]** Callmonitor with extended FakeGato support
- **[NEW]** Callmonitor PhoneBook with auto prefix functionality
- **[NEW]** Callmonitor PhoneBook ultra fast storing
- **[NEW]** Support of BETA FritzBox firmware
- **[NEW]** Support of MESH functionality to decrease request amounts
- **[NEW]** Ring Lock
- **[NEW]** Fallback if no connection
- **[NEW]** Better debug logger (-D)
- **[NEW]** SmartHome Devices (plugs, contact sensors and thermostats)
- **[NEW]** SmartHome Switch accessory with external temp sensor accessory
- **[NEW]** FakeGato for smarthome devices
- **[FIX]** Better presence detection
- **[FIX]** Bugfixes and Speed improvements
- **[BETTER]** Rewritten dynamic platform
- **[BETTER]** Resource efficient
- **[REMOVE]** Presence as motion sensor
- **[REMOVE]** FakeGato for presence sensor

## v2.8.0 - 2018-02-11
- Fix TR064 Api

## v2.7.1 - 2018-06-20
- Bugfixes
- Note: "smarthome" were changed in config.json! Please check before update. ([example-config.json](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/example-config.json#L98))
- Note: 'thermo' & 'contact' currently not supported (smarthome)

## v2.7.0 - 2018-06-19
- Added [Smarthome devices](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/Smarthome.md) 
- Code cleanup
- Better error handling
- Bugfixes
- Added own reboot functionality to repeater. [example-config.json](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/example-config.json#L110)
- Removed repeater reboot from main device

## v2.6.4 - 2018-06-18
- Bugfixes
- Code cleanup
- Better error handling

## v2.6.2 - 2018-06-18
- Code clean up
- Bugfixes
- Added "[refresh wifi canal](https://github.com/SeydX/homebridge-fritz-platform/blob/cbe48c0a2b9b86bf9706711c19e4eb4f684f01f5/example/example-config.json#L23)"

## v2.6.0 - 2018-06-17
- Bugfixes
- Remote Login possibility [see docs](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/FritzBox.md)
- Updated dependencies
- Better interaction with the TR064 module

## v2.5.1 - 2018-06-15
- Bugfixes
- Code cleanup

## v2.5.0 - 2018-06-15
- Bugfixes
- Integrated tr064 api
- Speed up
- Code cleanup

## v2.4.4 - 2018-06-14
- Fixed callmonitor telegram notification
- Fixed Repeater state

## v2.4.3 - 2018-06-13
- Bugfixes
- Clean up code

## v2.4.2 - 2018-06-13
- Bugfixes
- Added called nr to callmonitor and telegram (% in config.messages.incoming as dynamic input)
- Added more flags to LogUtil
- Increased min timeout limit from 5s to 10s
- Better error handling
- Reboot function to repeater main switch > if switch off > reboot

## v2.4.1 - 2018-06-12
- Updated dependencies
- Fixed a bug in TR064 module that caused "Auth. Failed" by multiple requests

## v2.4.0 - 2018-06-11
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
