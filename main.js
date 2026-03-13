import Bot from "./src/Bot.js";

process.on('uncaughtException', function (err) {
    console.error(err.stack);
    console.log("Node NOT Exiting...");
});

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p);
});

async function main() {
    let bot = new Bot();
    await bot.init();
}

main();