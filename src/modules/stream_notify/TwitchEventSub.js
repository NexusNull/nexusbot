import EventEmitter from "events";
import TwitchApi from "./TwitchApi.js";

export const EventTypes = {
    "STREAM_ONLINE": "stream_online"
}
/**
 * This class handles the websocket connections with the twitch websocket api.
 * It will ensure that the connection stays connected and maintains the same state over those disconnects.
 */
export default class TwitchEventSub extends EventEmitter {

    constructor() {
        super();
        this.socket = null;
        this.sessionId = null;
        this.connectedPromise = null;
        /**
         * The channels we want to have a subscription to. we store this in case we lose connection.
         * @type {Map<string, object>}
         */
        this.subscriptions = new Map();
    }

    async init(){
        await this.connect();
    }

    async connect() {
        this.socket = new WebSocket('wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30');
        this.socket.addEventListener('error', this.parseSocketError.bind(this));
        this.socket.addEventListener("message", this.parseSocketMessage.bind(this))

        return new Promise((resolve)=>{this.connectedPromise = resolve});
    }

    async parseSocketMessage(socketMsg) {
        let data = JSON.parse(socketMsg.data.toString("utf8"));
        if (!data.metadata || !data.metadata.message_type)
            return;

        switch (data.metadata.message_type) {
            case "session_welcome":
                await this.handleSessionWelcome(data);
                break;
            case "session_keepalive":
                this.handleSessionKeepalive(data);
                break;
            case "notification":
                this.handleNotification(data.payload);
                break;
            default:
                console.log(`Unknown message type: ${data.metadata.message_type}`)
                break;
        }
    }

    async handleSessionWelcome(data) {
        this.sessionId = data.payload.session.id
        this.connectedPromise();
        for(let i of this.subscriptions){
            if(this.subscriptions.has(i[0]))
                return false;
            this.subscriptions.set(i[0], {});
            let res = await TwitchApi.subscribeStreamOnline(this.sessionId, i[0]);
            console.log(res)
            this.subscriptions.set(i[0], res);
        }
    }

    handleSessionKeepalive(data) {
        //TODO this method should handle the case when the keepalive aren't being sent anymore.
    }

    parseSocketError(msg) {
        console.log(msg)
    }

    handleNotification(payload) {
        switch (payload.subscription.type) {
            case "stream.online":
                this.handleNotificationStreamOnline(payload);
                break;
            default:
                console.log(`Unknown Notification: ${payload.subscription.type}`);
                console.log(payload);
        }
    }

    handleNotificationStreamOnline(payload) {
        this.emit(EventTypes.STREAM_ONLINE,{
            "broadcaster_user_login": payload.event.broadcaster_user_login,
            "broadcaster_user_id": payload.event.broadcaster_user_id,
        })
    }

    async addSubscription(broadcasterId){
        if(this.subscriptions.has(broadcasterId))
            return false;
        this.subscriptions.set(broadcasterId, {});

        let {res, req} = await TwitchApi.subscribeStreamOnline(this.sessionId, broadcasterId);

        if(res.statusCode === 202){
            this.subscriptions.set(broadcasterId, res);
            return true;
        } else
            return false;
    }

    async removeSubscription(broadcasterId){
        if(!this.subscriptions.has(broadcasterId))
            return
        this.subscriptions.delete(broadcasterId);
        if(this.socket.connected){
            //TODO make an unsub function : await this.subscribeStreamOnline(this.sessionId);
        }
    }
}