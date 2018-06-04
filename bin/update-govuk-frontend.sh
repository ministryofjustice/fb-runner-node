#!/bin/sh

OLDVERSION=$(cat govuk-frontend-assets/VERSION.txt)
OLDVERSION=${OLDVERSION//[[:space:]]}

echo "Currently using govuk-frontend@$OLDVERSION"

echo "Replacing govuk-frontend assets"

rm -rf govuk-frontend-assets
rm -rf /tmp/govuk-frontend

(cd /tmp && git clone https://github.com/alphagov/govuk-frontend)

cp -rp /tmp/govuk-frontend/dist govuk-frontend-assets

rm -rf /tmp/govuk-frontend

VERSION=$(cat govuk-frontend-assets/VERSION.txt)
VERSION=${VERSION//[[:space:]]}

echo Updating to govuk-frontend@$VERSION

node -e "\
const packageJSON = require('./package.json');\
packageJSON.version = '$VERSION';
const fs = require('fs');\
fs.writeFileSync('./package.json', JSON.stringify(packageJSON, null, 2));\
"

npm install @govuk-frontend/frontend@$VERSION

npm install

sed -i "s/$OLDVERSION/$VERSION/g" templates/base.html