# Smarthome

If you want to control your DECT plugs or thermometer _(thermometer and contact sensor currently not supported)_, you have to set it in the config.json

**Note:** Currently **ONLY** plugs are supported. Thermometer and contact sensors will come in another version, also temperature and energy monitor are under development!
# Example Config

```
"smarthome": {
  "Dect 1":{
    "disable":false,
    "type":"plug",
    "ain":"12345 67890"
  },
  "Dect 2":{
    "disable":false,
    "type":"thermo",
    "ain":"00998 76655"
  },
  "Dect 3":{
    "disable":false,
    "type":"contact",
    "ain":"09876 54321"
  },
}
```

## New devices
Parameter to expose new switches

| Attributes | Usage |
|------------|-------|
| custom name | Own defined name for Home |
| disable | If disable = false, accessory will exposed to HomeKit, otherwise it will be removed |
| type | Type from Accessory (plug, thermo or contact) |
| ain | AIN adresse from the device |


The AIN adresse can be found on the weboverview or behind the device

<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/images/ain1.jpg" align="center" alt="AIN1">
<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/images/ain2.jpg" align="center" alt="AIN2">
