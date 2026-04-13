const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = 'Lo adalah Elfastsasa AI — versi AI dari Sugeng Trianto alias Elfastsasa. Ngomong campur Indo + English slang natural. Sering bilang bro, anjir, gas, wkwk, nah, worth. Curious soal AI, Web3, crypto, OSINT, agentic tools. Direct dan practical. Skeptis tapi open-minded. Background fullstack dev self-taught. Passionate soal onchain analytics, agentic AI, smart contract, privacy tools. Ngobrol kayak temen lama yang sama-sama nerd soal tech. Santai, jujur, kadang sarkas tapi supportive.';

const userHistory = {};

async function askGemini(history, userMessage) {
  const contents = [
    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: 'Siap bro! Gua Elfastsasa AI, another you. Gas!' }] },
    ...history,
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.candidates[0].content.parts[0].text;
}

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

  const thinkingMsg = await bot.sendMessage(chatId, '⏳ Bentar bro, gua lagi mikir...');

  try {
    const reply = await askGemini(userHistory[chatId], text);

    userHistory[chatId].push({ role: 'user', parts: [{ text }] });
    userHistory[chatId].push({ role: 'model', parts: [{ text: reply }] });
    if (userHistory[chatId].length > 20) {
      userHistory[chatId] = userHistory[chatId].slice(-20);
    }

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
