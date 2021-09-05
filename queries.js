const fs = require('fs');

let rawdata = fs.readFileSync('credentials.json');
let credentials = JSON.parse(rawdata);

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'joaodb',
  password: credentials["dbPassword"],
  port: 5432,
})

const insertBuyosData = (request, response) => {  
    pool.query('INSERT INTO buoys (date, max_height, significant_height, avg_period, peak_period, direction, temperature)\
                VALUES ($1, $2, $3, $4, $5, $6, $7)', ['2020-10-05 14:01:10+01', 1.1, 0.9, 7.3, 8, 358, 24.5], (error, results) => {
        if (error) {
            throw error
        }
        response.status(201).send(`User added with ID: ${results.insertId}`)
    })
}

module.exports = {
    insertBuyosData
}