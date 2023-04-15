import dotenv from 'dotenv';
dotenv.config();

import { exec } from './util/exec.js'

import { fileURLToPath } from 'url';
import { dirname } from 'path';

import TelegramBot from 'node-telegram-bot-api';

import { audioToTextOpenai } from './ai/augio-to-text.js'
import { getChatGPTResponse } from './ai/chat-gpt.js'
import * as fs from 'fs'
const bot = new TelegramBot(process.env.TG_BOT_TOKEN, {polling: true});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    const sendMessage = (_text) => {
        bot.sendMessage(chatId, _text);
    }

    if (!msg.voice && !msg.text) {
        await sendMessage('Не понимаю, что ты от меня хочешь. Попробуй еще раз.');
        return;
    }

    await sendMessage('Обработка начинается...');

    let text = '';

    if (!msg.voice) {
        text = msg.text;
    }

    if (msg.voice) {
        try {

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = dirname(__filename);

            console.log('file_id :: ', msg.voice.file_id)

            const path = await bot.downloadFile(msg.voice.file_id, __dirname);
            const path_mp3 = path.replace('.oga', '.mp3');

            await exec(`ffmpeg -i ${path} ${path_mp3}`)

            await sendMessage('Начинаю распознание речи...');

            const { data } = await audioToTextOpenai(fs.createReadStream(path_mp3));

            await exec(`rm ${path} ${path_mp3}`);

            await sendMessage(`Получилось распознать речь! Вы сказали: "${data.text}"`);

            text = data.text;
        } catch (e) {
            console.log('Не получилось распознать речь!', e?.response?.data?.error || e);
            await sendMessage('Не получилось распознать речь! Попробуй еще раз.');
            return;
        }
    }

    try {

        await sendMessage('Отправляю запрос в chat gpt...');

        const answer = await getChatGPTResponse(text);

        await sendMessage('Ответ получен!');

        console.log('got answer :: ', answer.data.choices[0].text.slice(0, 25) + '...');

        await bot.sendMessage(chatId, answer.data.choices[0].text);
    } catch (e) {
        const answer = JSON.stringify(e, null, 2)
        await bot.sendMessage(chatId, answer);
    }
});
