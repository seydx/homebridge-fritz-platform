# Smarthome

If you want to control your DECT plugs or thermometer _(thermometer currently not supported)_, you have to set it in the config.json

**Note:** Currently only plugs are supported. Thermometer will come in another version, also temperature and energy monitor are under development!
# Example Config

```
"smarthome": {
  "My DECT Plug One":"12345 67890",
  "My DECT Plug Two":"09876 54321",
  "My DECT Thermo One":"11223 44556",
}
```

## New devices
Parameter to expose new switches

| Attributes | Usage |
|------------|-------|
| custom name | Own defined name for Home |
| ain | AIN adresse from the device |


The AIN adresse can be found on the weboverview or behind the device

<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/images/ain1.jpg" align="center" alt="AIN1">
<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/images/ain2.jpg" align="center" alt="AIN2">
