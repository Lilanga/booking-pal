#!/bin/sh
# Script to build a release package to upload to Github

GIT_DIR=$(pwd)
cd /tmp
rm -rf booking-pal
rm -rf booking-pal
git clone $GIT_DIR
cd booking-pal

NODE_ENV=development npm install
NODE_ENV=production node_modules/.bin/webpack -p --config webpack.prod.config.js
rm -rf node_modules

NODE_ENV=production npm install
rm -rf BookingPal-linux-armv7l
npm run pack:pi
rm BookingPal-linux-armv7l/resources/app/{config,credentials}/*
zip -yr BookingPal-linux-armv7l.zip BookingPal-linux-armv7l/*
