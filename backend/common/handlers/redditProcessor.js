"use strict";

const logger = require("../../logwrapper");
const axios = require("axios");

function postPicker(posts) {
    while (posts.length) {
        let randomNum = Math.floor(Math.random() * posts.length);
        let item = posts[randomNum]['data'];

        // Tests
        let over18 = item['over_18'];
        let image = item['preview']['images'][0]['source']['url'];
        let ups = item['ups'];
        let downs = item['downs'];
        if (over18 !== true && image != null && ups > downs) {
            return image;
        }

        // Failed Tests, remove from array.
        posts.splice(randomNum, 1);
    }

    return false;
}

async function getSubredditData(subName) {
    let normalizedSubName = subName.replace("/r/", '').replace("r/", '');
    let url = "https://www.reddit.com/r/" + normalizedSubName + "/hot.json?count=15&raw_json=1";

    return await axios.get(url)
        .then(function(response) {
            return response.data.data.children;
        })
        .catch(function(err) {
            logger.warning(`Error getting subreddit ${subName}`, err);
        });
}

// Pulls a random image from a subreddit.
async function randomImageFromSubReddit(subreddit) {
    let subData = await getSubredditData(subreddit);

    if (subData == null) {
        logger.error("Couldn't find any valid posts in the subreddit.");
        renderWindow.webContents.send(
            "error",
            "Couldn't find any valid posts in the subreddit."
        );
        return "";
    }

    // Get our random post image url.
    let imageUrl = postPicker(subData);
    if (imageUrl === false) {
        logger.error("Couldn't find any valid posts in the subreddit.");
        renderWindow.webContents.send(
            "error",
            "Couldn't find any valid posts in the subreddit."
        );
        return "";
    }

    return imageUrl;
}

// Export Functions
exports.getRandomImage = randomImageFromSubReddit;
