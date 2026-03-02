

# NexusBot
This is a simple but extendable bot for my discord server the Celestial forge.
Our mission to encourage each other in creating things. If you would like to join us https://discord.gg/VMqj3Adh5T
The bot includes the following features.


 - modular design
   every function of the bot is self-contained inside a module. Simply deleting the module folder will remove the functionality.
 - sqlite database
   the database is store with sqlite, so no setup is required.
 - docker build file
   the project includes a dockerfile so it can be easily build and deployed anywhere docker is running.
 - simple and extensible config system
   Every module can define their own config options. They work seamlessly into one config file.

## Setup
To use this project you need an existing bot account for discord. You can create such an account [here](https://discord.com/developers/applications)
Make sure you add the bot account to your server with the correct permissions. 
For now the bot requires the `bot` and `guilds` permissions as well as any permissions on your server to send the messages in the respective channels.

## Database
We use sqlite as a database system. The database file will be created on the first launch inside the [data](data) directory.
if you are using docker or docker compose it might be smart to mount this directory into a persistent volume, if you care about keeping your data.

## Config 
The config file is created automatically by the Config manager [Config.js](src/Config.js).
```nodejs
const config = await (await import("../../Config.js")).getInstance();
const NOTIFICATION_CHANNEL = config.ensureValue("stream_notify.channel", "string", "")
```
The first line is require to get an instance of the Config manager.
The second ensures that even if the config option isn't present in the
config file you will still have a default value present when the user opens the file 

## Docker/ docker compose
We do not provide a public docker image for this project simply because I don't think this project will have such a big use-case.
If you would like this please create an [issue](https://github.com/NexusNull/nexusbot/issues).
```
  nexusbot:
    image: "nexusbot:latest"
    pull_policy: if_not_present
    container_name: "nexusbot"
    volume: 
      - ./docker-data/nexusbot/data:/opt/nexusbot/data
      - ./docker-data/nexusbot/config.json:/opt/nexusbot/config.json
```
Disclaimer: untested use at your own risk.

