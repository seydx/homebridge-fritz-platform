# SmartHome Accessory

If you want to control your DECT plugs, thermometer or sensors, you have to set it in the config.json



# Example Config

```
"smarthome": {
  "Work room DECT 200":{
    "type":"switch",
    "ain":"1234567890",
    "tempSensor":true,
    "unit":"celsius"
  },
  "Living room DECT 301":{
    "type":"thermo",
    "ain":"1234567890",
    "unit":"celsius",
    "heatValue":5,
    "coolValue":5,
    "windowSensor":true
  },
  "Kitchen Window":{
    "type":"contact",
    "ain":"1234567890"
  }
}
```



## Required parameter "switch"

| Attributes | Usage | Req |
|------------|-------|:----------:|
| name | Unique name for the accessory, eg Work room DECT 200 | X |
| type        | Must be "switch"            | X |
| ain         | AIN adresse from the device | X |
| tempSensor  | If true AND the switch provides a temperature sensor, a temperature sensor will be exposed to HomeKit (Default: false) |  |
| unit        | Unit for temperature sensor - celsius/fahrenheit (Default: celsius, fahrenheit may be buggy) |  |



## Required parameter "contact"

| Attributes  | Usage                       | Req  |
| ----------- | --------------------------- | :--: |
| name | Unique name for the accessory, eg Living room DECT 301   |  X   |
| type        | Must be "contact"           |  X   |
| ain         | AIN adresse from the device |  X   |



## Required parameter "thermo"

| Attributes  | Usage                                                        | Req  |
| ----------- | ------------------------------------------------------------ | :--: |
| name | Unique name for the accessory, eg Kitchen window |  X   |
| type        | Must be "thermo"                                             |  X   |
| ain         | AIN adresse from the device                                  |  X   |
| unit        | "celsius" or "fahrenheit" (fahrenheit may be buggy) (Default: celsius) |      |
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
