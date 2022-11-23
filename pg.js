const { Client } = require('pg')

const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "4867590",
    database: "Schedule"
})

client.connect()

let query = `Select * from "Users"`

const usersPromise = client.query(query)

module.exports = usersPromise