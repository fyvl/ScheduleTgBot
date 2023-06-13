const { Telegraf } = require('telegraf')
require('dotenv').config()
const commands = require('./const')
const { selectRecord, selectIdRecord, insertRecord } = require('./pg')
const axios = require('axios')
const { CronJob } = require('cron')

const bot = new Telegraf(process.env.BOT_TOKEN)

const url = 'http://localhost:8083/schedule/notification'
const status = 'UNREAD'

let cronJob

bot.start((ctx) => {
    ctx.reply(`Добро пожаловать, ${ctx.message.from.first_name}!\n Чтобы начать рассылку и/или выбрать ее интервал используйте команду /schedule !`)
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

bot.command('schedule', (ctx) => {
    ctx.reply('Пожалуйста выберите интервал входящих уведомлений:', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Каждую 1 минуту', callback_data: '1' },
                    { text: 'Каждые 5 минут', callback_data: '5' },
                    { text: 'Каждые 10 минут', callback_data: '10' },
                ],
                [
                    { text: 'Каждые 30 минут', callback_data: '30' },
                    { text: 'Каждый час', callback_data: '60' },
                ],
            ],
        },
    })
})

bot.action(/(\d+)/, async (ctx) => {
    const interval = parseInt(ctx.match[1])

    if (cronJob) {
        cronJob.stop()
    }

    cronJob = new CronJob(`*/${interval} * * * *`, async () => {
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
                        console.error(error)
                        ctx.reply('Произошла ошибка, сервис временно недоступен!.')
                    })

                await bot.telegram.sendMessage(tg_id, 'Ваши непрочитанные уведомления: \n' + message)
                console.log(message)
            }
        } catch (error) {
            console.error('Error in scheduled job:', error)
        }
    })

    cronJob.start()
    ctx.reply(`Запланирована рассылка уведомлений каждые ${interval} минут.`)
})

bot.command('ntf', (ctx) => {
    const username = ctx.message.from.username

    selectIdRecord(username)
        .then((result) => {
            const id = result

            axios.get(url, {
                params: {
                    status: status
                },
                headers: {
                    'accept': '*/*',
                    'X-User-Identity': id
                }
            })
                .then(response => {
                    const data = response.data
                    if (data.notifications.length !== 0) {
                        message = data.notifications.map(notification => '*** ' + notification.message + ' ***').join('\n')
                    } else {
                        message = '*** Пусто ***'
                    }
                    ctx.reply('Ваши непрочитанные уведомления: \n' + message)
                })
                .catch(error => {
                    console.error(error)
                    ctx.reply('Произошла ошибка, сервис временно недоступен!.')
                })
        })
})

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