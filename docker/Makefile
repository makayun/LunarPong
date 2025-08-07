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

clean:
	@echo "🧼 Cleaning Docker resources except those labeled 'keep=true'"
	@echo "🛑 Stopping and removing containers"
	@for id in $$(docker ps -aq); do \
		if [ "$$(docker inspect -f '{{ index .Config.Labels "keep" }}' $$id)" != "true" ]; then \
			echo "Removing container $$id"; \
			docker stop $$id >/dev/null 2>&1 && docker rm $$id; \
		fi; \
	done
	@echo "🗑️ Removing images"
	@for img in $$(docker images -q | sort -u); do \
		if [ "$$(docker inspect -f '{{ index .Config.Labels "keep" }}' $$img 2>/dev/null)" != "true" ]; then \
			echo "Removing image $$img"; \
			docker rmi -f $$img; \
		fi; \
	done
	@echo "📦 Removing unused volumes"
	@docker volume prune -f
	@echo "🌐 Removing unused networks"
	@docker network prune -f
	@echo "✅ Done!"

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

rm:
	@echo "delete container & image of "$(ARGUMENTS)".";
	docker container stop $(ARGUMENTS)
	docker container rm $(ARGUMENTS)
	docker image rm docker-$(ARGUMENTS)

help:
	@echo "Help will here!";

.PHONY:	all build prepare down re clean env bash sh rm mc help
