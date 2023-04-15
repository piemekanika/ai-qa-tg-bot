import dotenv from 'dotenv';
dotenv.config();

import Replicate from 'replicate';

const replicate = new Replicate({
    auth: process.env.COHERE_AUTH,
});

/**
 * Converts audio to text with an AI (Cohere, openai/whisper)
 *
 * @param fileLink
 * @returns {Promise<object>}
 */
const audioToText = (fileLink) => {
    return replicate.run(
        'openai/whisper:e39e354773466b955265e969568deb7da217804d8e771ea8c9cd0cef6591f8bc',
        {
            input: {
                audio: fileLink,
            },
        },
    );
}

import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const audioToTextOpenai = (fileLink) => {
    return openai.createTranscription(fileLink, 'whisper-1');
}

export {
    audioToText,
    audioToTextOpenai,
};
