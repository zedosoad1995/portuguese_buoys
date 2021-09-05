const express = require('express');
const server = express();
const PORT = 8150;

const got = require('got');

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

// Map user friendly request names, into numbers
var map_characteristic = {
    height: 1,
    period: 2,
    direction: 3,
    temperature: 4
};

const createUser = (request, response) => {  
    pool.query('INSERT INTO buoys (date, max_height, significant_height, avg_period, peak_period, direction, temperature)\
                VALUES ($1, $2, $3, $4, $5, $6, $7)', ['2020-10-05 14:01:10', 1.1, 0.9, 7.3, 8, 358, 24.5], (error, results) => {
        if (error) {
            throw error
        }
        response.status(201).send(`User added with ID: ${results.insertId}`)
    })
}
createUser

async function get_buoys_data(path, transformation_type){
    let resp = {}
    try {

        // GET Request
        const response = await got(path);
        // Converts response to JSON
        let text = response.body
        if (text.codePointAt(0) === 0xFEFF) {
            text = text.substring(1);
        }
        let data = JSON.parse(text)

        // Transform data
        data.forEach(item => {
            const keys = Object.keys(item)
            if(transformation_type==='all_arrays'){
                keys.forEach(key => {
                    if(key in resp){
                        resp[key].push(item[key])
                    }else{
                        resp[key] = [item[key]]
                    }
                })
            }else if(transformation_type==='date_keys'){
                resp[item["SDATA"]] = {}
                keys.forEach(key => {
                    if(key !== "SDATA"){
                        resp[item["SDATA"]][key] = item[key]
                    }
                })
            }
        });

    } catch (error) {
        console.log(error.response.body);
    }
    return resp;
}

// scrape multiple buoys data
async function get_buoys_data_all(values){

    resp = {}
    sub_keys = []
    
    for(const val in values){
        const path = `https://www.hidrografico.pt/json/boia.graph.php?id_est=1005&id_eqp=1009&gmt=GMT&dtz=Europe/Lisbon&dbn=monican&par=${val}&per=3`
        let res = await get_buoys_data(path, "date_keys")
        if(Object.keys(resp).length === 0){
            resp = res
        }else{
            Object.keys(res).forEach(key => {
                if(!(key in resp)){
                    resp[key] = {}
                }
                Object.keys(res[key]).forEach(key2 => {
                    resp[key][key2] = res[key][key2]
                    if(!sub_keys.includes(key2)){
                        sub_keys.push(key2)
                    }
                })
            })
        }
    }
    Object.keys(resp).forEach(key => {
        sub_keys.forEach(key2 => {
            if(!Object.keys(resp[key]).includes(key2)){
                resp[key][key2] = "NaN"
            }
        })
    })
    let resp2 = {}
    resp2["DATE"] = Object.keys(resp)
    Object.keys(resp).forEach(key => {
        Object.keys(resp[key]).forEach(key2 => {
            if(key2 in resp2){
                resp2[key2].push(resp[key][key2])
            }else{
                resp2[key2] = [resp[key][key2]]
            }
        })
    })
    return resp2
}

server.get('/scrape', function (req, res, next) {

    if(req.query.char === 'all'){
        var values = Object.values(map_characteristic)
        get_buoys_data_all(values).then(resp => {
            res.json(resp)
        })

    }else{
        const characteristic = map_characteristic[req.query.char]
        const path = `https://www.hidrografico.pt/json/boia.graph.php?id_est=1005&id_eqp=1009&gmt=GMT&dtz=Europe/Lisbon&dbn=monican&par=${characteristic}&per=3`

        get_buoys_data(path, "all_arrays").then(resp => {
            res.json(resp)
        })
    }

});
  

server.listen(PORT, () => console.log(`Server from port: ${PORT} activated!`));