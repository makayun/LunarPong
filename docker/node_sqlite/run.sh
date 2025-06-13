#! /bin/bash

rc-service sshd start
# cd /var/fp_data
su node -c "npm install"
su node -c "npm run build"
su node -c "npm start"
# sleep infinity