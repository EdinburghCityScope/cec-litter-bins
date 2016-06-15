// Script which converts a FeatureCollection to an array of Features
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
//var featureCollection = fs.readFileSync('../data/campus-maps.geojson', 'utf8');
//var features = [];
//features = edinburghcityscopeUtils.featureCollectionToFeatureArray(featureCollection);
//var loopbackJson = edinburghcityscopeUtils.featureArrayToLoopbackJson(features);
var ckanDatasetUrl = 'http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/eebdf4f8-5b00-4782-afe5-87df90790ddb/download/citycentre.csv';
var outputCsvFile = './data/litter-bins.csv';
var outputGeoJsonFile = './data/litter-bins.geojson';
console.log("Getting ckan data from URL");
getDataFromURL(ckanDatasetUrl, function(callback){
  console.log("Running data parse");

  var csvString = callback.replace("Site","name").replace("Easting","latitude").replace("Northing","longitude").replace("Type","type");
  // Get the lines
  var lines = csvString.split("\n");
  //Get the first line and convert into field array
  var fields = lines[0].split(",");
  // Convert the result to JSON
  var converter = new Converter({});
    converter.fromString(csvString, function(err,result){
    //Parse the JSON and convert easting/northing to latitude/longitude
    var point;
    for(var i=0; i<result.length;i++)
    {
      point = new OSPoint(result[i].longitude,result[i].latitude);
      result[i].latitude=point.toWGS84().latitude;
      result[i].longitude=point.toWGS84().longitude;
    }
    console.log("Creating CSV");
    json2csv({ data: result, fields: fields }, function(err, csv) {
      if (err) console.log(err);
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

});
