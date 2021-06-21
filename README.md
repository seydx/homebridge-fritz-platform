<p align="center">
    <img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/images/fb_logo.png" height="200">
</p>

# homebridge-fritz-platform

[![npm](https://img.shields.io/npm/v/homebridge-fritz-platform.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-fritz-platform)
[![npm](https://img.shields.io/npm/dt/homebridge-fritz-platform.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-fritz-platform)
[![GitHub last commit](https://img.shields.io/github/last-commit/SeydX/homebridge-fritz-platform.svg?style=flat-square)](https://github.com/SeydX/homebridge-fritz-platform)
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![Discord](https://img.shields.io/discord/432663330281226270?color=728ED5&logo=discord&label=discord)](https://discord.gg/kqNCe2D)
[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg?style=flat-square&maxAge=2592000)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=NP4T3KASWQLD8)

**Creating and maintaining Homebridge plugins consume a lot of time and effort, if you would like to share your appreciation, feel free to "Star" or donate.** [Click here](https://github.com/SeydX) to review more of my plugins.

[Click here](https://github.com/SeydX) to review more of my plugins.


## Info

This plugin allows almost full control of **AVM** hardware like:

- **Fritz!Box**
  - Router status and switch functionality,
  - WLAN 2.4Ghz,
  - WLAN 5Ghz, 
  - WLAN Guest,
  - WPS,
  - DECT,
  - Answering Machine,
  - Deflection,
  - Device LED,
  - Device Lock,
  - Ring Lock,
  - Phonebook,
  - Alarm,
  - Wakeup,
  - DNS Server
  - Broadband
  - Reconnect
  - Child Lock
  - Fallback Internet
- **Fritz!Repeater**
  - Repeater status and switch functionality,
  - WLAN 2.4Ghz,
  - WLAN 5Ghz,
  - WLAN Guest,
  - WPS,
  - Device LED,
  - Device Lock
- **Fritz!Fon**
  - Callmonitor (with adjustable filter for incoming/outgoing numbers),
  - FakeGato support
- **Fritz!DECT Buttons**
  - Support for buttons with 1/4 channels (Fritz DECT 400/440)
  - Temperature sensor with FakeGato,
  - Humidity sensor with FakeGato,
  - FakeGato support
- **Fritz!DECT Outlets, Fritz!Powerline Outlets**
  - Switch/Outlet status and switch functionality,
  - Power meter,
  - Temperature sensor with FakeGato,
  - Telegram notification when device is in use/not in use
  - FakeGato support
- **Fritz!DECT Lights**
  - Light status and switch functionality,
  - Brightness adjustment,
  - Color adjustment,
  - Apple adaptive lighting
- **Fritz!DECT Thermostats, Comet!DECT Thermostats**
  - Thermostat current state, target state, current temperature and target temperature state and switch functionality,
  - Temperature sensor,
  - Humidity sensor with FakeGato,
  - Window sensor (for window open functionality)
  - Open Window detection (to trigger manually open window)
  - FakeGato support
- **Rollotron DECT 1213/Blind/Shutter**
  - Position adjustment/status
- **HAN-FUN sensors (e.g. Deutsche Telekom)**
  - Contact state,
  - FakeGato support
- **Presence**
  - Detect occupancy through wifi,
  - Fakegato support
- **Watch Network**
  - Control devices if connected or disconnected from network
- **Telegram**
  - Receive custom messages for occupancy detection (presence), device detection (watch network), incoming/outgoing calls (callmonitor), alarm, router state and outlet usage

Any system capable of running [Homebridge](https://github.com/nfarina/homebridge/) can be used to run **homebridge-fritz-platform**. The only need is network access to the device or program in question.


## Changelog

See the [changelog](https://github.com/SeydX/homebridge-fritz-platform/blob/master/CHANGELOG.md) for changes between versions of this package.

**<u>NOTE:</u>** Updating from **< v5.x** to **>= v5.x** will crash your homebridge, please **REMOVE** the old version first and check also the new [example-config.json](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/example-config.json) !



## Documentation

- [Supported HomeKit Apps](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Apps.md)
- [Tested Devices](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Supported.md)
- [Installation instruction](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Installation.md)
- [First Start](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/FirtStart.md)
- [Configuring Callmonitor](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Callmonitor.md)
- <u>Examples</u>
   * [Example config.json](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/example-config.json)
   * [Multiple instances (for extended reboot)](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/MultipleInstances.md)
   * [Telegram Notification instructions](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Telegram.md)
- [Debugging](https://github.com/SeydX/homebridge-fritz-platform/blob/master/DEBUG.md)



## Contributing

You can contribute to this homebridge plugin in following ways:

- [Report issues](https://github.com/SeydX/homebridge-fritz-platform/issues) and help verify fixes as they are checked in.
- Review the [source code changes](https://github.com/SeydX/homebridge-fritz-platform/pulls).
- Contribute bug fixes.
- Contribute changes to extend the capabilities
- Pull requests are accepted.

This Plugin uses modules from others, see [CONTRIBUTING](https://github.com/SeydX/homebridge-fritz-platform/blob/master/CONTRIBUTING.md) for credits.


## Disclaimer

All product and company names are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.
