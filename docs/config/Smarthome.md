# SmartHome Accessory

If you want to control your DECT plugs, thermometer or sensors, you have to set it in the config.json



# Example Config

```
"smarthome": {
  "Work room DECT 200":{
    "active":true,
    "devType":"switch",
    "ain":"1234567890",
    "tempSensor":true
  },
  "Living room DECT 301":{
    "active":true,
    "devType":"thermostat",
    "ain":"1234567890"
    "heatValue":5,
    "coolValue":5,
    "windowSensor":true
  },
  "Kitchen Window":{
    "active":true,
    "devType":"contact",
    "ain":"1234567890"
  }
}
```



## Required parameter "switch"

| Attributes | Usage | Req |
|------------|-------|:----------:|
| name | Unique name for the accessory, eg Work room DECT 200 | X |
| active | Activate/Deactivate Accessory (default: false) | |
| devType        | Must be "switch"            | X |
| ain         | AIN adresse from the device | X |
| tempSensor  | If true AND the switch provides a temperature sensor, a temperature sensor will be exposed to HomeKit (Default: false) |  |



## Required parameter "contact"

| Attributes  | Usage                       | Req  |
| ----------- | --------------------------- | :--: |
| name | Unique name for the accessory, eg Living room DECT 301   |  X   |
| active | Activate/Deactivate Accessory (default: false) | |
| devType        | Must be "contact"           |  X   |
| ain         | AIN adresse from the device |  X   |



## Required parameter "thermostat"

| Attributes  | Usage                                                        | Req  |
| ----------- | ------------------------------------------------------------ | :--: |
| name | Unique name for the accessory, eg Kitchen window |  X   |
| active | Activate/Deactivate Accessory (default: false) | |
| devType        | Must be "thermostat"                                             |  X   |
| ain         | AIN adresse from the device                                  |  X   |
| heatValue   | Value for the "Heat" mode. Example: a value of 4 will heat up the room to **Current Room Temperature + 4 degrees** (Default: 5) |      |
| coolValue   | Value for the "Cool" mode. Example: a value of 4 will cool up the room to **Current Room Temperature - 4 degrees** (Default: 5) |      |
| windowSensor | If true, a contact sensor will be exposed to HomeKit that reacts to the window open detection from the DECT device with Fakegato support (Default: false) | |



The AIN adresse can be found on the weboverview or behind the device


## Screenshots

![AIN](https://github.com/SeydX/homebridge-fritz-platform/raw/master/docs/images/ain1.jpg)

![Settings](https://github.com/SeydX/homebridge-fritz-platform/raw/master/docs/images/ain2.jpg)



![Smarthome1](https://github.com/SeydX/homebridge-fritz-platform/raw/master/images/smarthome_tempsensor.jpg)



![Smarthome2](https://github.com/SeydX/homebridge-fritz-platform/raw/master/images/smarthome_thermosensor.jpg)



![Smarthome](https://github.com/SeydX/homebridge-fritz-platform/raw/master/images/smarthome_contactsensor.jpg)
