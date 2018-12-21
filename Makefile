dev:
	$(eval export env_stub=dev)
	@true

staging:
	$(eval export env_stub=staging)
	@true

production:
	$(eval export env_stub=production)
	@true

init:
	$(eval export ECR_REPO_NAME=fb-runner-node)
	$(eval export ECR_REPO_URL_ROOT=926803513772.dkr.ecr.eu-west-1.amazonaws.com/formbuilder-dev)

# install aws cli w/o sudo
install_build_dependencies: init
	docker --version
	pip install --user awscli
	$(eval export PATH=${PATH}:${HOME}/.local/bin/)


# Needs ECR_REPO_NAME & ECR_REPO_URL env vars
build: install_build_dependencies
	docker build -t ${ECR_REPO_NAME}:latest-${env_stub} -f ./Dockerfile . && \
		docker tag ${ECR_REPO_NAME}:latest-${env_stub} ${ECR_REPO_URL_ROOT}/${ECR_REPO_NAME}:latest-${env_stub}

login: init
	@eval $(shell aws ecr get-login --no-include-email --region eu-west-1)

push: login
	docker push ${ECR_REPO_URL_ROOT}/${ECR_REPO_NAME}:latest-${env_stub}

.PHONY := init push build login
