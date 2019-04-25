# fb-runner-node

Form Builder Runner is an application that provides generic backend code and templates to create forms from data representations.

For more details, read the [Runner’s documentation](https://github.com/ministryofjustice/form-builder/blob/master/documentation/running/running.md)


## Pre-requisites

  [Node](https://nodejs.org)

## Installing

```
git clone git@github.com:ministryofjustice/fb-runner-node.git
cd fb-runner-node
npm install
```

## Usage

Set the `SERVICE_PATH` environment variable to point the path of form data on your filesystem.

```sh
SERVICE_PATH=/path/to/form npm start
```

An example form can be checked out from `https://github.com/ministryofjustice/fb-example-service`

By default, Form Builder Runner will use port 3000. If you want to run on a different port, set the `PORT` environment variable.

```sh
PORT=4321 SERVICE_PATH=/path/to/form npm start
```

If you are not developing runner features, consider using the [Form Builder Editor Console](https://github.com/ministryofjustice/fb-editor-console-electron) instead.

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

