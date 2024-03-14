"use strict";

(function() {
    const uuid = require("uuid/v4");

    angular
        .module("firebotApp")
        .factory("viewerRanksService", function($q, backendCommunicator, objectCopyHelper, ngToast) {
            const service = {};

            service.rankTracks = [];

            service.loadRankTracks = async function() {
                $q.when(backendCommunicator.fireEventAsync("getRankTracks")).then((tracks) => {
                    if (tracks != null && Array.isArray(tracks)) {
                        service.rankTracks = tracks;
                    }
                });
            };

            service.saveAllRankTracks = function(tracks) {
                service.rankTracks = tracks;
                backendCommunicator.fireEventAsync("saveAllRankTracks", JSON.parse(angular.toJson(tracks)));
            };

            service.saveRankTrack = function(track) {
                if (track.id == null) {
                    track.id = uuid();
                    track.enabled = track.enabled ?? true;
                    track.ranks = track.ranks ?? [];
                }

                backendCommunicator.fireEventAsync("saveRankTrack", JSON.parse(angular.toJson(track)));

                const existingTrackIndex = service.rankTracks.findIndex(t => t.id === track.id);
                if (existingTrackIndex !== -1) {
                    service.rankTracks[existingTrackIndex] = track;
                } else {
                    service.rankTracks.push(track);
                }
            };

            service.deleteRankTrack = function(trackId) {
                backendCommunicator.fireEventAsync("deleteRankTrack", trackId);
                service.rankTracks = service.rankTracks.filter(t => t.id !== trackId);
            };

            service.duplicateRankTrack = (trackId) => {
                const track = service.rankTracks.find(t => t.id === trackId);
                if (track == null) {
                    return;
                }
                const copiedTrack = objectCopyHelper.copyObject("rank track", track);
                copiedTrack.id = null;

                while (service.rankTracks.some(t => t.name === copiedTrack.name)) {
                    copiedTrack.name += " copy";
                }

                service.saveRankTrack(copiedTrack);

                ngToast.create({
                    className: 'success',
                    content: 'Successfully duplicated a rank track!'
                });
            };

            return service;
        });
}());