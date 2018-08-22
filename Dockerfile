FROM node:10.8.0

# RUN npm install @ministryofjustice/fb-runner-node@0.0.1
COPY bin ./bin
COPY lib ./lib
COPY govuk-frontend-assets ./govuk-frontend-assets
COPY package.json package-lock.json ./

RUN npm install
# --ignore-scripts
#--ignore-optional

EXPOSE 3000
CMD [ "node", "bin/start.js" ]