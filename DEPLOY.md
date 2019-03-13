# Deploying fb-runner-node to the MoJ Cloud Platform

## The app

The Runner application is not deployed directly, but is used as the container image used by an instance of a form.

Forms are deployed via the [Publisher](https://github.com/ministryofjustice/fb-publisher).

## Scripts

- `scripts/build_platform_images.sh`

  Script to build images for a platform environment

  Prints out usage instructions when run with the `-h` flag

## Further details

### Building images for the platform

`scripts/build_platform_images.sh` is a convenience wrapper around the application's `Makefile` which takes care of acquiring and setting the necessary ENV variables. It is equivalent to running

```bash
make $PLATFORM_ENV build_and_push
```

having set the following ENV variables:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

(These values are the base64-decrypted values of the corresponding secrets in the `formbuilder-repos` namespace, where

eg. `AWS_ACCESS_KEY_ID` is the `access_key_id` value and `AWS_SECRET_ACCESS_KEY` the `secret_access_key` value of the `ecr-repo-fb-user-datastore-api` secret

This creates an image for the `fb-runner-node` tagged `latest:$PLATFORM_ENV`.

This image is then pushed to Cloud Platform's ECR.

See the `Makefile` for more info.

