#!/bin/sh

# Create uac_ws self signed certificates for use with HTTPS.

openssl genrsa -des3 -out uac_ws.key 1024
openssl req -new -key uac_ws.key -out uac_ws.csr
openssl x509 -req -days 365 -in uac_ws.csr -signkey uac_ws.key -out uac_ws.crt
openssl req -newkey rsa:1024 -new -nodes -x509 -days 3650 -keyout uac_ws_key.pem -out uac_ws_cert.pem

