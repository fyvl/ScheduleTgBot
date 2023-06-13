const { Telegraf } = require('telegraf')
require('dotenv').config()
const commands = require('./const')
const { selectRecord, selectIdRecord, insertRecord } = require('./pg')
const axios = require('axios')
const cron = require('node-cron')

const bot = new Telegraf(process.env.BOT_TOKEN)

const url = 'http://localhost:8083/schedule/notification'
const status = 'UNREAD'
let recipientId

cron.schedule('*/30 * * * * *', async () => {
    try {
        const subscribedUsers = await selectRecord()
        console.log(subscribedUsers)

        for (const user of subscribedUsers) {
            const { tg_id } = user
            const { schedule_id } = user
            let message

            await axios.get(url, {
                params: {
                    status: status
                },
                headers: {
                    'accept': '*/*',
                    'X-User-Identity': schedule_id
                }
            })
                .then(response => {
                    const data = response.data
                    if (data.notifications.length !== 0) {
                        message = data.notifications.map(notification => '*** ' + notification.message + ' ***').join('\n')
                    } else {
                        message = '*** Пусто ***'
                    }
                })
                .catch(error => {
                    console.error(error);
                    ctx.reply('Произошла ошибка, сервис временно недоступен!.')
                });

            await bot.telegram.sendMessage(tg_id, 'Ваши непрочитанные уведомления: \n' + message)
            console.log(message)
        }
    } catch (error) {
        console.error('Error in scheduled job:', error)
    }
});

bot.start((ctx) => {
    ctx.reply(`Добро пожаловать, ${ctx.message.from.first_name}!`)
    recipientId = ctx.message.text.split(' ')[1]

    const username = ctx.message.from.username
    const tgId = ctx.message.from.id

    insertRecord(username, tgId, recipientId)
        .then((result) => {
            if (result.rowCount == 0) {
                console.log(`User already exists! @${result.rows.username}`)
            } else {
                console.log('Inserted row:', result.rows)
            }
        })
        .catch((error) => {
            console.error('Insertion error:', error)
        })
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
    selectRecord()
        .then((e) => {
            const result = JSON.stringify(e, null, 2)
            bot.telegram.sendMessage(ctx.message.chat.id,
                `${result}`)
        }).catch((e) => {
            console.log(e.message)
        })
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))