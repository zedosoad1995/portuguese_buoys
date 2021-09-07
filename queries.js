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

const list_columns = ['max_height', 'significant_height', 'avg_period', 'peak_period', 'direction', 'temperature']
const map_cols_types = {
    'max_height': 'NUMERIC',
    'significant_height': 'NUMERIC',
    'avg_period': 'NUMERIC',
    'peak_period': 'NUMERIC',
    'direction': 'INTEGER',
    'temperature': 'NUMERIC',
}

function make_update_query(list_columns){
    let return_string = "UPDATE buoys SET "
    for(col of list_columns){
        return_string += col + " = t3." + col + ", "
    }
    return_string = return_string.slice(0, -2) + " FROM(SELECT t1.date AS date, "
    for(col of list_columns){
        return_string += "CASE WHEN (t2." + col + " IS NULL) THEN t1." + col + " ELSE t2." + col + " END AS " + col + ", "
    }
    return_string = return_string.slice(0, -2) + " FROM temp_buoys t1 INNER JOIN buoys t2 ON t2.date = t1.date WHERE "
    for(col of list_columns){
        return_string += "t2." + col + " IS NULL OR "
    }
    return_string = return_string.slice(0, -" OR ".length) + ") AS t3 WHERE t3.date = buoys.date"

    return return_string
}

function make_insert_query(list_columns){
    let return_string = "INSERT INTO buoys (date, "
    for(col of list_columns){
        return_string += col + ", "
    }
    return_string = return_string.slice(0, -2) + ") SELECT t1.date, "
    for(col of list_columns){
        return_string += "t1." + col + ", "
    }
    return_string = return_string.slice(0, -2) + " FROM temp_buoys t1 LEFT JOIN buoys t2 ON t2.date = t1.date WHERE t2.id IS NULL"
    return return_string
}

function make_temp_insert_query(list_columns){
    let return_string = "INSERT INTO temp_buoys (date, "
    for(col of list_columns){
        return_string += col + ", "
    }
    return_string = return_string.slice(0, -2) + ") VALUES(UNNEST($1::TIMESTAMPTZ[])"
    for(let i = 0; i < list_columns.length; i++){
        return_string += ", UNNEST($" + (i+2).toString() + "::" + map_cols_types[list_columns[i]] + "[])"
    }
    return_string += ")"
    return return_string
}
//'INSERT INTO temp_buoys (date, max_height, significant_height, avg_period, peak_period, direction, temperature)\
//                    VALUES(UNNEST($1::TIMESTAMPTZ[]), UNNEST($2::NUMERIC[]), UNNEST($3::NUMERIC[]), UNNEST($4::NUMERIC[]),\
//                    UNNEST($5::NUMERIC[]), UNNEST($6::INTEGER[]), UNNEST($7::NUMERIC[]))'

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
        pool.query(make_temp_insert_query(list_columns), 
        vals_to_insert, (error, results) => {
            if (error) {
                throw error
            }
            pool.query(make_update_query(list_columns), (error, results) => {
                if (error) {
                    throw error
                }
                pool.query(make_insert_query(list_columns), (error, results) => {
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
    insertBuyosData,
}