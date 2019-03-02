# Multiple instances

If you are using multiple instances, than the extended reboot functionality will be perfect for you. The plugin includes 2 scripts to run with your reboot. 

E.g. the included ON script in the ..cmd/ folder wil let stop all your homebridge instances before shutting down your network
and the ON script in the ..cmd/ folder will let you restart all of your homebridge instances after reboot is done and network is up!

This is ideal for people who do not want to worry about rebooting

**Example reboot-start.sh**
```
#!/bin/bash
#Homebridge Fritz Platform - reboot-start.sh

######################################## Instance names to stop ########################################

sudo systemctl stop homebridge-alexa.service 
sudo systemctl stop homebridge-broadband.service 
sudo systemctl stop homebridge-broadlink.service 
sudo systemctl stop homebridge-cameras.service 
sudo systemctl stop homebridge-chromecast.service
sudo systemctl stop homebridge-cmdswitch.service 
sudo systemctl stop homebridge-hue.service 
sudo systemctl stop homebridge-magichome.service 
sudo systemctl stop homebridge-miaqara.service 
sudo systemctl stop homebridge-misecurity.service
sudo systemctl stop homebridge-mqtt.service
sudo systemctl stop homebridge-raspi.service 
sudo systemctl stop homebridge-seasons.service 
sudo systemctl stop homebridge-tado.service
sudo systemctl stop homebridge-telegram.service

############################################## stop delay ##############################################

sleep 15
echo 1
```

**Example reboot-finished.sh**
```
#!/bin/bash
#Homebridge Fritz Platform - reboot-finished.sh

##################################### Start delay after network reboot ###################################

sleep 300

################################ Instance names to start after network reboot ############################

sudo systemctl restart homebridge-alexa.service 
sudo systemctl restart homebridge-broadband.service 
sudo systemctl restart homebridge-broadlink.service 
sudo systemctl restart homebridge-cameras.service 
sudo systemctl restart homebridge-chromecast.service
sudo systemctl restart homebridge-cmdswitch.service 
sudo systemctl restart homebridge-hue.service 
sudo systemctl restart homebridge-magichome.service 
sudo systemctl restart homebridge-miaqara.service 
sudo systemctl restart homebridge-misecurity.service
sudo systemctl restart homebridge-mqtt.service
sudo systemctl restart homebridge-raspi.service 
sudo systemctl restart homebridge-seasons.service 
sudo systemctl restart homebridge-tado.service
sudo systemctl restart homebridge-telegram.service
sudo systemctl restart homebridge-testtwo.service 


############################## extra start for homebridge-fritz-platform ###################################

sleep 20
sudo systemctl restart homebridge-fritz-platform

echo 1
```

**Note:** The .services must be replaced with own instances