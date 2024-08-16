require('dotenv').config()
const express = require('express')
const app = express()
const schedule = require('node-schedule')
const axios = require('axios')

const options = {
    client: 'mysql2',
    connection: {
        host: process.env.HOST,
        user: process.env.ROOT,
        password: process.env.NODE_ENV?.trim() == 'test' ? '' : process.env.NODE_ENV?.trim() == 'apple' ? 'password' : process.env.PASSWORD,
        database: process.env.DATABASE
    }
}
const knex = require('knex')(options);
global.knex = knex

app.use(express.urlencoded())
app.use(express.json({ extended: false }))

schedule.scheduleJob('0 * * * * *', () => {
    knex('REMIND')
        .select('*')
        .where(function () {
            this.where('routine', 1)
                .andWhere('hour_frequency', new Date().getHours())
                .andWhere('minute_frequency',new Date().getMinutes())
                .andWhere(function () {
                    this.where(function () {
                        this.where('date_frequency', new Date().getDate())
                            .andWhere(function () {
                                this.where('day_frequency', new Date().getDay()+1).orWhere('day_frequency', 0)
                            })
                    }).orWhere(function () {
                        this.where('day_frequency', new Date().getDay()+1)
                            .andWhere(function () {
                                this.where('date_frequency', new Date().getDate()).orWhere('date_frequency', 0)
                            })
                    }).orWhere(function () {
                        this.where('date_frequency', 0)
                            .andWhere('day_frequency', 0)
                    })
                })
        })
        .orWhere(function () {
            this.where('routine', 0)
                .andWhere('sended', 0)
                .andWhere('hour_frequency', new Date().getHours())
                .andWhere(function () {
                    this.where(function () {
                        this.where('date_frequency', new Date().getDate())
                            .andWhere(function () {
                                this.where('day_frequency', new Date().getDay()).orWhereNull('day_frequency')
                            });
                    }).orWhere(function () {
                        this.where('day_frequency', new Date().getDay())
                            .andWhere(function () {
                                this.where('date_frequency', new Date().getDate()).orWhereNull('date_frequency')
                            })
                    }).orWhere(function () {
                        this.where('date_frequency', 0)
                            .andWhere('day_frequency', 0)
                    })
                })
        })
        .then(result => {
            result?.map(x => {
                console.log(x)
                axios.post('https://api.line.me/v2/bot/message/push', {
                    "to": x?.user_id,
                    "messages": [{
                        "type": "text",
                        "text": x?.topic
                    }]
                }, {
                    headers: {
                        Authorization: `Bearer ${process.env.lineToken}`
                    }
                }).then(() => console.log('send msg'))
            })
        })
        .finally(() => {
            knex('REMIND')
                .update({ sended: 1 })
                .where({ routine: 0, sended: 0 })
                .then(() => {
                    console.log('sended updated')
                })
        })
})

// schedule.scheduleJob('0 0 0 0 0 *', () => {
//     const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

//     const today = new Date()
//     const dayOfWeek = days[today.getDay()]

//     knex('REMIND')
//         .select('*')
//         .whereRaw("frequency NOT REGEXP '^[0-9]+$'")
//         .then(result => {
//             result?.map(x => {
//                 if (x.frequency.includes(dayOfWeek)) {
//                     axios.post('https://api.line.me/v2/bot/message/push', {
//                         "to": x?.user_id,
//                         "messages": [{
//                             "type": "text",
//                             "text": x?.topic
//                         }]
//                     }, {
//                         headers: {
//                             Authorization: `Bearer ${process.env.lineToken}`
//                         }
//                     }).then(() => console.log('send msg'))
//                 }
//             })
//         })
// })

// const job = schedule.scheduleJob('1 * * * * *', function () {
//     try {
//         let yourDate = new Date()
//         const date2 = new Date(yourDate.getTime() + 5 * 60000);
//         knex('ACTIVITIES')
//             .select('*')
//             .where('start_date_time', `${yourDate.toISOString().split('T')[0]} ${date2.getHours()}:${date2.getMinutes()}:00`)
//             .then(result => {
//                 if (result.length > 0) {
//                     axios.post('https://api.line.me/v2/bot/message/push', {
//                         "to": result[0]?.user_id,
//                         "messages": [{
//                             "type": "text",
//                             "text": `อีก 5 นาที คุณมี"${result[0]?.topic}"`
//                         }]
//                     }, {
//                         headers: {
//                             Authorization: `Bearer ${process.env.lineToken}`
//                         }
//                     }).then(() => console.log('send msg'))
//                 }
//             })
//         knex('ACTIVITIES')
//             .select('*')
//             .where('start_date_time', `${yourDate.toISOString().split('T')[0]} ${yourDate.getHours()}:${yourDate.getMinutes()}:00`)
//             .then(result => {
//                 if (result.length > 0) {
//                     axios.post('https://api.line.me/v2/bot/message/push', {
//                         "to": result[0]?.user_id,
//                         "messages": [{
//                             "type": "text",
//                             "text": `คุณมี"${result[0]?.topic}"`
//                         }]
//                     }, {
//                         headers: {
//                             Authorization: `Bearer ${process.env.lineToken}`
//                         }
//                     }).then(() => console.log('send msg'))
//                 }
//             })
//     } catch (err) {
//         console.log(err)
//     }
// })

app.listen(3001, () => {
    console.log('start on port 3001')
})