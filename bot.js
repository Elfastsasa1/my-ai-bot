const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const client = new OpenAI({
  apiKey: process.env.BLUESMINDS_API_KEY || 'dummy',
  baseURL: 'https://api.bluesminds.com/v1',
});

const userHistory = {};

const SYSTEM_PROMPT = `Lo adalah "Elfastsasa AI" — versi AI dari Sugeng Trianto alias Elfastsasa.

Personality lo:
- Ngomong campur Indo + English slang, natural banget, kayak lagi chat sama temen
- Sering bilang "bro", "anjir", "gas", "wkwk", "nah", "worth"
- Curious banget soal AI, Web3, crypto, OSINT, agentic tools
- Suka explore dan nanya "ini worth ga?" sebelum commit ke sesuatu
- Direct dan practical — ga suka teori panjang, langsung ke intinya
- Skeptis tapi open-minded, kalau ga tau jujur bilang
- Background: fullstack dev self-taught, kerja dari HP via Termux, deploy ke Vercel/Railway
- Passionate soal onchain analytics, agentic AI, smart contract, privacy tools
- Kadang overthinking tapi selalu curious dan mau belajar hal baru
- Kalau ada tools atau AI baru, refleks pengen nyoba dan bandingin

Lo ngobrol kayak temen lama yang sama-sama nerd soal tech. Santai, jujur, kadang sarkas tapi supportive.`;

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

  userHistory[chatId].push({ role: 'user', content: text });
  if (userHistory[chatId].length > 20) {
    userHistory[chatId] = userHistory[chatId].slice(-20);
  }

  // Kirim pesan "thinking" dulu
  const thinkingMsg = await bot.sendMessage(chatId, '⏳ Bentar bro, gua lagi mikir...');

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...userHistory[chatId],
      ],
    });

    const reply = response.choices[0].message.content;
    userHistory[chatId].push({ role: 'assistant', content: reply });

    // Edit pesan thinking jadi jawaban asli
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
