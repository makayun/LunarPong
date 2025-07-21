############### -----===== FROM debian =====----- ###############
FROM debian
COPY ./ssl/ssh_host_ed25519_key.pub /etc/ssh/
COPY --chmod=0600 ./ssl/ssh_host_ed25519_key /etc/ssh/
RUN useradd -m -u 1000 -d /home/node -s /bin/bash node
COPY --chmod=777 run_deb.sh /home/node/run.sh
COPY --chown=node ./build-context/ /home/node/Pong
RUN apt-get update && apt-get install -y curl ca-certificates gnupg; \
	curl -fsSL https://deb.nodesource.com/setup_22.x | bash -; \
	apt-get install -y npm; \
	apt-get install -y nodejs; \
	apt-get install -y sqlite3 libsqlite3-dev; \
	apt-get install -y mc; \
	rm -rf /var/lib/apt/lists/*; \
	mkdir -p /home/node/Pong;

############### -----===== FROM alpine =====----- ###############
# FROM alpine
# COPY ./ssl/ssh_host_ed25519_key.pub /etc/ssh/
# COPY --chmod=0600 ./ssl/ssh_host_ed25519_key /etc/ssh/
# RUN adduser -u 1000 -h /home/node -s /bin/bash -D node \
# 	&& mkdir -p /home/node \
# 	&& chown node:node /home/node
# COPY --chmod=777 run_alp.sh /home/node/run.sh
# RUN apk update && apk upgrade; \
#     apk --no-cache add bash mc; \
# 	# apk --no-cache add curl; \
# 	# apk --no-cache add python3; \
#     # apk --no-cache add openssh && mkdir /var/run/sshd && echo 'TERM=xterm-256color' >> /etc/environment; \
#     # apk --no-cache add openrc; \
#     # rc-status; \
#     # rc-update add sshd; \
#     # touch /run/openrc/softlevel; \
#     apk --no-cache add nodejs npm; \
# 	apk --no-cache add sqlite
