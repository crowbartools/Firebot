import logger from "../../../logwrapper";
import utils from "../../../utility";

export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "boolean" | "multiple";

type OpenTdbMultipleChoiceQuestion = {
    correct_answer: string;
    incorrect_answers: string[];
    type: "multiple";
};
type OpenTdbBooleanQuestion = {
    correct_answer: "True" | "False";
    type: "boolean";
};
type OpenTdbQuestion = (OpenTdbMultipleChoiceQuestion | OpenTdbBooleanQuestion) & {
    category: string;
    difficulty: Difficulty;
    question: string;
};
type OpenTdbQuestionResponse = {
    response_code: number;
    results?: OpenTdbQuestion[];
};
type OpenTdbTokenResponse = {
    response_code: number;
    token: string;
};

function getRandomItem<T = unknown>(array: T[]): T | null {
    if (array == null || !array.length) {
        return null;
    }
    const randomIndex = utils.getRandomInt(0, array.length - 1);
    return array[randomIndex];
}

async function fetchQuestion (category: number, difficulty: Difficulty, type: QuestionType, token: string) {
    const url = `https://opentdb.com/api.php?encode=url3986&amount=1&category=${category}&difficulty=${difficulty}&type=${type}${token ? `&token=${token}` : ''}`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json() as OpenTdbQuestionResponse;
            const responseCode = data.response_code;
            const results = (data.results || []).map((q) => {
                q.category = decodeURIComponent(q.category);
                q.question = decodeURIComponent(q.question);
                // eslint-disable-next-line camelcase
                q.correct_answer = decodeURIComponent(q.correct_answer);
                if (q.type === "multiple" && q.incorrect_answers) {
                    // eslint-disable-next-line camelcase
                    q.incorrect_answers = q.incorrect_answers.map(a => decodeURIComponent(a));
                }
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
}

let sessionToken: string = null;
async function getSessionToken(forceNew = false) {
    let resultToken = sessionToken;
    if (forceNew || !resultToken) {
        try {
            const tokenResponse = await fetch("https://opentdb.com/api_token.php?command=request");
            if (tokenResponse.ok) {
                const data = await tokenResponse.json() as OpenTdbTokenResponse;
                if (data?.response_code === 0) {
                    resultToken = data.token;
                }
            } else {
                throw new Error(`Request failed with status ${tokenResponse.status}`);
            }
        } catch (error) {
            logger.error("Unable to get session token for trivia:", error.message);
        }
    }
    return resultToken;
}

async function getQuestion(
    categories: number[],
    difficulties: Difficulty[],
    types: QuestionType[]
) {
    const randomCategory = getRandomItem(categories);
    const randomDifficulty = getRandomItem(difficulties);
    const randomType = getRandomItem(types);

    sessionToken ??= await getSessionToken();

    let questionResponse = await fetchQuestion(randomCategory, randomDifficulty,
        randomType, sessionToken);

    if (questionResponse) {
        // Code 3: Token Not Found; Session Token does not exist.
        // Code 4: Token Empty; Session Token has returned all possible questions for the specified query. Resetting the Token is necessary.
        if (questionResponse.responseCode === 3 || questionResponse.responseCode === 4) {
            sessionToken = await getSessionToken(true);
            questionResponse = await fetchQuestion(randomCategory, randomDifficulty,
                randomType, sessionToken);
        }

        if (questionResponse && questionResponse.responseCode === 0 && !!questionResponse.results.length) {
            const questionData = questionResponse.results[0] as OpenTdbQuestion;
            let answers: string[];
            let correctIndex: number;
            if (questionData.type === "boolean") {
                answers = ["True", "False"];
                // using 1 based index since this is how users will answer
                correctIndex = questionData.correct_answer === "True" ? 1 : 2;
            } else if (questionData.type === "multiple") {
                answers = [...questionData.incorrect_answers, questionData.correct_answer];
                answers = utils.shuffleArray(answers as []);
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
}

export default {
    getQuestion
};
