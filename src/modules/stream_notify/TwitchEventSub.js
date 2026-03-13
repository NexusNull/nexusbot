import EventEmitter from "events";
export const EventTypes = {
    "STREAM_ONLINE": "stream_online",
    "WEBSOCKET_CLOSED": "websocket_closed"
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
        this.socketListeners = {
            socketOnOpen: this.socketOnOpen.bind(this),
            socketOnError: this.socketOnError.bind(this),
            socketOnClose: this.socketOnClose.bind(this),
            socketOnMessage: this.socketOnMessage.bind(this),
        }
    }
    socketOnOpen(msg){
        console.log("Websocket connection was opened")
        console.log("open", msg);
    }
    socketOnError(msg){
        console.log("error", msg);
    }
    socketOnClose(){
        console.log("Websocket connection was closed")
        this.emit(EventTypes.WEBSOCKET_CLOSED)
    }
    async socketOnMessage(msg){
        let data = JSON.parse(msg.data.toString("utf8"));
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

    async close(){
        this.socket.close();
    }

    async init(){
        await this.connect();
    }

    async connect() {
        this.socket = new WebSocket('wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30');
        this.socket.addEventListener("open", this.socketListeners.socketOnOpen);
        this.socket.addEventListener("error", this.socketListeners.socketOnError);
        this.socket.addEventListener("message", this.socketListeners.socketOnMessage);
        this.socket.addEventListener("close", this.socketListeners.socketOnClose);
        return new Promise((resolve)=>{this.connectedPromise = resolve});
    }

    async handleSessionWelcome(data) {
        this.sessionId = data.payload.session.id
        this.connectedPromise();
    }

    handleSessionKeepalive(data) {
        //TODO this method should handle the case when the keepalive aren't being sent anymore.
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
}