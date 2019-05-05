# Fritz!Box General

Here are some points from the example-config.json which will be explained in more detail.




## Configuration

```
"anyone":true,
"delay": 90,
"onDelay": 15,
"polling": 5,
"timeout": 10,
"readOnlySwitches":true
```



## Required parameter

| Attributes | Usage                                                        | Req  |
| ---------- | ------------------------------------------------------------ | :--: |
| anyone     | If true, the plugin will expose an "Anyone" occupancy sensor to HomeKit (Default: false) |      |
| delay      | Delay in seconds before an occupancy sensor will go to "not detected" (Default: 10s) |     |
| onDelay      | Delay in seconds before an occupancy sensor will go to "detected" (Default: false) |     |
| polling   | Polling in seconds (Default: 5s) |      |
| timeout   | Timeout in seconds before a request will break (Default: 5s) |      |
| readOnlySwitches   | If true, the device switches will not trigger anymore if on/off (Default: false) |      |
