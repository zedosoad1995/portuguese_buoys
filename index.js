const express = require('express');
const server = express();
const PORT = 8150;

const https = require('https')
const options = {
  hostname: 'hidrografico.pt',
  port: 443,
  path: '/json/boia.graph.php?id_est=1005&id_eqp=1009&gmt=GMT&dtz=Europe/Lisbon&dbn=monican&par=4&per=3',
  method: 'GET'
}

server.get('/ini', function (req, res, next) {

    let resp = {}

    const http_req = https.request(options, http_res => {
        console.log(`statusCode: ${http_res.statusCode}`)
        
        http_res.on('data', d => {
            let text = d.toString("utf8");
            if (text.codePointAt(0) === 0xFEFF) { // UTF8 BOM
                text = text.substring(1);
            }
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