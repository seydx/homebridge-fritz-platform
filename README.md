# Homebridge Fritz!Platform 

This dynamic platform plugin allows almost full control of AVM hardware like Fritz!Box, Fritz!Repeater and Fritz!Fon. 

Any system capable of running [Homebridge](https://github.com/nfarina/homebridge/) can be used to run homebridge-fritz-platform. The only need is network access to the device or program in question.

Among other things, homebridge-fritz-platform allows the switching of all WLAN frequencies, guest WLAN, answering machine, wake-up call, call monitor, presence sensors with FakeGato and much more!

## Status
[![npm](https://img.shields.io/npm/v/homebridge-fritz-platform.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-fritz-platform)
[![npm](https://img.shields.io/npm/dt/homebridge-fritz-platform.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-fritz-platform)
[![GitHub last commit](https://img.shields.io/github/last-commit/SeydX/homebridge-fritz-platform.svg?style=flat-square)](https://github.com/SeydX/homebridge-fritz-platform)

## Changelog
See the [changelog](https://github.com/SeydX/homebridge-fritz-platform/blob/master/CHANGELOG.md) for changes between versions of this package.

## Documentation

- [Supported HomeKit Apps](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Apps.md)
- [Tested Devices](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Supported.md)
- [Installation instruction](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Installation.md)
   * [Configuring Fritz!Box](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/FritzBox.md)
   * [Configuring Fritz!Repeater](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/Repeater.md)
   * [Configuring Callmonitor](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/Callmonitor.md)
   * [Configuring Presence](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/Presence.md)
   * [Configuring Wake On Lan](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/WOL.md)
- Examples
   * [Example config.json](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/example-config.json)
   * [Multiple instances (for Reboot)](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/MultipleInstances.md)
   * [Telegram Notification instructions](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/Telegram.md)

## Contributing

You can contribute to this homebridge plugin in following ways:

- [Report issues](https://github.com/SeydX/homebridge-fritz-platform/issues) and help verify fixes as they are checked in.
- Review the [source code changes](https://github.com/SeydX/homebridge-fritz-platform/pulls).
- Contribute bug fixes.
- Contribute changes to extend the capabilities
- Pull requests are accepted.

This Plugin uses modules from others, see [CONTRIBUTING](https://github.com/SeydX/homebridge-fritz-platform/blob/master/CONTRIBUTING.md) for credits.

## Licens

MIT License

Copyright (c) 2017 SeydX

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
