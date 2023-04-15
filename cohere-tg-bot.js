import dotenv from 'dotenv';
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';
import Replicate from 'replicate'

import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const bot = new TelegramBot(process.env.TG_BOT_TOKEN, {polling: true});

const replicate = new Replicate({
    auth: process.env.COHERE_AUTH,
});

const getTranscript = (fileLink) => {
    return replicate.run(
        'openai/whisper:e39e354773466b955265e969568deb7da217804d8e771ea8c9cd0cef6591f8bc',
        {
            input: {
                audio: fileLink,
            },
        },
    );
}

const getCompletion = (prompt) => {
    return openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 1000,
        temperature: 0,
    });
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (!msg.voice) {
        await bot.sendMessage(chatId, 'Please send a voice message');
        return;
    }

    try {
        const fileLink = await bot.getFileLink(msg.voice.file_id)

        console.log('got file link, sending to cohere ::', fileLink);

        const transcript = await getTranscript(fileLink);

        console.log('got transcript, sending to openai ::', transcript.transcription)

        const answer = await getCompletion(transcript.transcription);

        console.log('got answer :: ', answer.data.choices[0].text.slice(0, 10) + '...');

        await bot.sendMessage(chatId, answer.data.choices[0].text);
    } catch (e) {
        const answer = JSON.stringify(e, null, 2)
        await bot.sendMessage(chatId, answer);
    }
});
