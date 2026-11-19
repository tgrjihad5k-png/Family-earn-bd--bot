const TOKEN = process.env.BOT_TOKEN || '8975569014:AAHApFNowQQNnyOqLqDefIjbooe1p1fqJmI';
const GROUP_OR_CHANNEL_ID = '@faminyearnbd25';
const GROUP_INVITE_LINK = 'https://t.me/faminyearnbd25';
const APP_URL = 'https://familyearnbd24.netlify.app';

const API = `https://api.telegram.org/bot${TOKEN}`;

async function tg(method, payload = {}) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function handleUpdate(update) {
  if (update.message && update.message.text) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const userName = (msg.from && msg.from.first_name) ? msg.from.first_name : 'User';

    if (text.startsWith('/start')) {
      const welcomeText = `🎉 Welcome, ${userName}! 💸\n\n💰 Family Earn BD-তে আপনাকে স্বাগতম! 🚀\n\n💵 সহজ কাজ ও নিয়মিত আয়ের আপডেট পেতে নিচের Join Group বাটনে ক্লিক করে আমাদের গ্রুপে জয়েন করুন, তারপর ✅ Verify চাপুন! 👇`;

      await tg('sendMessage', {
        chat_id: chatId,
        text: welcomeText,
        reply_markup: {
          inline_keyboard: [
            [{ text: '📢 Join Group 💸', url: GROUP_INVITE_LINK }],
            [{ text: '✅ Verify Now 💰', callback_data: 'verify_join' }]
          ]
        }
      });
    }
  }

  if (update.callback_query) {
    const query = update.callback_query;
    const data = query.data || '';
    if (data !== 'verify_join') return;

    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const userName = query.from.first_name || 'User';

    try {
      const memberRes = await tg('getChatMember', {
        chat_id: GROUP_OR_CHANNEL_ID,
        user_id: userId
      });

      const status = memberRes && memberRes.result ? memberRes.result.status : '';
      const isJoined = ['creator', 'administrator', 'member'].includes(status);

      if (isJoined) {
        await tg('answerCallbackQuery', {
          callback_query_id: query.id,
          text: '🎉 ভেরিফিকেশন সফল হয়েছে! 💰'
        });
        await tg('sendMessage', {
          chat_id: chatId,
          text: `🎊 অভিনন্দন ${userName}! 💸\n\n✅ আপনার গ্রুপ জয়েন সফলভাবে ভেরিফাই হয়েছে! 💰\n📱 এখন নিচের বাটনে ক্লিক করে টেলিগ্রামের ভেতরেই Family Earn BD অ্যাপ ওপেন করুন! 👇`,
          reply_markup: {
            inline_keyboard: [
              [{ text: '📱 Open App 💰', web_app: { url: APP_URL } }]
            ]
          }
        });
      } else {
        await tg('answerCallbackQuery', {
          callback_query_id: query.id,
          text: '⚠️ আগে গ্রুপে জয়েন করুন, তারপর ✅ Verify চাপুন!',
          show_alert: true
        });
      }
    } catch (err) {
      await tg('answerCallbackQuery', {
        callback_query_id: query.id,
        text: '❌ ভেরিফাই করতে সমস্যা হচ্ছে। বটটিকে গ্রুপের অ্যাডমিন করুন।',
        show_alert: true
      });
    }
  }
}

async function poll() {
  let offset = 0;
  console.log('Bot started with fetch polling...');
  while (true) {
    try {
      const res = await fetch(`${API}/getUpdates?timeout=25&offset=${offset}`);
      const data = await res.json();
      if (data && data.ok && Array.isArray(data.result)) {
        for (const item of data.result) {
          offset = item.update_id + 1;
          await handleUpdate(item);
        }
      }
    } catch (err) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

poll();
