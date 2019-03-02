# Wake on LAN

If you want to start wol capable devices with this plugin, you have to put the MAC adresses from the device in the config.json. The exposed switches supports only toggle function! So its not available to show the current state of the device.



## Example Config

```
"wol": {
  "Fernseher":"AA:00:BB:11:CC:ZZ",
  "Computer":"BB:11:ZZ:33:OO:AA"
}
```



## Required parameter

| Attributes | Usage | Req |
|------------|-------|:----------:|
| custom name | Own defined name for Home | x |
| mac adress | MAC adresse from the device | x |



**The MAC adresse can be found under Home network > network**

![WOL Settings](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/docs/images/wol_mac.png)



## Screenshots

![WOL](https://github.com/SeydX/homebridge-fritz-platform/raw/master/images/wol.jpg)