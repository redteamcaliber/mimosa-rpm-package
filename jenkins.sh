#!/bin/sh
export PATH=$PATH:/opt/node/node-v0.10.15-linux-x64/bin;

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
sudo npm update -g
npm install grunt-cli --save-dev
npm install
./node_modules/.bin/grunt rpm-build