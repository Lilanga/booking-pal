#!/bin/bash

rm /tmp/BookingPal-linux-armv7l.zip
wget -P /tmp `curl -s https://api.github.com/repos/Lilanga/booking-pal/releases | grep browser_download_url | head -n 1 | cut -d '"' -f 4`

rm -rf /tmp/BookingPal-linux-armv7l
cd /tmp
unzip /tmp/BookingPal-linux-armv7l.zip

killall BookingPal
mkdir /home/pi/BookingPal
cp -R /tmp/BookingPal-linux-armv7l/* /home/pi/BookingPal/
/home/pi/BookingPal/BookingPal
