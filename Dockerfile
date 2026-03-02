FROM node:25
WORKDIR /opt/nexusbot

# Install the application dependencies
COPY package-lock.json package.json ./

RUN npm install

# Copy in the source code
COPY . ./

CMD ["node", "main.js"]