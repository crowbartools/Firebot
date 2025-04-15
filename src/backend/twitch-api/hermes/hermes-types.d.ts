export type HermesSendMessageTypes = {
    authenticate: {
        token: string;
    };
    subscribe: {
        id: string;
        type: "pubsub",
        pubsub: { topic: string; }
    };
}

type HermesReceiveMessageTypes = {
    welcome: {
        keepaliveSec: number;
        recoveryUrl: string;
        sessionId: string;
    },
    keepalive: undefined;
    authenticateResponse: {
        result: 'ok'
    }
    subscribeResponse: {
        subscription: {
            id: string
        },
        result: 'ok'
    },
    notification: {
        subscription: {
            id: string;
        },
        type: 'pubsub',
        /**
         * Raw json object containing the payload of the notification
         */
        pubsub: string;
    }
}

export type ExtensionMessagePubSubNotificationPayload = {
    type: "extension_message",
    data: {
        id: string;
        content: { text: string; fragments: Array<{ text: string }>},
        sender: {
            extension_client_id: string;
            extension_version: string;
            display_name: string;
            chat_color: string;
            badges: [{ id: 'extension', version: '1'; }];
        }
        sent_at: string;
    }
}

type BaseHermesMessage = {
    id: string;
    timestamp: string;
    parentId?: string;
}

export type HermesSendMessage = {
    [K in keyof HermesSendMessageTypes]: BaseHermesMessage & {
        type: K;
    } & { [T in K]: HermesSendMessageTypes[K] };
}[keyof HermesSendMessageTypes]

export type HermesReceiveMessage = {
    [K in keyof HermesReceiveMessageTypes]: BaseHermesMessage & {
        type: K;
    } & { [T in K]: HermesReceiveMessageTypes[K] };
}[keyof HermesReceiveMessageTypes]