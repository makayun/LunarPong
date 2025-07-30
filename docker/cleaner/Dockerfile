FROM debian
LABEL keep=true

RUN apt-get update && apt-get upgrade; \
	apt-get install -y mc; \
	rm -rf /var/lib/apt/lists/*; 