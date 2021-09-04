const express = require('express');
const server = express();
const PORT = 8150;

const https = require('https')

// Map user friendly request names, into numbers
var map_characteristic = {
    height: 1,
    period: 2,
    direction: 3,
    temperature: 4
};




server.get('/ini', function (req, res, next) {

    const characteristic = map_characteristic[req.query.char].toString()

    const options = {
        hostname: 'hidrografico.pt',
        port: 443,
        path: `/json/boia.graph.php?id_est=1005&id_eqp=1009&gmt=GMT&dtz=Europe/Lisbon&dbn=monican&par=${characteristic}&per=3`,
        method: 'GET'
      }

    let resp = {}

    const http_req = https.request(options, http_res => {
        console.log(`statusCode: ${http_res.statusCode}`)
        
        http_res.on('data', d => {
            let text = d.toString("utf8");
            console.log(text)
            console.log('yuppi!')
            if (text.codePointAt(0) === 0xFEFF) {
                text = text.substring(1);
            }
            //console.log(text)
            const data = JSON.parse(text)

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
        })
    })
    http_req.on('error', error => {
        console.error(error)
    })
    http_req.end()
});
  

server.listen(PORT, () => console.log(`Server from port: ${PORT} activated!`));