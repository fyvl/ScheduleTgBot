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

const insertRecord = (username, tgid, scheduleid) => {
    const selectQuery = `SELECT * FROM "Users" WHERE username = '${username}'`;
    const insertQuery = `INSERT INTO "Users" (username, tg_id, schedule_id) VALUES ('${username}', '${tgid}', '${scheduleid}') RETURNING *`

    return client.query(selectQuery)
        .then((result) => {
            if (result.rowCount > 0) {
                return { rowCount: 0, rows: result.rows[0] }
            } else {
                return client.query(insertQuery)
            }
        })
        .catch((error) => {
            throw new Error('Insert error: ' + error.message);
        });
}

module.exports = {
    selectPromise,
    insertRecord
}