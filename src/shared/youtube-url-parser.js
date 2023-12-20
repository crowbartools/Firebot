'use strict';

function parseYoutubeId(id) {
    if (id.length === 11) { // string is same length as YouTube id
        return {id: id};
    }

    let url;
    let finalId = id;
    let startTime;

    if (!id.startsWith("http")) {
        id = `http://${id}`;
    }

    try {
        url = new URL(id);

        if (url.hostname === "youtube.com" || url.hostname === "www.youtube.com") {
            if (url.pathname.includes("/shorts/")) {
                return {id: url.pathname.replace("/shorts/", "")};
            }
        } else if (url.hostname === "youtu.be") {
            finalId = url.pathname.replace("/", "");
        } else {
            return {id: finalId};
        }

        for (const [key, value] of url.searchParams) {
            if (key === "v") {
                finalId = value;
            } else if (key === "t") {
                startTime = value;
            }
        }

    } catch (error) {
        return {id: finalId};
    }

    return {id: finalId, startTime: startTime};
}

exports.parseYoutubeId = parseYoutubeId;