FROM node
# COPY ssh_host_ed25519_key.pub /etc/ssh/
# COPY --chmod=0600 ssh_host_ed25519_key /etc/ssh/
RUN apt update; apt -y upgrade;
RUN echo 'TERM=xterm-256color' >> /etc/environment;
# 	apt update; \
# 	apt upgrade; \
# 	apt install xauth; \
# 	apt install openssh; \	
# 	apk add firefox-esr && \
# 	echo "X11UseLocalhost no" >> /etc/ssh/sshd_config; \
#  	mkdir /var/run/sshd;
# ENTRYPOINT  ["/usr/sbin/sshd", "-D"]
# CMD ["/usr/sbin/sshd", "-D"]
# WORKDIR /var/fp_data/
RUN apt install bash; apt install -y mc;
# WORKDIR /home/node/app
# RUN npm install && npm run build
# USER node
# ENTRYPOINT ["npm", "start"]

