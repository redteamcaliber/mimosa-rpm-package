#!/bin/sh
export PATH=$PATH:/opt/node/node-v0.10.15-linux-x64/bin;

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
npm install -g grunt-cli
npm install
grunt rpm-build