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
