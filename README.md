# fb-runner-node

**Form Builder Runner** renders forms from configuration data to capture user submissions.

For more information, read [the Runner’s documentation](https://github.com/ministryofjustice/form-builder/blob/master/documentation/running/running.md).


## Pre-requisites

[Node](https://nodejs.org) >= 12.4.0

## Installation

```
git clone git@github.com:ministryofjustice/fb-runner-node.git
cd fb-runner-node
npm install
```

## Usage

The `SERVICE_PATH` environment variable describes the location on your file system of the form for **Runner** to use.

To set the `SERVICE_PATH` environment variable, open a terminal and change into the root directory of **Runner**, then execute the command:

```sh
SERVICE_PATH=[path to form] npm start
```

(Where `[path to form]` is a path to the location on your file system of the form. An **Example Service** form can be cloned from `https://github.com/ministryofjustice/fb-example-service`.)

By default, **Runner** will start on localhost port `3000`. To run on a different port, set the `PORT` environment variable:

```sh
PORT=4321 SERVICE_PATH=[path to form] npm start
```

### Using **Runner** with **Mock Services**

Use [fb-mock-services](https://github.com/ministryofjustice/fb-mock-services) to mock services for **Runner**.

Clone the [fb-mock-services](https://github.com/ministryofjustice/fb-mock-services) repository and start the **Mock Services** app according to the instructions supplied there.

In **Runner**, create an `.envmocks` file at the root of the project:

```sh
export USER_DATASTORE_URL=http://localhost:44444
export USER_FILESTORE_URL=http://localhost:44445
export SUBMITTER_URL=http://localhost:44446
export SERVICE_SECRET=sekrit
export SERVICE_SLUG=slug
```

Open a terminal and change into the root directory of **Runner** then execute the command:

```
source .envmocks && SERVICE_PATH=[path to form] npm start
```

(Where `[path to form]` is a path to the location on your file system of the form.)

## Testing

```
npm test
```

## Linting

```
npm run lint
```

## Debugging

[Node inspector](https://nodejs.org/api/debugger.html) can be enabled for debugging.

Open a terminal and change into the root directory of **Runner** then execute the command:

```sh
PORT=4321 SERVICE_PATH=[path to form] node inspect bin/start
```
(Where `[path to form]` is a path to the location on your file system of the form.)

Note that the start command is _not_ `npm start`.

The breakpoint statement `debugger` can then be placed in file to trigger the inspector.

## Deploying to Cloud Platforms

See [deployment instructions](DEPLOY.md).

## Module Aliases

Some module paths are _aliased_.

At runtime they are resolved with [`@ministryofjustice/module-alias`](https://www.npmjs.com/package/@ministryofjustice/module-alias). (Its definitions can be found in the `_moduleAliases {}` field on `package.json`.)

During development aliases can be resolved in different ways according to needs of the developer's IDE. A solution we provide is via Webpack, [which is supported automatically in WebStorm and related IDEs](https://blog.jetbrains.com/webstorm/2017/06/webstorm-2017-2-eap-172-2827/), or with some [manual steps](https://stackoverflow.com/questions/34943631/path-aliases-for-imports-in-webstorm).

At start-up WebStorm will report in the *Event Log* that "Module resolution rules from `webpack.config.js` are now used for coding assistance" if the configuration is automatically identified -- if not, follow the manual steps:

1. Right-click on the `lib` directory and select `Mark Directory as > Resource root`
2. From the application menu select `Preferences > Languages & Frameworks > JavaScript > Webpack` then in the right-hand pane use the file browser to select `webpack.config.js` from the package root

You shouldn't need to restart but it won't hurt.
