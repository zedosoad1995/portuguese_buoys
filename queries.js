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

function check_null(val){
    for(var i = 0; i < val.length; i++){
        if(val[i] === "NaN"){
            val[i] = null
        }
    }
    return val
}

const update_query = "UPDATE buoys \
SET max_height = t3.max_height, \
significant_height = t3.significant_height, \
avg_period = t3.avg_period, \
peak_period = t3.peak_period, \
direction = t3.direction, \
temperature = t3.temperature \
FROM( \
SELECT \
t1.date AS date, \
CASE \
WHEN (t2.max_height IS NULL) THEN t1.max_height \
ELSE t2.max_height \
END AS max_height, \
CASE \
WHEN (t2.significant_height IS NULL) THEN t1.significant_height \
ELSE t2.significant_height \
END AS significant_height, \
CASE \
WHEN (t2.avg_period IS NULL) THEN t1.avg_period \
ELSE t2.avg_period \
END AS avg_period, \
CASE \
WHEN (t2.peak_period IS NULL) THEN t1.peak_period \
ELSE t2.peak_period \
END AS peak_period, \
CASE \
WHEN (t2.direction IS NULL) THEN t1.direction \
ELSE t2.direction \
END AS direction, \
CASE \
WHEN (t2.temperature IS NULL) THEN t1.temperature \
ELSE t2.temperature \
END AS temperature \
FROM temp_buoys t1 \
INNER JOIN buoys t2 ON t2.date = t1.date \
WHERE t2.max_height IS NULL OR t2.significant_height IS NULL OR \
t2.avg_period IS NULL OR t2.peak_period IS NULL OR \
t2.direction IS NULL OR t2.temperature IS NULL \
) AS t3 \
WHERE t3.date = buoys.date"

const insert_query = "INSERT INTO buoys (date, max_height, significant_height, avg_period, peak_period, direction, temperature) \
SELECT t1.date, t1.max_height, t1.significant_height, t1.avg_period, t1.peak_period, t1.direction, t1.temperature \
FROM temp_buoys t1 \
LEFT JOIN buoys t2 ON t2.date = t1.date \
WHERE t2.id IS NULL"

var Param_names = ["DATE", "HMAX", "HS", "TZ", "TP", "THTP", "TEMP"]
async function insertBuyosData(request, response){
    const obj = request.body

    var vals_to_insert = []
    Object.keys(obj).forEach(key => {
        vals_to_insert.push('{' + JSON.stringify(check_null(obj[key])).slice(1,-1) + '}')
    });

    await pool.query('TRUNCATE TABLE temp_buoys', (error, results) => {
        if (error) {
            throw error
        }
        pool.query('INSERT INTO temp_buoys (date, max_height, significant_height, avg_period, peak_period, direction, temperature)\
                    VALUES(UNNEST($1::TIMESTAMPTZ[]), UNNEST($2::NUMERIC[]), UNNEST($3::NUMERIC[]), UNNEST($4::NUMERIC[]),\
                    UNNEST($5::NUMERIC[]), UNNEST($6::INTEGER[]), UNNEST($7::NUMERIC[]))', 
        vals_to_insert, (error, results) => {
            if (error) {
                throw error
            }
            pool.query(update_query, (error, results) => {
                if (error) {
                    throw error
                }
                pool.query(insert_query, (error, results) => {
                    if (error) {
                        throw error
                    }
                })
            })
        })
    })


    response.status(201).send("Success")
}

module.exports = {
    insertBuyosData
}