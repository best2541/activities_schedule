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

const job = schedule.scheduleJob('1 * * * * *', function () {
    try {
        let yourDate = new Date()
        const date2 = new Date(yourDate.getTime() + 5 * 60000);
        knex('ACTIVITIES')
            .select('*')
            .where('start_date', `${yourDate.toISOString().split('T')[0]} ${date2.getHours()}:${date2.getMinutes()}:00`)
            .then(result => {
                // let form = new FormData();
                // form.append('message', `รายงานประจำวันที่ ${new Date().toLocaleDateString('th')} กรุณาตรวจสอบ ${name.toString()} `)
                if (result.length > 0) {
                    axios.post('https://api.line.me/v2/bot/message/push', {
                        "to": result[0]?.user_id,
                        "messages": [{
                            "type": "text",
                            "text": `อีก 5 นาที คุณมี"${result[0]?.topic}"`
                        }]
                    }, {
                        headers: {
                            Authorization: `Bearer ${process.env.lineToken}`
                        }
                    }).then(() => console.log('send msg'))
                }
            })
            knex('ACTIVITIES')
            .select('*')
            .where('start_date', `${yourDate.toISOString().split('T')[0]} ${yourDate.getHours()}:${yourDate.getMinutes()}:00`)
            .then(result => {
                if (result.length > 0) {
                    axios.post('https://api.line.me/v2/bot/message/push', {
                        "to": result[0]?.user_id,
                        "messages": [{
                            "type": "text",
                            "text": `คุณมี"${result[0]?.topic}"`
                        }]
                    }, {
                        headers: {
                            Authorization: `Bearer ${process.env.lineToken}`
                        }
                    }).then(() => console.log('send msg'))
                }
            })
    } catch(err) {
        console.log(err)
    }
})

app.listen(3001, () => {
    console.log('start on port 3001')
})