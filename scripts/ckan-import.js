// Ckan importer script
var fs = require('fs');
var edinburghcityscopeUtils = require('edinburghcityscope-utils');
var getDataFromURL = edinburghcityscopeUtils.getDataFromURL;
var getCkanApiResponseFields = edinburghcityscopeUtils.getCkanApiResponseFields;
var convertCkanAPIResultsToCityScopeJson = edinburghcityscopeUtils.convertCkanAPIResultsToCityScopeJson;
var parseCkanApiResponseFields = edinburghcityscopeUtils.parseCkanApiResponseFields;
var parseCkanApiResult = edinburghcityscopeUtils.parseCkanApiResult;
var convertCsvDataToGeoJson = edinburghcityscopeUtils.convertCsvDataToGeoJson;
var OSPoint = require('ospoint');
var json2csv = require('json2csv');
var Converter = require("csvtojson").Converter;

var ckanDatasetUrls = ["http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/eebdf4f8-5b00-4782-afe5-87df90790ddb/download/citycentre.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/063970fc-6d40-40c3-9940-e52d1387e858/download/almond.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/43404c7a-8bfe-421f-8774-d88ca50d03f4/download/colintonfairmilehead.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/186dc79a-aec5-4b92-9d9e-216eefaff069/download/corstophinemurrayfield.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/95962ae6-7340-4382-8aa5-70d004b06f8d/download/craigetinnyduddingston.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/08b0fbd1-44e7-4c84-945e-657b7b479fdd/download/drumbrae.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/bea5255a-7d64-4139-b1bd-001c67b24120/download/forth.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/3813b9a2-c6b7-494a-91ce-a1602b48b830/download/fountainbridgecraiglockhart.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/53cbf699-0cdd-4f84-8b72-6293819c9321/download/inverleith.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/34023785-c209-4b7f-bd31-2982f2598840/download/leithwalk.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/4aebb9d6-c744-47a7-a409-913cfe29ffbb/download/libertongilmerton.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/55ca40c3-00c4-40d9-9234-56d60ea39a26/download/meadowsmorningside.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/835df455-bdd3-4882-b68a-308ac3e76668/download/pentlandhills.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/0f55ce41-4b31-4874-9556-80924b4c94d9/download/portobellocraigmillar.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/1b8b01a4-cbb7-4efb-b009-7887d8ae446d/download/sighthillgorgie.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/391fdf75-34e9-4a0e-a950-2a1a10ab6e87/download/southsidenewington.csv","http://data.edinburghopendata.info/dataset/c1d4f48c-c1e8-4159-84a6-8d846ff052ef/resource/8993378b-0224-4b69-bb98-5100bee07f0c/download/leith.csv"];
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
  var callbacks=0;
  for (var u=0;u<ckanDatasetUrls.length;u++)
  {

    getDataFromURL(ckanDatasetUrls[u], function(err, callback, ctx){
      if (err) throw err
      console.log("Fetched " + ctx)

      callbacks++;

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

          // Add result to the overall json if it has correct data
          if (!result[r].latitude||!result[r].longitude)
          {
            console.log("Entry missing latitude or longitude, cannot add:"+JSON.stringify(result[r]));
          }
          else {
            resultJson.push(result[r]);
          }

        }


      });

      if (callbacks==(ckanDatasetUrls.length))
      {
        console.log("doing callback");
        parseCallback(resultJson,fields);
      }

    }, ckanDatasetUrls[u]);

  }

}

parseUrls(ckanDatasetUrls,function(resultJson,fields){
  console.log("Creating CSV");
  json2csv({ data: resultJson, fields: fields }, function(err, csv) {
    if (err)
    {
      console.log("Error thrown on json2csv"+err);
    }
    fs.writeFile(outputCsvFile, csv, function(err) {
      if (err) {
        console.log("Error writing CSV file.");
        throw err;
      }
      console.log('CSV file saved to '+outputCsvFile);
      console.log("Converting CSV to GeoJSON");
      var csvData = fs.readFileSync(outputCsvFile, 'utf8');
      console.log("read csv file for conversion");
      try {
        convertCsvDataToGeoJson(csvData,function(callback){
          fs.writeFile(outputGeoJsonFile,JSON.stringify(callback), function(err){
            if (err) {
              console.log("Error writing GeoJSON file.");
              throw err;
            }
            console.log('GeoJSON file saved to '+outputGeoJsonFile);
          });
        });
      } catch (e) {
        console.log(e);
      } finally {

      }

    });
  });
});
