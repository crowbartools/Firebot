import frontendCommunicator from "../frontend-communicator";
import logger from "../../logwrapper";

interface RedditPost {
    data: {
        over_18: boolean;
        preview: {
            images: Array<{
                source: {
                    url: string;
                };
            }>;
        };
        ups: number;
        downs: number;
    };
}

function postPicker(posts: RedditPost[]): string | false {
    while (posts.length) {
        const randomNum = Math.floor(Math.random() * posts.length);
        const item = posts[randomNum]['data'];

        // Tests
        const over18 = item['over_18'];
        const image = item.preview?.images?.length
            ? item['preview']['images'][0]['source']['url']
            : null;
        const ups = item['ups'];
        const downs = item['downs'];
        if (over18 !== true && image != null && ups > downs) {
            return image;
        }

        // Failed Tests, remove from array.
        posts.splice(randomNum, 1);
    }

    return false;
}

async function getSubredditData(subName: string): Promise<RedditPost[]> {
    const normalizedSubName = subName.replace("/r/", '').replace("r/", '');
    const url = `https://www.reddit.com/r/${normalizedSubName}/hot.json?count=15&raw_json=1`;

    try {
        const response = await fetch(url);
        return (await response.json() as { data: { children: RedditPost[] } }).data.children;
    } catch (error) {
        logger.warn(`Error getting subreddit ${subName}`, error);
    }
}

async function randomImageFromSubReddit(subreddit: string): Promise<string> {
    const subData = await getSubredditData(subreddit);

    if (subData == null) {
        logger.error("Couldn't find any valid posts in the subreddit.");
        frontendCommunicator.send(
            "error",
            "Couldn't find any valid posts in the subreddit."
        );
        return "";
    }

    // Get our random post image url.
    const imageUrl = postPicker(subData);
    if (imageUrl === false) {
        logger.error("Couldn't find any valid posts in the subreddit.");
        frontendCommunicator.send(
            "error",
            "Couldn't find any valid posts in the subreddit."
        );
        return "";
    }

    return imageUrl;
}

export { randomImageFromSubReddit as getRandomImage };