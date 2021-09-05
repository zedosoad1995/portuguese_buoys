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
    if(val === "NaN"){
        return null
    }
    return val
}

// TODO: Insert everything with just 1 INSERT
var Param_names = ["DATE", "HMAX", "HS", "TZ", "TP", "THTP", "TEMP"]
async function insertBuyosData(request, response){
    const obj = request.body
    console.log(obj)
    for(let i = 0; i < obj["DATE"].length; i++){
        let date = check_null(obj["DATE"][i])
        if(date !== null){
            date += "+01"
        }
        const hmax = check_null(obj["HMAX"][i])
        const hs = check_null(obj["HS"][i])
        const tz = check_null(obj["TZ"][i])
        const tp = check_null(obj["TP"][i])
        const thtp = check_null(obj["THTP"][i])
        const temp = check_null(obj["TEMP"][i])
        await pool.query('INSERT INTO buoys (date, max_height, significant_height, avg_period, peak_period, direction, temperature)\
                    VALUES ($1, $2, $3, $4, $5, $6, $7)', [date, hmax, hs, tz, tp, thtp, temp], (error, results) => {
            if (error) {
                throw error
            }
        })
    }
    response.status(201).send("Success")
}

module.exports = {
    insertBuyosData
}