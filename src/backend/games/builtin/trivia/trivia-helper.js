"use strict";

const logger = require("../../../logwrapper");
const utils = require("../../../utility");

const getRandomItem = (array) => {
    if (array == null || !array.length) {
        return null;
    }
    const randomIndex = utils.getRandomInt(0, array.length - 1);
    return array[randomIndex];
};

const fetchQuestion = async (randomCategory, randomDifficulty, randomType, sessionToken) => {
    const url = `https://opentdb.com/api.php?encode=url3986&amount=1&category=${randomCategory}&difficulty=${randomDifficulty}&type=${randomType}${sessionToken ? `&token=${sessionToken}` : ''}`;
    try {

        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            const responseCode = data.response_code;
            const results = (data.results || []).map((q) => {
                q.category = decodeURIComponent(q.category);
                q.question = decodeURIComponent(q.question);
                // eslint-disable-next-line camelcase
                q.correct_answer = decodeURIComponent(q.correct_answer);
                // eslint-disable-next-line camelcase
                q.incorrect_answers = q.incorrect_answers.map(a => decodeURIComponent(a));
                return q;
            });
            return {
                responseCode: responseCode,
                results: results
            };
        }

        throw new Error(`Request failed with status ${response.status}`);
    } catch (error) {
        logger.error("Unable to fetch question from Trivia API:", error.message);
    }
    return null;
};

let sessionToken = null;
async function getSessionToken(forceNew = false) {
    if (sessionToken == null || forceNew) {
        try {
            const tokenResponse = await fetch("https://opentdb.com/api_token.php?command=request");
            if (tokenResponse.ok) {
                const data = await tokenResponse.json();
                if (data?.response_code === 0) {
                    sessionToken = data.token;
                }
            } else {
                throw new Error(`Request failed with status ${tokenResponse.status}`);
            }
        } catch (error) {
            logger.error("Unable to get session token for trivia:", error.message);
        }
    }
    return sessionToken;
}

exports.getQuestion = async (categories, difficulties, types) => {
    const randomCategory = getRandomItem(categories);
    const randomDifficulty = getRandomItem(difficulties);
    const randomType = getRandomItem(types);

    const sessionToken = await getSessionToken();
    let questionResponse = await fetchQuestion(randomCategory, randomDifficulty,
        randomType, sessionToken);

    if (questionResponse) {
        if (questionResponse.responseCode === 3 || questionResponse.responseCode === 4) {
            const sessionToken = await getSessionToken(true);
            questionResponse = await fetchQuestion(randomCategory, randomDifficulty,
                randomType, sessionToken);
        }

        if (questionResponse && questionResponse.responseCode === 0 && !!questionResponse.results.length) {
            const questionData = questionResponse.results[0];
            let answers;
            let correctIndex;
            if (questionData.type === "boolean") {
                answers = ["True", "False"];
                // using 1 based index since this is how users will answer
                correctIndex = questionData.correct_answer === "True" ? 1 : 2;
            } else {
                answers = utils.shuffleArray([...questionData.incorrect_answers, questionData.correct_answer]);
                // using 1 based index since this is how users will answer
                correctIndex = answers.findIndex(a => a === questionData.correct_answer) + 1;
            }

            logger.debug(`Fetched a question: ${questionData.question} | Correct answer #: ${correctIndex}`);

            return {
                question: questionData.question,
                difficulty: questionData.difficulty,
                answers: answers,
                correctIndex: correctIndex
            };
        }
    }
    return null;
};
