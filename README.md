# fb-runner-node

This Form Builder Runner repository is the backend which powers the forms which are deployed.

## Pre-requisites

  [Node](https://nodejs.org)

## Installing

```
git clone git@github.com:ministryofjustice/fb-runner-node.git
cd fb-runner-node
npm install
```

## Usage

Set the `SERVICE_PATH` environment variable to point the the path of a form on your filesystem.

```sh
SERVICE_PATH=~/Documents/formbuilder/forms/my-test-form-1 npm start
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

## To deploy and run on Cloud Platforms

See [deployment instructions](DEPLOY.md)

