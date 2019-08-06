FROM node:12.4.0-slim

# derived from https://github.com/alekzonder/docker-puppeteer/blob/master/Dockerfile
RUN apt-get update && \
apt-get install -yq git gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont \
ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget && \
wget https://github.com/Yelp/dumb-init/releases/download/v1.2.1/dumb-init_1.2.1_amd64.deb && \
dpkg -i dumb-init_*.deb && rm -f dumb-init_*.deb && \
apt-get clean && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# Exposes `ps` command
RUN apt-get update && apt-get install -y procps

RUN groupadd -r deploy && useradd -m -u 1001 -r -g deploy deploy
USER deploy
WORKDIR /home/deploy

COPY package.json package-lock.json ./
RUN npm install
# --ignore-scripts
#--ignore-optional

COPY bin ./bin
COPY lib ./lib
COPY .eslintrc ./
COPY APP_SHA ./

ENTRYPOINT ["dumb-init", "--"]
EXPOSE 3000
CMD [ "node", "bin/start.js" ]
