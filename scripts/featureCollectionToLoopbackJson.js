// Script which converts a FeatureCollection to an array of Features
var fs = require('fs');
var edinburghcityscopeUtils = require('edinburghcityscope-utils');
var featureCollection = fs.readFileSync('./data/litter-bins.geojson', 'utf8');
var features = [];
features = edinburghcityscopeUtils.featureCollectionToFeatureArray(featureCollection);
var loopbackJson = edinburghcityscopeUtils.featureArrayToLoopbackJson(features);

var outputFile = './data/litter-bins-loopback.json';
fs.writeFile(outputFile,JSON.stringify(loopbackJson),(err) => {
  if (err) throw err;
  console.log('../data/litter-bins-loopback.json created');
});
