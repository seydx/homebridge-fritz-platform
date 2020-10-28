# Multiple instances

If you are using multiple instances, than the reboot functionality will be perfect for you. The plugin includes 2 scripts to run with your reboot. 

E.g. the included [ON script](https://github.com/SeydX/homebridge-fritz-platform/blob/master/cmd/reboot-start.sh) will let stop all your homebridge instances before shutting down your network
and the [OFF script](https://github.com/SeydX/homebridge-fritz-platform/blob/master/cmd/reboot-finished.sh) will let you restart all of your homebridge instances after reboot is done and network is up!

This is ideal for people who do not want to worry about rebooting

**Example reboot-start.sh**
```
#!/bin/bash
#Homebridge Fritz Platform - reboot-start.sh

######################################## Instance names to stop ########################################

sudo systemctl stop homebridge-dev.service
sudo systemctl stop homebridge-hue.service
sudo systemctl stop homebridge-alexa.service

############################################## stop delay ##############################################

sleep 15
echo 1
```

**Example reboot-finished.sh**
```
#!/bin/bash
#Homebridge Fritz Platform - reboot-finished.sh

################################ Instance names to start after network reboot ############################

sudo systemctl restart homebridge-dev.service
sudo systemctl restart homebridge-hue.service
sudo systemctl restart homebridge-alexa.service

############################## extra start for homebridge-fritz-platform ###################################

sleep 20
sudo systemctl restart homebridge

echo 1
```

**Note:** The .services must be replaced with own instances
