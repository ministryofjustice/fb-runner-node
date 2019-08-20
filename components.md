# Components usage

A form can explcitly declare what components to use or allow the runner to supply the default values to use.


## Determining components used by the form

If a form has a `package.json`, its dependencies will be used and trump any default version defined in the runner.

## Setting the components version used by the runner

If the runner finds no explicit dependencies for the form, it will use the default components module (`@ministryofjustice/fb-components-core`), using the default version defined in `lib/constants/constant.js`.


### Pinning default version used by the runner

To enable the components module’s version 

- to reflect the version of `govuk-frontend` module
- to enable semantic-style upgrading

the version value in the `constants` file is sepcified so:

```js
COMPONENTS_VERSION: "~X.Y.Z-1"
```

- `X.Y.Z` is the version of the `govuk-frontend` used
- `~X.Y.Z-1` allows `npm` to install the latest components module version that starts with `X.Y.Z-`
  NB. the value `1` is important. Do not use `x` or `*` - that will cause the latest value to be used and ignoore the semantic intent

If the current version specified is `~1.2.3-1` and the latest module version beginning with `1.2.3-` is `1.2.3-6`, then `1.2.3-6` will be used. If another version starting `1.2.3-` is published  (eg. `1.2.3-7`), that later version will now be used.

### Overriding default version

Set the `COMPONENTS_VERSION` ENV var

```sh
# use specific published version
export COMPONENTS_VERSION='1.2.3-2'
# use newly published next version
export COMPONENTS_VERSION='~1.2.4-1'
# use git commit sha (or branch or tag)
export COMPONENTS_VERSION='git://github.com/ministryofjustice/fb-components-core.git#5317249ed94d46771907834cbb1c9c6b09001006'
```


## Developing locally

Before publishing a module to npm, it can be used locally by seeting an ENV variable that maps to the module using the following regex.

```js
`MODULE__${source}`.replace(/@/g, '').replace(/[-/]/g, '_')
```

Dependencies of any modules (eg. the `govuk-frontend`) can also be overridden in the same way.

eg.

```sh
export MODULE__ministryofjustice_fb_components_core='$PATHTO/fb-components-core'
export MODULE__govuk_frontend='$PATHTO/govuk-frontend'
```

## Setting the components module

The default is `@ministryofjustice/fb-components-core`

This can be overridden by setting the `COMPONENTS_MODULE` ENV var