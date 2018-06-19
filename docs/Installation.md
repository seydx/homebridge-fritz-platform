# Installation - First steps

Before you can use this plugin, you must activate the following options in the FritzBox settings under Home network > Network

- Allow access for applications
- transmit status information via UPnP

<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/images/heimnetzfreigabe.png" align="center" alt="Network Settings">

I also recommend giving the user full rights to make the plugin work properly

<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/images/user_rights.jpg" align="center" alt="Rights">

After the above settings have been made, the plugin can be installed as follows:

```
sudo npm install -g homebridge-fritz-platform@latest
```

Please follow the config instructions to add and start the plugin

   * [Configuring Fritz!Box](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/FritzBox.md)
   * [Configuring Fritz!Repeater](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/Repeater.md)
   * [Configuring Callmonitor](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/Callmonitor.md)
   * [Configuring Presence](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/Presence.md)
   * [Configuring Wake On Lan](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/WOL.md)
