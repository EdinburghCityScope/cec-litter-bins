// Ckan importer script
var fs = require('fs');
var edinburghcityscopeUtils = require('edinburghcityscope-utils');
var getDataFromURL = edinburghcityscopeUtils.getDataFromURL;
var getCkanApiResponseFields = edinburghcityscopeUtils.getCkanApiResponseFields;
var convertCkanAPIResultsToCityScopeJson = edinburghcityscopeUtils.convertCkanAPIResultsToCityScopeJson;
var parseCkanApiResponseFields = edinburghcityscopeUtils.parseCkanApiResponseFields;
var parseCkanApiResult = edinburghcityscopeUtils.parseCkanApiResult;
var convertCsvDataToGeoJson = edinburghcityscopeUtils.convertCsvDataToGeoJson;
var csv2geojson = require('csv2geojson');
var OSPoint = require('ospoint');
var json2csv = require('json2csv');
var Converter = require("csvtojson").Converter;

var ckanDatasetUrls = ["http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/eebdf4f8-5b00-4782-afe5-87df90790ddb/download/citycentre.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/063970fc-6d40-40c3-9940-e52d1387e858/download/almond.csv"];
var outputCsvFile = './data/litter-bins.csv';
var outputGeoJsonFile = './data/litter-bins.geojson';

console.log("Getting ckan data from URLs");

var lines;
var csvString;
var converter;

var point;
function parseUrls(ckanDatasetUrls,parseCallback)
{
  var fields="";
  var resultJson = [];
  for (var u=0;u<ckanDatasetUrls.length;u++)
  {

    console.log(ckanDatasetUrls[u]);
    getDataFromURL(ckanDatasetUrls[u], function(callback){
      converter = new Converter({});
      
      csvString = callback;

      csvString = csvString.replace("Site","name").replace("Easting","latitude").replace("Northing","longitude").replace("Type","type");

      // If we haven't set up the fields yet, do that now
      if (!fields||fields=="")
      {
        console.log("Setting CSV fields");
        // Get the lines
        lines = csvString.split("\n");
        //Get the first line and convert into field array
        fields = lines[0].split(",");
      }

      // Convert the result to JSON
      converter.fromString(csvString, function(err,result){

        for(var r=0; r<result.length;r++)
        {
          // Convert the easting/northing to latitude/longitude
          point = new OSPoint(result[r].longitude,result[r].latitude);
          result[r].latitude=point.toWGS84().latitude;
          result[r].longitude=point.toWGS84().longitude;
          // Add result to the overall json
          resultJson.push(result[r]);
        }

        if (u==ckanDatasetUrls.length)
        {
          parseCallback(resultJson,fields);
        }
      });

    });

  }

}

parseUrls(ckanDatasetUrls,function(resultJson,fields){
  console.log("Creating CSV");
  console.log(fields);
  json2csv({ data: resultJson, fields: fields }, function(err, csv) {
    if (err) console.log("Error thrown on json2csv"+err);
    fs.writeFile(outputCsvFile, csv, function(err) {
      if (err) throw err;
      console.log('CSV file saved to '+outputCsvFile);
      console.log("Converting CSV to GeoJSON");
      var csvData = fs.readFileSync(outputCsvFile, 'utf8');
      convertCsvDataToGeoJson(csvData,function(callback){
        fs.writeFile(outputGeoJsonFile,JSON.stringify(callback), function(err){
          if (err) throw err;
          console.log('GeoJSON file saved to '+outputGeoJsonFile);
        });
      });
    });
  });
});
