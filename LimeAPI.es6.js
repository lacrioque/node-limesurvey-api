import axios from 'axios';
const EventEmitter = require('events');

export default class LimeAPI {
    LOG (type, message) {
        if (this.DEBUG > 0) {
            console[type].apply(console, message);
        }
    };

    constructor(config, debug = 0) {
        this.DEBUG = debug;
        this.CONFIG = config;
        this.curId = 1;
        this.authToken = null;

        this.emitter = new EventEmitter();

        this.LOG.message = function () {
            this.$emit('message', ...arguments);
            console.log.apply(null, arguments);
        }
        this.LOG.log = function () {
            if (this.DEBUG >= 1) {
                this.$emit('log', ...arguments);
                console.log.apply(null, arguments)
            }
        };
        this.LOG.error = function () {
            if (this.DEBUG >= 2) {
                this.$emit('error', ...arguments);
                console.error.apply(null, arguments)
            }
        };
        this.LOG.warn = function () {
            if (this.DEBUG >= 2) {
                this.$emit('warn', ...arguments);
                console.warn.apply(null, arguments)
            }
        };
        this.LOG.trace = function () {
            if (this.DEBUG >= 3) {
                this.$emit('trace', ...arguments);
                console.trace.apply(null, arguments)
            }
        };
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
                        'path': '/admin/remotecontrol/',
                        'connection': 'keep-alive',
                        'content-type': 'application/json'
                    }
                }
            );
            //LOG.log(response);

            if (typeof response.data === 'object' && response.data !== null) {
                return response.data;
            }

            let answerData;
            try {
                answerData = JSON.parse(response.data);
            } catch (e) {
                throw e;
            }
            return answerData;
        } catch (e) {
            this.LOG.error(e);
            throw new Error("There was an error in the network call, or the response could not be converted");
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
            this.LOG.message("Access token acquired and stored: ", result.result);
            this.authToken = result.result;
            this.curId++;

            return this.authToken;
        } catch (e) {
            this.LOG.error("Access token could not be acquired");
            this.LOG.error("ERROR:", e);
        }
    }

    async runCall(method, params, addToken) {
        params.unshift(this.authToken);

        const requestData = {
            id: this.curId,
            method,
            params
        };

        try {
            const result = await this.runRequest(requestData);
            this.LOG.message("Call successfully finished");
            this.LOG.log(result);
            this.curId++;

            return result.result;

        } catch (e) {
            this.LOG.error("Call failed");
            this.LOG.error("ERROR:", e);
        }
    }
}
