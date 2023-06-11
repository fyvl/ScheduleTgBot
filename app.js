const { Telegraf } = require('telegraf')
require('dotenv').config()
const commands = require('./const')
const users = require('./pg')
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN)

const url = 'http://localhost:8083/schedule/notification'
const status = 'UNREAD'
let recipientId

bot.start((ctx) => {
  ctx.reply('Добро пожаловать!')
  recipientId = ctx.message.text.split(' ')[1]
})

bot.command('ntf', (ctx) => {
  axios.get(url, {
    params: {
      status: status
    },
    headers: {
      'accept': '*/*',
      'X-User-Identity': recipientId
    }
  })
    .then(response => {
      const data = response.data
      const messages = data.notifications.map(notification => '***' + notification.message + '***').join('\n')
      ctx.reply('Ваши непрочитанные уведомления: \n' + messages)
    })
    .catch(error => {
      console.error(error);
      ctx.reply('Произошла ошибка, сервис временно недоступен!.')
    });
});

bot.help((ctx) => ctx.reply(commands))

bot.hears('кто я', (ctx) => {
  bot.telegram.sendMessage(ctx.message.chat.id,
    `Привет, ${ctx.message.from.first_name}\n` +
    `Твой id: ${ctx.message.from.id}\n` +
    `Телегамм: @${ctx.message.from.username}`)
})

bot.command('users', (ctx) => {
  users.then((e) => {
    console.log(e.rows)
    bot.telegram.sendMessage(ctx.message.chat.id,
      `${e.rows}`)
  }).catch((e) => {
    console.log(e.message)
  })
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))