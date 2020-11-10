<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="200"></a>
</p>



# homebridge-fritz-platform


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
  - Wakeup
- **Fritz!Repeater**
  - Repeater status and switch functionality,
  - WLAN 2.4Ghz,
  - WLAN 5Ghz,
  - WLAN Guest,
  - WPS,
  - Device LED,
  - Device Lock
- **Fritz!Fon**
  - Callmonitor,
  - FakeGato support
- **Fritz!DECT Outlets, Fritz!Powerline Outlets**
  - Switch/Outlet status and switch functionality,
  - Power meter,
  - Temperature sensor with FakeGato,
  - FakeGato support
- **Fritz!DECT Lights**
  - Light status and switch functionality,
  - Brightness adjustment
- **Fritz!DECT Thermostats, Comet!DECT Thermostats**
  - Thermostat current state, target state, current temperature and target temperature state and switch functionality,
  - Temperature sensor,
  - Window sensor (for window open functionality)
  - FakeGato support
- **HAN-FUN sensors (e.g. Deutsche Telekom)**
  - Contact state,
  - FakeGato support
- **Presence**
  - Detect occupancy through wifi,
  - Fakegato support
- **Watch Network**
  - Control devices if connected or disconnected from network
- **Telegram**
  - Receive custom messages for occupancy detection (presence), device detection (watch network), incoming/outgoing calls (callmonitor), alarm and router state

Any system capable of running [Homebridge](https://github.com/nfarina/homebridge/) can be used to run **homebridge-fritz-platform**. The only need is network access to the device or program in question.


## Status

[![npm](https://img.shields.io/npm/v/homebridge-fritz-platform.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-fritz-platform)
[![npm](https://img.shields.io/npm/dt/homebridge-fritz-platform.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-fritz-platform)
[![GitHub last commit](https://img.shields.io/github/last-commit/SeydX/homebridge-fritz-platform.svg?style=flat-square)](https://github.com/SeydX/homebridge-fritz-platform)
[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg?style=flat-square&maxAge=2592000)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=NP4T3KASWQLD8)


**Creating and maintaining Homebridge plugins consume a lot of time and effort, if you would like to share your appreciation, feel free to "Star" or donate.**

[Click here](https://github.com/SeydX) to review more of my plugins.



## Changelog

See the [changelog](https://github.com/SeydX/homebridge-fritz-platform/blob/master/CHANGELOG.md) for changes between versions of this package.

**<u>NOTE:</u>** Updating from **< v5.x** to **>= v5.x** will crash your homebridge, please **REMOVE** the old version first and check also the new [example-config.json](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/example-config.json) !



## Documentation

- [Supported HomeKit Apps](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Apps.md)
- [Tested Devices](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Supported.md)
- [Common issues & FAQs](https://github.com/SeydX/homebridge-fritz-platform/blob/master/FAQ.md)
- [First Start](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/FirstStart.md)
- [Installation instruction](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Installation.md)
- [Configuring Callmonitor](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/Callmonitor.md)
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



## Licens

**MIT License**

Copyright (c) 2019-2020 **Seyit Bayraktar**

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
