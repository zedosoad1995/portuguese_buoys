
async function getBuoysData(){
    const response = await fetch('http://localhost:8150/getBuoys')
    const myJson = await response.json()
    console.log(myJson)
    return myJson
}

async function scrapeAndSave(){
    const response = await fetch('http://localhost:8150/scrapeAndSave')
    console.log(response)
}

//
getBuoysData().then(res => {

    xValues = res['date']
    yValues = res['temperature']
    return [xValues, yValues]
}).then(res => {
    x = res[0]
    y = res[1]

    console.log(x, y)
    new Chart("myChart", {
        type: "line",
        data: {
            labels: x,
            datasets: [{
                fill: false,
                lineTension: 0,
                backgroundColor: "rgba(0,0,255,1.0)",
                borderColor: "rgba(0,0,255,0.1)",
                data: y
            }]
        },
        options: {
            legend: {display: false},
            scales: {
                x: {type: 'time', time: {unit: 'month'}},
                yAxes: [{ticks: {min: 15, max:30}}]
            }
        }
    })
})