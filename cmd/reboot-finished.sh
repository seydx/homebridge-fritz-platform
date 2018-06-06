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
