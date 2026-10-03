.PHONY: help build up stop

help:
	@printf '%s\n' \
		'Glassbook commands:' \
		'  make build  Build the Docker image' \
		'  make up     Build and start Glassbook in the background' \
		'  make stop   Stop and remove the Glassbook container'

build:
	docker compose build

up:
	docker compose up --build --detach

stop:
	docker compose down
