const excel = require("exceljs");
const queries = require('./queries')
const got = require('got');

async function download_excel(req, res){
    let workbook = new excel.Workbook();
    let worksheet = workbook.addWorksheet("Tutorials");

    worksheet.columns = [
    { header: "Data", key: "date", width: 20 },
    { header: "Maximum height", key: "max_height", width: 5 },
    { header: "Significant height", key: "significant_height", width: 5 },
    { header: "Average period", key: "avg_period", width: 5 },
    { header: "Peak Period", key: "peak_period", width: 5 },
    { header: "Direction", key: "direction", width: 5 },
    { header: "Temperature", key: "temperature", width: 5 },
    ];

    // GET Request
    const response = await got('http://localhost:8150/getBuoys');
    //buoys_data = await response.json()
    ret_json = JSON.parse(response.body)


    excel_lst = []
    keys = Object.keys(ret_json)
    for(let i = 0; i < ret_json[keys[0]].length; i++){
        let new_json = {}
        for(let key of keys){
            new_json[key] = ret_json[key][i]
        }
        excel_lst.push(new_json)

    }


    // Add Array Rows
    worksheet.addRows(excel_lst);

    // res is a Stream object
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "boias.xlsx"
      );


    return workbook.xlsx.write(res).then(function () {
        console.log(res)
        res.status(200).end();
    });
}

module.exports = {
    download_excel
}