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

######################################### Telegram Message #############################################

curl -s -X POST https://api.telegram.org/botTOKENHERE/sendMessage -d chat_id=CHATIDHERE -d text="Network reboot starts"