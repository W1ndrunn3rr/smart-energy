.PHONY: run
run:
	@echo Building and deploying docker containers...
		docker-compose -f docker-compose-dev.yaml up --watch

.PHONY: stop
stop:
	@echo "Stopping and removing all containers..."
	@docker stop $$(docker ps -a -q)
	@docker rm $$(docker ps -a -q) 