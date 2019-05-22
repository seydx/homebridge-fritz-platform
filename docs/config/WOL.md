# Wake on LAN

If you want to start wol capable devices with this plugin, you have to put the MAC adresses from the device in the config.json. The exposed switches supports only toggle function! So its not available to show the current state of the device.



## Example Config

```
"wol": [
  {
    "active": true,
    "name": "Fernseher",
    "address": "04:5D:4B:0C:E3:47"
  }
],
```



## Required parameter

| Attributes | Usage | Req |
|------------|-------|:----------:|
| active | Activate/Deactivate accessory _(Default: false)_ |  |
| name | Unique name for the accessory, eg Fernseher or Computer etc. | x |
| address | MAC adresse from the device | x |



**The MAC adresse can be found under Home network > network**

![WOL Settings](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/docs/images/wol_mac.png)



## Screenshots

![WOL](https://github.com/SeydX/homebridge-fritz-platform/raw/master/images/wol.jpg)
