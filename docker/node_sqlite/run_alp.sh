#! /bin/bash

# rc-service sshd start

npm install -g npm

# # Download and install nvm:
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# # in lieu of restarting the shell
# \. "$HOME/.nvm/nvm.sh"

# # Download and install Node.js:
# nvm install 22

sleep infinity

# cd /var/fp_data
su node -c "npm install"
su node -c "npm run build"
su node -c "npm start"
# sleep infinity