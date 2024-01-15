"use strict";

const viewerDatabase = require("../viewers/viewer-database");
const viewerMetadataManager = require("../viewers/viewer-metadata-manager");
const viewerOnlineStatusManager = require("../viewers/viewer-online-status-manager");

exports.getUserDb = () => viewerDatabase.getViewerDb();
exports.connectUserDatabase = async () => viewerDatabase.connectViewerDatabase();
exports.createNewUser = async (...args) => viewerDatabase.createNewViewer(...args);
exports.addNewUserFromChat = async (...args) => viewerDatabase.addNewViewerFromChat(...args);
exports.getUserById = async id => viewerDatabase.getViewerById(id);
exports.getUserByUsername = async username => viewerDatabase.getViewerByUsername(username);
exports.getTwitchUserByUsername = async username => viewerDatabase.getViewerByUsername(username);
exports.getAllUsernames = async () => viewerDatabase.getAllUsernames();
exports.getAllUsernamesWithIds = async () => viewerDatabase.getAllUsernamesWithIds();
exports.updateUser = async viewer => viewerDatabase.updateViewer(viewer);
exports.updateViewerDataField = async (...args) => viewerDatabase.updateViewerDataField(...args);
exports.removeUser = async id => viewerDatabase.removeViewer(id);
exports.incrementDbField = async (...args) => viewerDatabase.incrementDbField(...args);

exports.getUserMetadata = async (...args) => viewerMetadataManager.getViewerMetadata(...args);
exports.getTopMetadata = async (...args) => viewerMetadataManager.getTopMetadata(...args);
exports.getTopMetadataPosition = async (...args) => viewerMetadataManager.getTopMetadataPosition(...args);
exports.updateUserMetadata = async (...args) => viewerMetadataManager.updateViewerMetadata(...args);
exports.removeUserMetadata = async (...args) => viewerMetadataManager.removeViewerMetadata(...args);

exports.setChatUserOnline = async viewer => viewerOnlineStatusManager.setChatViewerOnline(viewer);
exports.setChatUsersOnline = async () => viewerOnlineStatusManager.setAllChatViewersOnline();
exports.setChatUserOffline = async id => viewerOnlineStatusManager.setChatViewerOffline(id);
exports.setAllUsersOffline = async () => viewerOnlineStatusManager.setAllViewersOffline();
exports.getUserOnlineMinutes = async username => viewerOnlineStatusManager.getViewerOnlineMinutes(username);
exports.getTopViewTimeUsers = async count => viewerOnlineStatusManager.getTopViewTimeViewers(count);
exports.getOnlineUsers = async () => viewerOnlineStatusManager.getOnlineViewers();