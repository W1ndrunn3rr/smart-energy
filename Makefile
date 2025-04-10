.PHONY: build
build:
	@echo Building docker containers...
	docker-compose -f docker-compose-dev.yaml build 

.PHONY: run
run :
	@echo Running docker containers...
	docker-compose -f docker-compose-dev.yaml up --watch

.PHONY: clean
clean:
	@echo "Stopping and removing all containers..."
	@docker stop $$(docker ps -a -q)
	@docker rm $$(docker ps -a -q) 