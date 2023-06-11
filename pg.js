const { Client } = require('pg')

const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "4867590",
    database: "Schedule"
})

client.connect()

let selectQuery = `SELECT * FROM "Users"`
const selectPromise = client.query(selectQuery)

const insertRecord = (username, tgid) => {
    const insertQuery = `INSERT INTO "Users" (username, tgid) VALUES ('${username}', '${tgid}') RETURNING *`
    return client.query(insertQuery)
}

module.exports = {
    selectPromise,
    insertRecord
}