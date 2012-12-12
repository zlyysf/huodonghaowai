var assert = require('assert');
var util = require('util');
var fs = require('fs');



var provUnvsHash = {};
function addProvUnvToProvUnvsHash(provName,unvName){
  if (provName && unvName){
    var provUnvs = provUnvsHash[provName];
    if (provUnvs) provUnvs.push(unvName);
    else provUnvsHash[provName] = [unvName];
  }
};


var dataFilePath = "./putongGaoxiaoMingdan.txt";
var fileBinContent = fs.readFileSync(dataFilePath);
var fileStrContent = fileBinContent.toString();
var lines = fileStrContent.split(/\n\r?/);

for(var i=0; i<lines.length; i++){
  var line = lines[i];
  line = line.trim();
  if (line){
    var items = line.split(/\s+/);
    var provName = items[0];
    var unvName = items[2];
    addProvUnvToProvUnvsHash(provName,unvName);
    //console.log(provName+"\t"+unvName);
  }
}//for

console.log(util.inspect(provUnvsHash,false,100));
var jsonStr = JSON.stringify(provUnvsHash);
//console.log(jsonStr);
fs.writeFileSync("unvDataJson.dat", jsonStr);







