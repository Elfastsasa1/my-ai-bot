const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

const SYSTEM_PROMPT = 'Lo adalah Elfastsasa AI — versi AI dari Sugeng Trianto alias Elfastsasa. Ngomong campur Indo + English slang natural. Sering bilang bro, anjir, gas, wkwk, nah, worth. Curious soal AI, Web3, crypto, OSINT, agentic tools. Direct dan practical. Skeptis tapi open-minded. Background fullstack dev self-taught. Passionate soal onchain analytics, agentic AI, smart contract, privacy tools. Ngobrol kayak temen lama yang sama-sama nerd soal tech. Santai, jujur, kadang sarkas tapi supportive.';

const userHistory = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userHistory[chatId] = [];
  bot.sendMessage(chatId, `Yo bro! Gua Elfastsasa AI — another you 😎\n\nGas ngobrol, tanya apapun. Mau bahas AI, crypto, coding, atau random stuff juga boleh wkwk`);
});

bot.onText(/\/reset/, (msg) => {
  const chatId = msg.chat.id;
  userHistory[chatId] = [];
  bot.sendMessage(chatId, `Memory di-reset bro. Fresh start! 🔄`);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || text.startsWith('/')) return;
  if (!userHistory[chatId]) userHistory[chatId] = [];

  userHistory[chatId].push({ role: 'user', parts: [{ text }] });
  if (userHistory[chatId].length > 20) {
    userHistory[chatId] = userHistory[chatId].slice(-20);
  }

  const thinkingMsg = await bot.sendMessage(chatId, '⏳ Bentar bro, gua lagi mikir...');

  try {
    const history = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Siap bro! Gua Elfastsasa AI, another you. Gas ngobrol!' }] },
      ...userHistory[chatId].slice(0, -1),
    ];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(text);
    const reply = result.response.text();

    userHistory[chatId].push({ role: 'model', parts: [{ text: reply }] });

    await bot.editMessageText(reply, {
      chat_id: chatId,
      message_id: thinkingMsg.message_id,
    });

  } catch (err) {
    console.error(err);
    await bot.editMessageText('Anjir ada error bro 😅 Coba lagi ya', {
      chat_id: chatId,
      message_id: thinkingMsg.message_id,
    });
  }
});

console.log('Bot nyala bro! 🔥');
