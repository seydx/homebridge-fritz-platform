# Changelog


## v5.0.19 - 2020-12-05
- Fixed answering machine
- Improved debug for smarthome devices/groups

## v5.0.18 - 2020-12-04
- Updated config.schema.json to support humidity sensor

## v5.0.17 - 2020-12-04
- Added humidity sensor for supported smarthome devices (currently available only with Fritz!OS 7.24)

## v5.0.16 - 2020-11-27
- Bugfixes

## v5.0.15 - 2020-11-27
- Added new option to expose grouped smarthome devices.
- Adaptive Lighting
- Bugfixes

### Grouped Smarthome Devices
Grouped Smarthome Devices can be exposed as Lightbulbs, Switches/Outlets or a combination of both. If the group has a lightbulb AND a switch, the accessory will get both services and additionally (if enabled and supported by the device) a temperature sensor. The grouped switches/outlets and switch-lightbulbs comes also with FakeGato support and "ReadOnly" possibility. Lightbulbs and Switch-Lightbulbs also supports adaptive lighting.

## v5.0.14 - 2020-11-22
- Fixed ColorUtils for Smarthome Lightbulbs
- Removed waitFor* timeout for LightBulbs and Thermostats

## v5.0.13 - 2020-11-15
- Added new option: "cityPrefix" for callmonitor for better call detection
- Added new option: "active" for user (presence) to easily switch between enabled/disabled
- Added new option: "blockTelegram" for user (presence) to block sending telegram notification
- Phonebook improvements
- Added custom FakeGato timer for all FakeGato enabled accessories to fix gaps is histories
- Bugfixes

## v5.0.12 - 2020-11-15
- Fixed a bug with smarthome-window battery service
- Added function to remove battery service
- Bugfixes

## v5.0.11 - 2020-11-15
- Added more information to callmonitor telegram (now % will be replaced with your home nr)
- Replaced Telegraf with FormData
- Bugfixes

## v5.0.10 - 2020-11-15
- Added countryPrefix option to Callmonitor tu spport FritzBox devices without VOIP function
- Disabled AdaptiveLighting (not supported with official homebridge release, coming back with homebridge v1.3)
- Changed callmonitor incomingTo/outgoingFrom logic
- Bugfixes
- Bump FakeGato

## v5.0.9 - 2020-11-14
- Support for apple daptive lighting (coming with hb 1.3) for smarthome lightbulbs
- Bugfixes

## v5.0.8 - 2020-11-12
- Added support for color lightbulbs (eg DECT500)
- Bugfixes

## v5.0.7 - 2020-11-11
- Added new smarthome types (window/temperature)
- Fixed smarthom lightbulb
- readOnly for smarthome switch
- Added broadband again to masterdevice as characteristic (API)
- Bump fritzbox dep to fix username/passwords with special chars

## v5.0.6 - 2020-11-10
- Fixed callmonitor caller/called nr

## v5.0.5 - 2020-11-10
- Fixed callmonitor outgoing call

## v5.0.4 - 2020-11-10
- Fixed phonebook fetching numbers
- Updated fritzbox dep to allow special chars
- Fixed config.schema.json copy&paste

## v5.0.3 - 2020-11-10
- Fixed phoneBook readJson function

## v5.0.2 - 2020-11-10
- Fixed wol switch

## v5.0.1 - 2020-11-10
- Support for homebridge v1.3.0

## v5.0.0 - 2020-11-10
- Completely rewritten
- New: Homebridge (latest/beta) Support
- New: Config UI X Integration
- New: Polling with additional functions (exclude accessories)
- New: Possibility to display all 'Extras' like Wifi, Alarm, Led etc etc as Characteristic or as a separate switch in Apple Home
- New: Network Watch
- New: Configurable Callmonitor names
- New: Group Callmonitor sensors
- New: DECT station
- New: Ability to hide devices (router)
- New: Additional ping for presence
- New: Ability to change accessory typ for presence and anyone sensor, with FakeGato support
- New: Smarthome devices with FakeGato Support
- New: Smarthome Outlet Accessory with Fakegato for powermeter
- New: Smarthome Window Accessory with Fakegato for devices with built in windowOpen function
- New: Support for SmartHome Lights (only on/off and brightness)
- Removed: Broadband for compatibility reasons

**BREAKING CHANGES**

The new version is not compatible with version < 5! If you use version < 5 of this plugin, please remove it from Homekit/Homebridge before updating!

## v4.1.0 - 2019-06-16
- "Ping" feature was added as an extra check (if enabled in config.json)
- Phonebook Bugfix

## v4.0.9 - 2019-05-25
- Refactored Broadband measurement

## v4.0.8 - 2019-05-25
- Bugfixes (generating SID)

## v4.0.7 - 2019-05-24
- Bugfixes (callmonitor)
- Better debug (smarthome)

## v4.0.6 - 2019-05-22
- Refactored phoneBook
- Added "Blacklists" to Phonebook

## v4.0.4 - 2019-05-20
- Added better state detection for repeater

## v4.0.3 - 2019-05-20
- Bugfixes (SID)

## v4.0.2 - 2019-05-20
- Added option to disable auto search

## v4.0.1 - 2019-05-20
- Bugfixes
- Cleanup code

## v4.0.0 - 2019-05-19
- Refactored code
- Refactored API
- Support async/await
- Add automatically all supported devices in network to config
- Added own debug params (FritzPlatformApi,FritzPlatformTR064,FritzPlatformLUA)
- Auto config generator/validator at start
- Bugfixes


## v3.2.4 - 2019-04-26
- Bugfix


## v3.2.3 - 2019-04-24
- Bugfix (extReboot Telegram)


## v3.2.2 - 2019-04-24
- [NEW] Markdown Support for telegram notifications


## v3.2.1 - 2019-03-22
- Bugfixes
- Code cleanup

## v3.2 - 2019-03-21
- [NEW] Presence: new function 'onDelay'
- [NEW] Smarthome: New accessory (contact sensor) for **window open active** function (thermo)
- Code cleanup

## v3.1.5 - 2019-03-19
- Bump dependencies
- Code cleanup

## v3.1.4 - 2019-03-18
- [NEW] It is now possible to add multiple numbers to "incomingTo" and "outgoingFrom" (Callmonitor)
- Code cleanup
- Bugfixes

## v3.1.3 - 2019-03-18
- Rewrite smarthome (fixed a bug with 404 not found error)

## v3.1.2 - 2019-03-17
- Bugfixes

## v3.1.1 - 2019-03-17
- Bugfixes (Smarthome, presence)

## v3.1.0 - 2019-03-17
- Smarthome: Changed "switch" accessory to "outlet" accessory
- Smarthome: Better "present" detection for smarthome devices
- PhoneBook: Auto refresh phonebook (polling: 1h)

Info: If you have Smarthome devices of type "switch" please REMOVE it first from HomeKit and config.json, restart homebridge and be sure that the accessory is removed from HomeKit! Re-add it again to config.json with the same parameter as before! This time it will expose as "outlet" to HomeKit, otherwise it can break your setup!

## vv3.0.7 - 2019-03-16
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
