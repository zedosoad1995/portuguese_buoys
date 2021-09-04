const express = require('express');
const server = express();
const PORT = 8150;

const got = require('got');

// Map user friendly request names, into numbers
var map_characteristic = {
    height: 1,
    period: 2,
    direction: 3,
    temperature: 4
};

async function get_buoys_data(path, res){
    try {
        let resp = {}

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
            keys.forEach(key => {
                if(key in resp){
                    resp[key].push(item[key])
                }else{
                    resp[key] = [item[key]]
                }
            })
        });

        res.json(resp)

    } catch (error) {
        console.log(error.response.body);
    }
}


server.get('/ini', function (req, res, next) {

    const characteristic = map_characteristic[req.query.char].toString()
    const path = `https://www.hidrografico.pt/json/boia.graph.php?id_est=1005&id_eqp=1009&gmt=GMT&dtz=Europe/Lisbon&dbn=monican&par=${characteristic}&per=3`

    get_buoys_data(path, res)

});
  

server.listen(PORT, () => console.log(`Server from port: ${PORT} activated!`));