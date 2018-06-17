# Fritz!Box

This plugin uses the TR 064 interface of the router to communicate with it. Host can be the local address (fritz.box) or ip adresse or the myfritz adress (for remote login). Port is 49000 (or port setted in the settings for remote login). So that the plugin runs perfectly, please enter the access data from FritzBox web interface in the config.json. Timeout defines the maximum time a request can take (in seconds). Polling is the time span when the data should be refreshed. Type is required if you are using cable router like Fritz!Box 6490 etc. In this case, you need to put "type":"cable" in the config.json

# Example Config

```
  "platform": "FritzPlatform",
  "name": "FritzBox",
  "host": "fritz.box",
  "port": 49000,
  "type": "dsl",
  "timeout": 5,
  "username": "USERNAME",
  "password": "PASSWORD",
  "polling": 10
```

## Base
Required characteristics

| Attributes | Usage |
|------------|-------|
| platform | Platform name, must be '**FritzPlatform**' |
| name | Plugin name |
| host | Host, IP or Remote addresse of the device |
| port | Port of the device (Default: 49000, or port setted in the settings for remote login) |
| type | Type of the device (cable/dsl, Default: dsl) |
| timeout | Timeout for requests in seconds |
| username | Username for logging in to the above device |
| password | Password for logging in to the above device |
| polling | Polling in seconds (only for presence) |

# WIFI (extra characteristics)

```
"wifi": {
  "2.4ghz": true,
  "5ghz": true,
  "guest": true,
  "wps": true,
  "refreshCanal":true
}
```

| Attributes | Usage |
|------------|-------|
| 2.4ghz | Switch to turn on/off 2.4GHZ WIFI |
| 5ghz | Switch to turn on/off 5GHZ WIFI |
| guest | Switch to turn on/off Guest WIFI |
| wps | Switch to turn on/off WPS |
| refreshCanal | Switch to refresh WIFI canal |

# Options (extra characteristics)

```
"options": {
  "deflection": true,
  "answeringMachine": true,
  "devicelock": true,
  "debug": false,
  "phoneBook": true,
  "broadband": {
    "disable": true,
    "maxTime": 5,
    "polling": 60
  },
  "wakeup": {
    "internNr": "**620",
    "duration": 30
  },
  "alarm": {
    "telNr": "01234567890",
    "duration": 30,
    "telegram": true,
    "token": "TOKENHERE",
    "chatID": "CHATIDHERE",
    "messages": {
      "activated": "Alarm activated! Call @!",
      "deactivated": "Alarm deactivated"
    }
  },
  "reboot": {
    "disable": false,
    "cmd_on": "sh /var/homebridge-fritz-platform/reboot-start.sh",
    "cmd_off": "sh /var/homebridge-fritz-platform/reboot-finished.sh",
    "telegram": true,
    "token": "TOKENHERE",
    "chatID": "CHATIDHERE",
    "messages": {
      "on": "Network reboot started!",
      "off": "Network reboot completed! @ "
    }
  }
}
```
_('@' means dynamic content, @ will be replaced by "IP:123.123.123.123" to show new external ip adress after reboot finished or call number by "alarm")_

## Options.Broadband
Extra characteristics to show broadband measurements (download, speed and ping)

| Attributes | Usage |
|------------|-------|
| disable | If true, broadband characteristics will be removed |
| maxTime | The maximum length of a single test run in seconds (Default: 5s) |
| polling | Interval for checking the broadband in mins (Default: 60min) |
| type | The type of your router (dsl or cable - Default: dsl) |

## Options.Wakeup
Extra characteristics to call a in the config setted **intern** handset device

| Attributes | Usage |
|------------|-------|
| internNr | The intern number of the device we want to call (Fritz!Box > Telephony > Telephony devices) |
| duration | The duration of the call (Default: 30s)  |

## Options.Alarm
Extra characteristics to call a in the config setted **extern** handset device

| Attributes | Usage |
|------------|-------|
| telNr | The number of the device we want to call |
| duration | The duration of the call (Default: 30s)  |
| telegram | If true, push notifications of alarm |
| token | Token from your bot |
| chatID | Token from chatID where the notification will go |
| messages.activated | ON message (If reboot starts) |
| messages.deactivated | OFF message (If reboot finish) |

## Options.Reboot
Extra characteristics to call a in the config setted **extern** handset device

| Attributes | Usage |
|------------|-------|
| disable | If true, broadband characteristics will be removed |
| cmd_on | Path to a script to run parallel with the reboot (not required) |
| cmd_off | Path to a script to run after reboot is done (not required) |
| telegram | If true, push notifications of reboot |
| token | Token from your bot |
| chatID | Token from chatID where the notification will go |
| messages.on | ON message (If reboot starts) |
| messages.off | OFF message (If reboot finish) |

## Others
Extra chracteristics for other options

| Attributes | Usage |
|------------|-------|
| deflection | Switch characteristic for Fritz!Box deflection |
| answeringMachine | Switch characteristic for Fritz!Box Answering Machine |
| devicelock | Switch characteristic for Fritz!Box Device Lock |
| phoneBook | Switch characteristic to save Fritz!Box Phone Book in storage (needed for show the name of incoming calls) |
| debug | Switch characteristic to send DEBUG to log |

## Remote Settings

<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/images/remoteLogin.jpg" alt="Remote Login">

## In-App Screenshots (Elgato EVE)

**Elgato EVE Overview**

<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/images/device_characteristics1.PNG" alt="Overview">
<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/images/device_characteristics2.PNG" alt="Overview">
