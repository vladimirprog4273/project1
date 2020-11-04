.PHONY: image

image:
	docker build --pull --tag <docker hub>/project1:latest --file Dockerfile . && docker push <docker hub>/project1
