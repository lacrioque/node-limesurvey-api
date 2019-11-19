const https = require('https');
const axios = require('axios').default;
const EventEmitter = require('events');

class LimeAPI {

    LOG(type, ...message) {
        if (this.DEBUG > 0) {
            switch(type) {
                case 'message' : console.log(message); break;
                case 'log' : 
                    if (this.DEBUG >= 1) { console.log(message);} break;
                case 'error' : 
                    if (this.DEBUG >= 2) { console.error(message);} break;
                case 'warn' : 
                    if (this.DEBUG >= 2) { console.warn(message);} break;
                case 'trace' : 
                    if (this.DEBUG >= 3) { console.trace(message);} break;
            }
        }
    };

    constructor(config, debug = 0) {
        this.DEBUG = debug;
        this.CONFIG = config;
        this.curId = 1;
        this.authToken = null;
        console.log("DEBUG LEVEL: "+ this.DEBUG);
        this.emitter = new EventEmitter();
    }

    $on(evt, method) {
        this.emitter.on(evt, method)
    }
    $off(evt, method) {
        this.emitter.off(evt, method)
    }
    $emit(evt, payload) {
        this.emitter.emit(evt, payload)
    }

    async runRequest(requestData) {
        try {
            const response = await axios.post(
                this.CONFIG.url,
                requestData, {
                    headers: {
                        'user-agent': 'LimeCLIAPI 1.0.0 - axios/nodejs',
                        'path': 'index.php/admin/remotecontrol/',
                        'connection': 'keep-alive',
                        'content-type': 'application/json'
                    },
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false
                    })
                }
            );
            //LOG.log(response);

            if (typeof response.data == 'object' && response.data !== null) {
                return response.data;
            }

            let answerData;
            try {
                answerData = JSON.parse(response.data);
            } catch (e) {
                this.LOG('error', e);    
                this.LOG('error', response);    
                throw new Error("The response could not be converted");
            }
            return answerData;
        } catch (e) {
            this.LOG('error', e);
             throw new Error("There was an error in the network call");
        }
    }


    async getAuthToken(force = false) {
        if (this.authToken != null && force === false) {
            return this.authToken;
        }

        const requestData = {
            id: this.curId,
            method: 'get_session_key',
            params: [
                this.CONFIG.credentials.username,
                this.CONFIG.credentials.password
            ]
        };

        try {
            const result = await this.runRequest(requestData);
            this.LOG('message', "Access token acquired and stored: ", result.result);
            this.authToken = result.result;
            this.curId++;

            return this.authToken;
        } catch (e) {
            this.LOG('error', "ERROR:", e);
            throw new Error("Access token could not be acquired");
        
        }
    }

    async runCall(method, params, addToken) {
        params.unshift(this.authToken);
        
        const requestData = {
            method,
            params
        };

        try {
            const result = await this.runRequest(requestData);
            this.LOG('message', "Call successfully finished");
            this.LOG('log', result);
            this.curId++;

            return result.result;

        } catch (e) {
            this.LOG('error', "Call failed");
            this.LOG('error', "ERROR:", e);
            return null;
        }
    }
}

module.exports = LimeAPI