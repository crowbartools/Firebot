"use strict";

const twitchClient = require("./client");

exports.getClient = () => twitchClient.getClient();

exports.channels = require("./resource/channels");
exports.users = require("./resource/users");
exports.teams = require("./resource/teams");
exports.categories = require("./resource/categories");
