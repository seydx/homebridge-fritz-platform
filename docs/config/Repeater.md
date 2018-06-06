# Fritz!Repeater

Like with the Fritz!Box, this plugin uses the TR 064 interface of the repeater to communicate with it. Port for it is 49000. So that the plugin runs perfectly, please enter the access data to FritzRepeater web interface in the config.json (if you dont hve a usernsme, judt ttake the username from your FritzBox). In addition to the TR064 interface, the plugin also uses the LUA interface for e.g. turn on the LED

The Plugin can also expose all available Wifi frequences and guest wifi access as characteristics to HomeKit. Note: Custom characteristics are only available with 3rd party apps like Elgato EVE etc.

```
"repeater": {
  "Fritz Repeater #1": {
    "disable": false,
    "ip": "192.168.178.56",
    "port": 49000,
    "username": "USERNAME",
    "password": "PASSWORD",
    "led": true,
    "wifi": {
      "2.4ghz": true,
      "5ghz": true,
      "guest": true
    }
  },
  "Fritz Repeater #2": {
    "disable": false,
    "ip": "192.168.178.75",
    "port": 49000,
    "username": "USERNAME",
    "password": "PASSWORD",
    "led": true,
    "wifi": {
      "2.4ghz": true,
      "5ghz": true,
      "guest": true
    }
  }
}
```

## Base
Required settings

| Attributes | Usage |
|------------|-------|
| disable | If true, Fritz!Repeater will be removed  |
| ip | Ip adress from repeater |
| port | Port for TR064 API (Default: 49000) |
| username | Username for Fritz!Repeater |
| password | Password for Fritz!Repeater |

## Options
Extra characteristics to show LED and Wifi 

| Attributes | Usage |
|------------|-------|
| LED | Switch characteristic to switch on/off LED |
| wifi.2.4ghz | Switch characteristic to switch on/off Wifi 2.4Ghz |
| wifi.5ghz | Switch characteristic to switch on/off Wifi 5Ghz |
| wifi.guest | Switch characteristic to switch on/off Wifi Guest |

## In-App Screenshots (Elgato EVE)

**Elgato Eve**
<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/images/Repeater.JPG" align="center" alt="Repeater EVE">
