# fb-runner-node
[![Build Status](https://travis-ci.org/ministryofjustice/fb-runner-node.svg?branch=master)](https://travis-ci.org/ministryofjustice/fb-runner-node)

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

### Components usage

By default the runner uses the module `@ministryofjustice/fb-components-core`, using the version defined in `lib/constants/constant.js`

[Read more about components usage](components.md)

### Using the fb-runnner-node with a mocked backend

Use [fb-mock-services](https://github.com/ministryofjustice/fb-mock-services) to mock out the services which your local instance of fb-runner-node (this repo) communicates with.

* In one terminal tab, run the [fb-mock-services](https://github.com/ministryofjustice/fb-mock-services) project according to its instructions (e.g. `MOCKENV=yes npm start`)
* Create an `.envmocks` file within this project, the contents of which are:

```sh
export USER_DATASTORE_URL=http://localhost:44444
export USER_FILESTORE_URL=http://localhost:44445
export SUBMITTER_URL=http://localhost:44446
export SERVICE_SECRET=sekrit
export SERVICE_TOKEN=token
export SERVICE_SLUG=slug
export MODULE__ministryofjustice_fb_components_core='/path/to/your/form-builder/fb-components-core'
```

* Within this `fb-runner-node` repo, run this command: `source .envmocks && SERVICE_PATH=/path/to/your/form npm start`

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

## To deploy and run on Cloud Platforms

See [deployment instructions](DEPLOY.md)

