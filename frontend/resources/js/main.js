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
    await response.json()
    await getBuoysData().then(res => {
        displayChart(res['date'], res[current_param])
    })
}

async function getBuoysData(date_range){
    let parameters_string = ''
    if(typeof date_range !== 'undefined'){
        parameters_string = '?date_ini=' + date_range['from'] + '&date_fin=' + date_range['to']
    }
    const response = await fetch('http://localhost:8150/getBuoys' + parameters_string)
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







var dateFormat = "mm/dd/yy"

var from = $( "#from" )
.datepicker({
    defaultDate: "+1w",
    changeMonth: true,
    numberOfMonths: 1
})
.on( "change", function() {
    to.datepicker( "option", "minDate", getDate( this ) );
})

var to = $( "#to" ).datepicker({
    defaultDate: "+1w",
    changeMonth: true,
    numberOfMonths: 1
})
.on( "change", function() {
    from.datepicker( "option", "maxDate", getDate( this ) );
})

function getDate( element ) {
    var date;
    try {
        date = $.datepicker.parseDate( dateFormat, element.value );
    } catch( error ) {
        date = null;
    }

    return date;
}

function transformDate(date){
    return date.slice(5, 7) + '/' + date.slice(8, 10) + '/' + date.slice(0, 4)
}

var date_range

// Init
async function ini_func(){
    const response = await fetch('http://localhost:8150/lastDateRange')
    date_range_ = await response.json()
    date_range = date_range_
    return date_range_
}
ini_func().then(date_range_ => {
    return getBuoysData(date_range_)
})
.then(res => {
    document.getElementById( "from" ).value = transformDate(date_range['from'][0])
    document.getElementById( "to" ).value = transformDate(date_range['to'][0])
    to.datepicker( "option", "minDate", transformDate(date_range['from'][0]))
    from.datepicker( "option", "maxDate", transformDate(date_range['to'][0]))
    displayChart(res['date'], res['temperature'])
})