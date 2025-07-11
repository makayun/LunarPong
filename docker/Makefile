ARGUMENTS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))

name = microservices

export UID := $(shell id -u)

all: prepare
	@printf "Up ${name}:\n"
	@COMPOSE_BAKE=true docker compose -f docker-compose.yml up -d

build: prepare
	@COMPOSE_BAKE=true docker compose --build

prepare:
	@cd ./node_sqlite && ./prepare-build-context.sh
	@echo UID is: $(UID)

down:
	@printf "Down ${name} (stop and remove containers, networks):\n"
	@COMPOSE_BAKE=true docker compose -f docker-compose.yml down

re: down 
	@printf "Rebuild ${name}:\n"
	@COMPOSE_BAKE=true docker compose -f docker-compose.yml up -d --build

clean: down
	@printf "Clean ${name}:\n"
	@docker system prune -a

env:
	@printf "Show ENV ${name}:\n"
	@docker compose config --environment

delete:
	@printf "Delete ${name}:\n"
	docker container stop node_sqlite;
	docker container rm node_sqlite;
	docker image rm docker-node_sqlite;
	docker container stop nginx_modsecurity;
	docker container rm nginx_modsecurity;
	docker image rm docker-nginx_modsecurity;

bash:
	@echo "run interactive session on "$(ARGUMENTS)".";
	@docker exec -it $(ARGUMENTS) bash

sh:
	@echo "run interactive session on "$(ARGUMENTS)".";
	@docker exec -it $(ARGUMENTS) sh

mc:
	@echo "run interactive session on "$(ARGUMENTS)".";
	@docker exec -it $(ARGUMENTS) mc

help:
	@echo "Help will here!";

.PHONY:	all build prepare down re clean env bash sh mc help
