"use strict";
const EventEmitter = require("events");

const effectManager = require("../../../effects/effectManager");

const integrationDefinition = {
    id: "aws",
    name: "AWS",
    description: "Interact with Amazon Web Services.",
    linkType: "none",
    connectionToggle: false,
    configurable: true,
    settingCategories: {
        iamCredentials: {
            title: "IAM Credentials",
            sortRank: 1,
            settings: {
                accessKeyId: {
                    title: "Access Key ID",
                    description: "Specifies the AWS access key associated with an IAM user or role.",
                    type: "string",
                    sortRank: 1,
                    validation: {
                        required: true
                    }
                },
                secretAccessKey: {
                    title: "Secret Access Key",
                    description: "Specifies the secret key associated with the access key.",
                    type: "string",
                    showBottomHr: true,
                    sortRank: 2,
                    validation: {
                        required: true
                    }
                },
                region: {
                    title: "Region",
                    description: "The AWS region with which we will interact with for the services.",
                    type: "string",
                    default: "us-east-1",
                    tip: "Default is 'us-east-1'.",
                    sortRank: 3,
                    validation: {
                        required: true
                    }
                }
            }
        }
    }
};

class AwsIntegration extends EventEmitter {
    constructor() {
        super();
    }
    init() {
        effectManager.registerEffect(require('./text-to-speech-polly-effect'));
    }
}

module.exports = {
    definition: integrationDefinition,
    integration: new AwsIntegration()
};
