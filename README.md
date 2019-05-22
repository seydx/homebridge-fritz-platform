<p align="center">
    <img src="https://i.imgur.com/YAEtHb5.png">
</p>



# Fritz!Platform

This dynamic platform plugin allows almost full control of **AVM** hardware like:

- Fritz!Box, 
- Fritz!Fon,
- Fritz!WLAN Repeater,
- Fritz!DECT Repeater,
- Fritz!DECT Outlets,
- Fritz!DECT Thermostats,
- Comet!DECT Thermostats,
- Fritz!Powerline Outlets (510, 540),
- HAN-FUN sensors (e.g. Deutsche Telekom)

Any system capable of running [Homebridge](https://github.com/nfarina/homebridge/) can be used to run **homebridge-fritz-platform**. The only need is network access to the device or program in question.

Among other things, **homebridge-fritz-platform** allows the switching of all WLAN frequencies, guest WLAN, answering machine, wake-up call, occupancy sensors, callmonitor as motion sensors with [FakeGato](https://github.com/simont77/fakegato-history) and much more!



## Status

[![npm](https://img.shields.io/npm/v/homebridge-fritz-platform.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-fritz-platform)
[![npm](https://img.shields.io/npm/dt/homebridge-fritz-platform.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-fritz-platform)
[![GitHub last commit](https://img.shields.io/github/last-commit/SeydX/homebridge-fritz-platform.svg?style=flat-square)](https://github.com/SeydX/homebridge-fritz-platform)
[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg?style=flat-square&maxAge=2592000)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=NP4T3KASWQLD8)
[![Slack Status](https://img.shields.io/badge/Slack-Join-red.svg)](https://join.slack.com/t/hbfritzplatform/shared_invite/enQtNjM5OTYzNTMzNDI0LTJjOTRlZTM2ODAzYmJhYzI2MGUzYjIzOTc1ZGNhNzg3YzRiZWFmNTcyNDczM2QwNGViOWQwNGM1Y2NkZjllODE)


**Creating and maintaining Homebridge plugins consume a lot of time and effort, if you would like to share your appreciation, feel free to "Star" or donate.**

[Click here](https://github.com/SeydX) to review more of my plugins.



## Changelog

See the [changelog](https://github.com/SeydX/homebridge-fritz-platform/blob/master/CHANGELOG.md) for changes between versions of this package.

**<u>NOTE:</u>** Updating from **v2.x** to **v3.x** or **v3.x** to **v4.x** will crash your homebridge, please **REMOVE** the old version first and check also the new [example-config.json](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/example-config.json) !



## Documentation

- [Supported HomeKit Apps](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Apps.md)
- [Tested Devices](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Supported.md)
- [Common issues & FAQs](https://github.com/SeydX/homebridge-fritz-platform/blob/master/FAQ.md)
- [First Start](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/FirstStart.md)
- [Installation instruction](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Installation.md)
   * [Configuring Fritz!Box](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/FritzBox.md)
   * [Configuring Fritz!Box Extras](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/Extras.md)
   * [Configuring Callmonitor](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/Callmonitor.md)
   * [Configuring Presence](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/Presence.md)
   * [Configuring Wake On Lan](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/WOL.md)
   * [Configuring SmartHome (DECT, HAN-FUN, Comet!DECT)](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/Smarthome.md)
   * [Configuring Telegram](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/Telegram.md)
   * [General Config](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/General.md)
- <u>Examples</u>
   * [Example config.json](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/example-config.json)
   * [Multiple instances (for extended reboot)](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/MultipleInstances.md)
   * [Telegram Notification instructions](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Telegram.md)
- [Debugging](https://github.com/SeydX/homebridge-fritz-platform/blob/master/DEBUG.md)
   * [Fritz!Platform Debug util](https://github.com/SeydX/fritzplatform-util)
   * [~~Fritz!Platform Config Generator~~ (deprecated)](https://github.com/SeydX/fritzplatform-config)



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

Copyright (c) 2019 **Seyit Bayraktar**

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
