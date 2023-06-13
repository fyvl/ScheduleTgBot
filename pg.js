const { Client } = require('pg')

const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "4867590",
    database: "Schedule"
})

client.connect()

const selectRecord = () => {
    let selectQuery = `SELECT * FROM "Users"`

    return client.query(selectQuery)
        .then(result => result.rows)
        .catch(error => {
            throw new Error('Selection error: ' + error.message)
        })
}

const selectIdRecord = (username) => {
    let selectQuery = `SELECT schedule_id FROM "Users" WHERE username = '${username}'`

    return client.query(selectQuery)
        .then((result) => {
            return result.rows.map((row) => row.schedule_id)[0]
        })
        .catch(error => {
            throw new Error('Selection error: ' + error.message)
        })
}

const insertRecord = (username, tgid, scheduleid) => {
    const selectQuery = `SELECT * FROM "Users" WHERE username = '${username}'`
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
            throw new Error('Insertion error: ' + error.message)
        });
}

module.exports = {
    selectRecord,
    selectIdRecord,
    insertRecord
}