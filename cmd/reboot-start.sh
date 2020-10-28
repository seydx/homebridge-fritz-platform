#!/bin/bash
#Homebridge Fritz Platform - reboot-start.sh

######################################## Instance names to stop ########################################

sudo systemctl stop homebridge-dev.service
sudo systemctl stop homebridge-hue.service
sudo systemctl stop homebridge-alexa.service

############################################## stop delay ##############################################

sleep 15
echo 1
