import discord, {Events, GatewayIntentBits, IntentsBitField} from "discord.js";
import {promises as fs}  from "fs";
import path from "path";
import Database from "./Database.js";
import TwitchApi from "./modules/stream_notify/TwitchApi.js";

const config = await (await import("./Config.js")).getInstance();
const DISCORD_TOKEN = config.ensureValue("discord.auth.token", "string", "")
/**
 * This is the main bot class it handles loading of all the modules and their global interactions.
 *
 *
 */
export default class Bot {
    constructor() {
        this.ready = false;
        this.modules = new Map();
        this.buttons = new Map();
        this.modals = new Map();
        this.db = new Database();
        const intents = new IntentsBitField();
        intents.add(IntentsBitField.Flags.Guilds);
        this.client = new discord.Client({intents})
    }

    async init() {
        await this.db.init();
        await this.client.login(DISCORD_TOKEN);

        this.client.once(Events.ClientReady, (readyClient) => {
            console.log(`Logged in as ${readyClient.user.tag}`);
        });

        await this.loadModules();
        await this.reloadButtons();
        await this.reloadModals();

        for (let module of this.modules.values()) {
            await module.init();
        }
        await config.save();
        this.client.on(Events.InteractionCreate, this.interactionCreate.bind(this));
    }

    async interactionCreate(interaction){
        if (interaction.isButton())
        {
            let id = interaction.customId;
            let button = this.buttons.get(id)
            if (!button)
                return;

            if (button.admin && !this.isAdmin(interaction))
                return

            button.execute(interaction, id)
        }
        if (interaction.isModalSubmit())
        {
            let id = interaction.customId;
            let modal = this.modals.get(id)
            if (!modal)
                return;

            if (modal.admin && !this.isAdmin(interaction))
                 return

            modal.execute(interaction, id)
        }
    }

    async reloadButtons() {
        for (let module of this.modules.values()) {
            (await module.getButtons()).forEach((button) => {
                this.buttons.set(button.name, button)
            })
        }
    }
    async reloadModals() {
        for (let module of this.modules.values()) {
            (await module.getModals()).forEach((button) => {
                this.modals.set(button.name, button)
            })
        }
    }
    async loadModules(){
        const modulesNames = await fs.readdir("./src/modules");
        for(const name of modulesNames){
            const modulePath = "./" + path.join('./modules', name, 'main.js');
            this.modules.set(
                name,
                new ((await import(modulePath)).default)
                    ({ client: this.client, db: this.db}));
        }
        this.ready = true;
    }

}