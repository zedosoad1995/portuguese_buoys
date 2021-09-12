var buoys_data
var current_param = "temperature"
var myLineChart
var date_range
var range_option = "all"

var time_range_dict = {
    "day": {"days": 1, "months": 0, "years": 0},
    "week": {"days": 7, "months": 0, "years": 0},
    "month": {"days": 0, "months": 1, "years": 0},
    "3 months": {"days": 0, "months": 3, "years": 0},
    "year": {"days": 0, "months": 0, "years": 1},
}

var chart_proprieties_dict = {
    temperature: {label: "Temperature (°C)"},
    max_height: {label: "Maximum Height (m)"},
    significant_height: {label: "Significant Height (m)"},
    avg_period: {label: "Average Period (s)"},
    peak_period: {label: "Peak Period (s)"},
    direction: {label: "Wave diraction (0° to 360°)"},
}


async function scrapeAndSave(){
    var response = await fetch('http://localhost:8150/scrapeAndSave', {
        method: 'POST',
        //body: myBody, // string or object
        headers: {
          'Content-Type': 'application/json'
        }
    });
    await response.json()
    if(range_option === 'all'){
        response = await fetch('http://localhost:8150/lastDateRange?all')
    }else{
        response = await fetch(getDataRangeQuery())
    }
    date_range = await response.json()
    document.getElementById( "from" ).value = date_range['from'][0].slice(0,10)
    document.getElementById( "to" ).value = date_range['to'][0].slice(0,10)
    to.datepicker( "option", "minDate", getDate( document.getElementById( "from" ) ) )
    from.datepicker( "option", "maxDate", getDate( document.getElementById( "to" ) ) );
    getBuoysDataAndUpdatesChart(date_range)
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

async function getBuoysDataAndUpdatesChart(date_range){
    getBuoysData(date_range).then(res => {
        displayChart(res['date'], res[current_param])
    })
}

function displayChart(x, y, label){

    if(typeof myLineChart !== 'undefined'){
        myLineChart.destroy()
    }

    myLineChart = new Chart("myChart", {
        type: "line",
        data: {
            labels: x,
            datasets: [{
                label: "Total",
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
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: chart_proprieties_dict[current_param]['label']
                    }
                }],
            }
        }
    })
}

function changePlot(param){
    current_param = param
    displayChart(buoys_data['date'], buoys_data[current_param])
}


var dateFormat = "yy-mm-dd"

var from = $( "#from" )
.datepicker({
    defaultDate: "+1w",
    changeMonth: true,
    numberOfMonths: 1
})
.on( "change", function() {
    to.datepicker( "option", "minDate", getDate( this ) );
    //to.datepicker( "option", "dateFormat", "yy-mm-dd" );
    date_range['from'] = this.value
    range_option = "custom"
    document.getElementById("range").value = range_option
    getBuoysDataAndUpdatesChart(date_range)
})



var to = $( "#to" ).datepicker({
    defaultDate: "+1w",
    changeMonth: true,
    numberOfMonths: 1
})
.on( "change", function() {
    from.datepicker( "option", "maxDate", getDate( this ) );
    //from.datepicker( "option", "dateFormat", "yy-mm-dd" );
    date_range['to'] = this.value
    range_option = "custom"
    document.getElementById("range").value = range_option
    getBuoysDataAndUpdatesChart(date_range)
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

function getDataRangeQuery(){
    return 'http://localhost:8150/lastDateRange?days=' + time_range_dict[range_option]['days'] + 
            '&months=' + time_range_dict[range_option]['months'] + '&years=' + time_range_dict[range_option]['years']
}

document.getElementById("range").onchange = rangeChangeListener

async function rangeChangeListener(){
    var value = this.value
    range_option = value
    try {
        const response = await fetch(getDataRangeQuery())
        date_range = await response.json()
        document.getElementById( "from" ).value = date_range['from'][0].slice(0,10)
        document.getElementById( "to" ).value = date_range['to'][0].slice(0,10)
        to.datepicker( "option", "minDate", getDate( document.getElementById( "from" ) ) )
        from.datepicker( "option", "maxDate", getDate( document.getElementById( "to" ) ) );
        getBuoysDataAndUpdatesChart(date_range)
    } catch( error ) {
        if(range_option === 'all'){
            const response = await fetch('http://localhost:8150/lastDateRange?all')
            date_range = await response.json()
            document.getElementById( "from" ).value = date_range['from'][0].slice(0,10)
            document.getElementById( "to" ).value = date_range['to'][0].slice(0,10)
            to.datepicker( "option", "minDate", getDate( document.getElementById( "from" ) ) )
            from.datepicker( "option", "maxDate", getDate( document.getElementById( "to" ) ) );
            getBuoysDataAndUpdatesChart(date_range)
        }
    }
}

// Init
async function ini_func(){
    document.getElementById( "range" ).value = range_option
    if(range_option === 'all'){
        var response = await fetch('http://localhost:8150/lastDateRange?all')
    }else{
        var response = await fetch(getDataRangeQuery())
    }
    date_range = await response.json()
    return date_range
}

ini_func().then(date_range => {
    return getBuoysData(date_range)
})
.then(res => {
    document.getElementById( "from" ).value = transformDate(date_range['from'][0])
    document.getElementById( "to" ).value = transformDate(date_range['to'][0])
    to.datepicker( "option", "minDate", transformDate(date_range['from'][0]))
    from.datepicker( "option", "maxDate", transformDate(date_range['to'][0]))
    from.datepicker( "option", "dateFormat", "yy-mm-dd" );
    to.datepicker( "option", "dateFormat", "yy-mm-dd" );
    displayChart(res['date'], res['temperature'])
})