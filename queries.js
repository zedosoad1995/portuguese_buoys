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

// TODO: Insert everything with just 1 INSERT
var Param_names = ["DATE", "HMAX", "HS", "TZ", "TP", "THTP", "TEMP"]
async function insertBuyosData(request, response){
    const obj = request.body

    var vals_to_insert = []
    Object.keys(obj).forEach(key => {
        vals_to_insert.push('{' + JSON.stringify(check_null(obj[key])).slice(1,-1) + '}')
    });


    await pool.query('INSERT INTO temp_buoys (date, max_height, significant_height, avg_period, peak_period, direction, temperature)\
                    VALUES(UNNEST($1::TIMESTAMPTZ[]), UNNEST($2::NUMERIC[]), UNNEST($3::NUMERIC[]), UNNEST($4::NUMERIC[]),\
                    UNNEST($5::NUMERIC[]), UNNEST($6::INTEGER[]), UNNEST($7::NUMERIC[]))', 
                    vals_to_insert, (error, results) => {
        if (error) {
            throw error
        }
    })

    response.status(201).send("Success")
}

module.exports = {
    insertBuyosData
}