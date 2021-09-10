var buoys_data
var current_param = "temperature"
var myLineChart

async function scrapeAndSave(){
    const response = await fetch('http://localhost:8150/scrapeAndSave', {
        method: 'POST',
        //body: myBody, // string or object
        headers: {
          'Content-Type': 'application/json'
        }
    });
    displayChart(buoys_data['date'], buoys_data[current_param])
}

async function getBuoysData(){
    const response = await fetch('http://localhost:8150/getBuoys')
    buoys_data = await response.json()
    return buoys_data
}

function changePlot(param){
    current_param = param
    displayChart(buoys_data['date'], buoys_data[current_param])
}


function displayChart(x, y){

    if(typeof myLineChart !== 'undefined'){
        myLineChart.destroy()
    }

    myLineChart = new Chart("myChart", {
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
                xAxes: [{
                    type: 'time',
                    time: {
                        tooltipFormat:'DD/MM/YYYY HH:mm',
                        displayFormats: {
                            day: 'DD/MM/YYYY'
                        }
                    }
                }]
            }
        }
    })
}

// Init
getBuoysData().then(res => {
    displayChart(res['date'], res['temperature'])
})