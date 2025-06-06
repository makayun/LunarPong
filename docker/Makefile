name = inception

all: data_dir
	@printf "Up ${name}:\n"
	@cd ./srcs && COMPOSE_BAKE=true docker compose -f docker-compose.yml up -d

build:
	@printf "Build ${name}:\n"
	@cd ./srcs && COMPOSE_BAKE=true docker compose --build

down:
	@printf "Down ${name} (stop and remove containers, networks):\n"
	@cd ./srcs && COMPOSE_BAKE=true docker compose -f docker-compose.yml down

re: down 
	@printf "Rebuild ${name}:\n"
	@cd ./srcs && COMPOSE_BAKE=true docker compose -f docker-compose.yml up -d --build

clean: down
	@printf "Clean ${name}:\n"
	@docker system prune -a

fclean: clean
	@printf "Total clean of all configurations docker\n"
	@rm -fdr /home/${USER}/data
	@docker volume prune --force

image:
	@printf "Create base image for ${name}:\n"
	@cd ./alpine && ./create_base.sh

data_dir:
	@printf "Create 'data' folder for ${name}:\n"
	@mkdir -p /home/${USER}/data
	@mkdir -p /home/${USER}/data/db
	@mkdir -p /home/${USER}/data/wp

env:
	@printf "Show ENV ${name}:\n"
	@cd ./srcs && docker compose config --environment

.PHONY  : all build down re clean fclean image data_dir env
