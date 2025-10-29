import logger from "../../../logwrapper";
import { getRandomItem, shuffleArray } from "../../../utils";

interface RawTriviaResponse {
    response_code: number;
    results: Array<{
        type: string;
        difficulty: string;
        category: string;
        question: string;
        correct_answer: string;
        incorrect_answers: string[];
    }>;
}

interface TriviaResponse {
    responseCode: number;
    results: Array<{
        type: string;
        difficulty: string;
        category: string;
        question: string;
        correct_answer: string;
        incorrect_answers: string[];
    }>;
}

async function fetchQuestion(
    randomCategory: number,
    randomDifficulty: string,
    randomType: string,
    sessionToken: string
): Promise<TriviaResponse> {
    const url = `https://opentdb.com/api.php?encode=url3986&amount=1&category=${randomCategory}&difficulty=${randomDifficulty}&type=${randomType}${sessionToken ? `&token=${sessionToken}` : ''}`;

    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json() as RawTriviaResponse;
            const responseCode = data.response_code;
            const results = (data.results ?? []).map((q) => {
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
        logger.error("Unable to fetch question from Trivia API:", (error as Error).message);
    }
    return null;
};

let sessionToken: string = null;
async function getSessionToken(forceNew = false): Promise<string> {
    if (sessionToken == null || forceNew) {
        try {
            const tokenResponse = await fetch("https://opentdb.com/api_token.php?command=request");
            if (tokenResponse.ok) {
                const data = await tokenResponse.json() as {
                    response_code: number;
                    token: string;
                };
                if (data?.response_code === 0) {
                    sessionToken = data.token;
                }
            } else {
                throw new Error(`Request failed with status ${tokenResponse.status}`);
            }
        } catch (error) {
            logger.error("Unable to get session token for trivia:", (error as Error).message);
        }
    }
    return sessionToken;
}

async function getQuestion(
    categories: number[],
    difficulties: string[],
    types: string[]
) {
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
            let answers: string[];
            let correctIndex: number;
            if (questionData.type === "boolean") {
                answers = ["True", "False"];
                // using 1 based index since this is how users will answer
                correctIndex = questionData.correct_answer === "True" ? 1 : 2;
            } else {
                answers = shuffleArray([...questionData.incorrect_answers, questionData.correct_answer]);
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

export default { getQuestion };