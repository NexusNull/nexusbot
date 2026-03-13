import TwitchEventSub, {EventTypes} from "./TwitchEventSub.js";
import {Subscriptions} from "./models/Subscriptions.js";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags,
    LabelBuilder
} from "discord.js";
import TwitchApi from "./TwitchApi.js";

const config = await (await import("../../Config.js")).getInstance();
const NOTIFICATION_CHANNEL = config.ensureValue("stream_notify.channel", "string", "")
const NOTIFICATION_GUILD = config.ensureValue("stream_notify.guild", "string", "")
const NOTIFICATION_ROLE = config.ensureValue("stream_notify.role", "string", "")
const NOTIFICATION_CONFIG_CHANNEL = config.ensureValue("stream_notify.config_channel", "string", "")

export default class StreamNotifyModule {

    constructor(options) {
        this.client = options.client;
        this.db = options.db;
        this.twitcheventsub = new TwitchEventSub();
        this.subscriptions = new Subscriptions(this.db)
    }

    async init() {
        await this.twitcheventsub.init();
        this.twitcheventsub.on(EventTypes.STREAM_ONLINE, this.sendGoLiveAnnouncement.bind(this))
        this.twitcheventsub.on(EventTypes.WEBSOCKET_CLOSED, this.reconnectWebSocket.bind(this))
        await this.setupListeners()

        await this.clearChannel();
        await this.createConfig();
    }

    async clearChannel() {
        let guilds = await this.client.guilds.fetch()
        let guild = await guilds.get(NOTIFICATION_GUILD).fetch();
        let channels = await guild.channels.fetch();
        let channel = await channels.get(NOTIFICATION_CONFIG_CHANNEL).fetch()
        let messages = await channel.messages.fetch();
        messages = messages.filter(message => message.author.id === '1475752933684412437');
        for (let message of messages) {
            await message[1].delete();
        }
    }
    async reconnectWebSocket(){
        await this.twitcheventsub.connect();
        await this.setupListeners();
    }
    async setupListeners(){
        let subs = await this.subscriptions.getAllSubscriptions();
        for (let sub of subs) {
            let {res} = await TwitchApi.subscribeStreamOnline(this.twitcheventsub.sessionId, sub.broadcasterId);

            if(res.statusCode !== 202)
                console.log(`Failed to add subscription for ${sub.broadcasterId}`)
        }
    }



    async getButtons() {
        return [
            {
                name: "streamNotify:add_channel_button",
                admin: false,
                execute: this.addChannelButtonInteraction.bind(this)
            },
            {
                name: "streamNotify:remove_channel_button",
                admin: false,
                execute: this.removeChannelButtonInteraction.bind(this)
            }
        ]
    }

    async getModals() {
        return [
            {
                name: "streamNotify:add_channel_Modal",
                admin: false,
                execute: this.addChannelModalInteraction.bind(this)
            },
            {
                name: "streamNotify:remove_channel_Modal",
                admin: false,
                execute: this.removeChannelModalInteraction.bind(this)
            }
        ]
    }

    async addChannelButtonInteraction(interaction) {
        const modal = new ModalBuilder().setCustomId('streamNotify:add_channel_Modal').setTitle('Add a Channel');
        const channelInput = new TextInputBuilder()
            .setCustomId('channelInput')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('close2animation');
        const channelLabel = new LabelBuilder()
            .setLabel("Which channel would you like to add?")
            .setDescription('please use the broadcaster id, you can convert it here:')
            .setTextInputComponent(channelInput);
        modal.addLabelComponents(channelLabel)
        await interaction.showModal(modal);
    }

    async removeChannelButtonInteraction(interaction) {
        const modal = new ModalBuilder().setCustomId('streamNotify:remove_channel_Modal').setTitle('Remove a Channel');

        const channelInput = new TextInputBuilder()
            .setCustomId('channelInput')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('close2animation');

        const hobbiesLabel = new LabelBuilder()
            .setLabel("Which channel would you like to remove?")
            .setDescription('please use the broadcaster id, you can convert it here: ')
            .setTextInputComponent(channelInput);
        modal.addLabelComponents(hobbiesLabel)
        await interaction.showModal(modal);
    }

    async addChannelModalInteraction(interaction) {
        let channelId = interaction.components[0].component.value;
        let {body} = await  TwitchApi.getUsers(channelId)
        if(body.data.length === 0){
            return interaction.reply({content: "Error: This channel doesn't exist!", flags: MessageFlags.Ephemeral})
        } else {
            channelId = body.data[0].id;
        }

        if (await this.subscriptions.getSubscription(channelId)) {
            return interaction.reply({content: "Error: The channel is already being watched!", flags: MessageFlags.Ephemeral})
        }
        let {res} = await TwitchApi.subscribeStreamOnline(this.twitcheventsub.sessionId, channelId);

        if(res.statusCode !== 202){
            console.log(`Failed to add subscription for ${sub.broadcasterId}`)
            return interaction.reply({content: "Error: The channel could not be watched! Please check the id.", flags: MessageFlags.Ephemeral})
        }
        await this.subscriptions.createSubscription(channelId, interaction.user.id)
        interaction.reply({content: "Success: The channel is now being watched!", flags: MessageFlags.Ephemeral})
    }

    async removeChannelModalInteraction(interaction) {
        let channelName = interaction.components[0].component.value;
        let channelId = 0;
        let {body} = await  TwitchApi.getUsers(channelName)
        if(body.data.length === 0){
            return interaction.reply({content: "Error: This channel doesn't exist!", flags: MessageFlags.Ephemeral})
        } else {
            channelId = body.data[0].id;
        }

        let sub = await this.subscriptions.getSubscription(channelId)

        if(sub == null){
            return interaction.reply({content: "Error: This channel isn't being watched", flags: MessageFlags.Ephemeral})
        }

        if (sub.addedBy !== interaction.user.id) {
            return interaction.reply({content: "Error: This channel has been added by a different user", flags: MessageFlags.Ephemeral})
        }

        sub.delete();
        await this.twitcheventsub.close();

        interaction.reply({content: "Success: The channel is now no longer being watched!", flags: MessageFlags.Ephemeral})
    }

    async createConfig() {
        //This method will create the message with the buttons in the config channel
        let guilds = await this.client.guilds.fetch()
        let guild = await guilds.get(NOTIFICATION_GUILD).fetch();
        let channels = await guild.channels.fetch();
        let channel = await channels.get(NOTIFICATION_CONFIG_CHANNEL).fetch()
        const addChannelButton = new ButtonBuilder().setCustomId('streamNotify:add_channel_button').setLabel('Add a Channel').setStyle(ButtonStyle.Primary);
        const removeChannelButton = new ButtonBuilder().setCustomId('streamNotify:remove_channel_button').setLabel('Remove a Channel').setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(addChannelButton, removeChannelButton);
        channel.send({
            content: "Add your channel to the stream announcement watch list.",
            components: [row]
        });
    }

    async sendGoLiveAnnouncement(event) {
        let guilds = await this.client.guilds.fetch()
        let guild = await guilds.get(NOTIFICATION_GUILD).fetch();
        let channels = await guild.channels.fetch();
        let channel = await channels.get(NOTIFICATION_CHANNEL).fetch()
        channel.send(`<@&${NOTIFICATION_ROLE}> https://www.twitch.tv/${event.broadcaster_user_login} Check out their stream!`);
    }

}
