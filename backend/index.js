const express = require('express');
const server = express();
const PORT = 8150;

server.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const got = require('got');
const queries = require('./queries')

const bodyParser = require('body-parser')

server.use(bodyParser.json())
server.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

// Map user friendly request names, into numbers
var map_characteristic = {
    height: 1,
    period: 2,
    direction: 3,
    temperature: 4
};

server.post('/insertBuoys', bodyParser.json(), queries.insertBuoysData)
server.get('/getBuoys', queries.getBuoysData)

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
    
    for(const val of values){
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


async function make_post(str, resp){
    const {body, statusCode} = await got.post(str, {json: resp});
}

server.post('/scrapeAndSave', function (req, res, next) {


    if(req.query.char === 'all' || typeof req.query.char === 'undefined'){
        var values = Object.values(map_characteristic)
        get_buoys_data_all(values).then(resp => {
            make_post('http://localhost:8150/insertBuoys', resp);
        }).then(resp => {
            res.status(201).send("Success")
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