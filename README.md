# fb-runner-node

Form Builder Runner

## Pre-requisites

  [Node](https://nodejs.org)

## Installing

```
git clone git@github.com:ministryofjustice/fb-runner-node.git
cd fb-runner-node
npm install
```

## Usage

```
npm start
```

## Service data

By default, the runner expects service data to be mounted at `servicedata` in its root directory.


## Testing

```
npm test
```

Run unit tests only

```
npm run test:unit
```

Run linting only
```
npm run lint
```

## Faked-up pages

[Start page](http://localhost:3000)

[Test page](http://localhost:3000/test)

## To build & push docker images

```
make (dev|staging|production) build push
```
This will build & push a docker image `fb-runner-node:latest-(env)` to the ECR
repo, from where it can be deployed to Kubernetes via [fb-publisher](https://github.com/ministryofjustice/fb-publisher)
