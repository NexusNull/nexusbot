import https from "https";

const config = await (await import("../../Config.js")).getInstance();
const CLIENT_ID = config.ensureValue("stream_notify.client_id", "string", "")


/**
 * This class is a simple wrapper around the twitch web api to make calls easier.
 * There exists a twitch-api node module that could most likely replace this, but it is deprecated.
 */
class TwitchApi {
    async subscribeStreamOnline(sessionId, broadcasterId, accessToken) {
        return new Promise((resolve) => {
            console.log(`adding subscription for ${broadcasterId}`)
            let data = JSON.stringify({
                "type": "stream.online",
                "version": "1",
                "condition": {
                    "broadcaster_user_id": broadcasterId
                },
                "transport": {
                    "method": "websocket",
                    "session_id": sessionId
                }
            });

            let options = {
                hostname: 'api.twitch.tv',
                port: 443,
                path: '/helix/eventsub/subscriptions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Length': data.length,
                    "Authorization": "Bearer " + accessToken,
                    "Client-Id": CLIENT_ID
                }
            };
            let req = https.request(options, (res) => {
                let body = "";
                res.on('data', function (chunk) {
                    body += chunk.toString();
                });

                res.on('end', function () {
                    resolve({req, res, body});
                });
            });

            req.write(data);
            req.end();
        })
    }

    async getUsers(loginName, accessToken) {
        return new Promise((resolve) => {
            let options = {
                hostname: 'api.twitch.tv',
                port: 443,
                path: '/helix/users?login=' + loginName,
                method: 'GET',
                headers: {
                    "Authorization": "Bearer " + accessToken,
                    "Client-Id": CLIENT_ID
                }
            };

            let req = https.request(options, (res) => {
                let body = "";
                res.on('data', function (chunk) {
                    body += chunk.toString();
                });

                res.on('end', function () {
                    resolve({req, res, body: JSON.parse(body)});
                });
            });
            req.end();
        })
    }

    async refreshToken(clientId, clientSecret, refreshToken) {
        return new Promise((resolve) => {
            let data = `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`
            let options = {
                hostname: 'id.twitch.tv',
                port: 443,
                path: "/oauth2/token",
                method: 'POST',
                headers: {
                    'Content-Type': "application/x-www-form-urlencoded",
                }
            };

            let req = https.request(options, (res) => {
                let body = "";
                res.on('data', function (chunk) {
                    body += chunk.toString();
                });

                res.on('end', function () {
                    resolve({req, res, body: JSON.parse(body)});
                });
            });
            req.write(data);
            req.end();
        })
    }

    async getToken(code, clientId, clientSecret) {
        return new Promise((resolve) => {

            let data = `code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent("https://localhost:8080")}&grant_type=authorization_code&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`
            let options = {
                hostname: 'id.twitch.tv',
                port: 443,
                path: "/oauth2/token",
                method: 'POST',
                headers: {
                    'Content-Type': "application/x-www-form-urlencoded",
                }
            };

            let req = https.request(options, (res) => {
                let body = "";
                res.on('data', function (chunk) {
                    body += chunk.toString();
                });

                res.on('end', function () {
                    resolve({req, res, body: JSON.parse(body)});
                });
            });
            console.log(data)
            req.write(data);
            req.end();
        })
    }
}


export default TwitchApi = new TwitchApi();