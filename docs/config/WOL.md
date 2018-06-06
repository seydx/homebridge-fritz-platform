# Wake on LAN

If you want to start wol capable devices with this plugin, you have to put the MAC adresses from the device in the config.json. The exposed switches supports only toggle function! So its not available to show the current state of the device.

# Example Config

```
"wol": {
  "Fernseher":"AA:00:BB:11:CC:ZZ",
  "Computer":"BB:11:ZZ:33:OO:AA"
}
```

## New devices
Parameter to expose new switches

| Attributes | Usage |
|------------|-------|
| custom name | Own defined name for Home |
| mac adress | MAC adresse from the device |


The MAC adresse can be found unter Home network > network

<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/images/wol_mac.png" align="center" alt="WOL MAC">
