var assert = require('assert');
var util = require('util');
var fs = require('fs');
var universityDataFromRenRen = require('./universityDataFromRenRen');

var allUnvData = universityDataFromRenRen.allUnivList;
var chinaUnvHash = {};
for (var i=0; i<allUnvData.length; i++){
  var unvInCountry = allUnvData[i];
  if (unvInCountry.name == '中国'){
    var unvsInProvAry = unvInCountry.provs;
    for(var j=0; j<unvsInProvAry.length; j++){
      var unvsInProv = unvsInProvAry[j];
      var provName = unvsInProv.name;
      var unvAry = unvsInProv.univs;
      var unvNameAryInProv = [];
      for(var k=0; k<unvAry.length; k++){
        var unvItem = unvAry[k];
        var unvName = unvItem.name;
        unvNameAryInProv.push(unvName);
      }//for k
      chinaUnvHash[provName] = unvNameAryInProv;
    }//for j
  }//if unvInCountry.name
}//for i

//console.log(util.inspect(chinaUnvHash,false,100));
var jsonStr = JSON.stringify(chinaUnvHash);
console.log(jsonStr);
fs.writeFileSync("unvDataJson.dat", jsonStr);





