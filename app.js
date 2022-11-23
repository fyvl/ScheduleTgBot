const { Telegraf } = require('telegraf')
require('dotenv').config()
const data = require('./data')
const commands = require('./const')
const users = require('./pg')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => ctx.reply('Добро пожаловать!'))

bot.help((ctx) => ctx.reply(commands))

bot.hears('кто я', (ctx) => {
  bot.telegram.sendMessage(ctx.message.chat.id,
    `Привет, ${ctx.message.from.first_name}\n` +
    `Твой id: ${ctx.message.from.id}\n` +
    `Телегамм: @${ctx.message.from.username}`)
})

function getDif(date1, date2) {
  let dif = date1.getTime() - date2.getTime()
  return dif
}

bot.command('info', (ctx) => {
  let info = JSON.stringify(data[0], null, 2)
  bot.telegram.sendMessage(ctx.message.chat.id,
    `${info}`)
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

bot.command('task', (ctx) => {
  let info = JSON.stringify(data[0]['task'], null, 2)
  let task = info.split('"')
  let date = new Date().toISOString().slice(0, 10)
  let d1 = new Date()
  let d2 = new Date("2021-01-01")


  bot.telegram.sendMessage(ctx.message.chat.id,
    `${info}\n` +
    `Задача: ${task[3]}\n` +
    `Сегодня ${(d1 - d2) / 1000 / 60 / 60 / 24}`)
})

bot.hears("sign", (ctx) => ctx.reply("Please send your contact by pressing your contact", {
  reply_markup: {
    keyboard: [
      [
        {
          text: "📲 Send phone number",
          request_contact: true,
        },
      ],
    ],
    one_time_keyboard: true,
  },
}))

bot.on("contact", (ctx) => {
  const contact = ctx.message.contact.phone_number;
  console.log("Hello Contact", contact);
  bot.hears("nomer", (ctx) => ctx.reply(contact));
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))