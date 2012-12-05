var util = require('util');

var server = require('./server');
var handy = require("./handy");
var logger = require('./logger');
var config = require('./config');

//if (process.argv.length < 3){
//  console.log("node lib/app.js prod  OR  node lib/app.js dev");
//  return;
//}
//var usage = process.argv[2];
//
//if(usage != 'prod' && usage != 'dev'){
//  console.log("node lib/app.js prod  OR  node lib/app.js dev");
//  return;
//}
//config.config.usage = usage;

process.title = "nodePrettyRichServer"; //to support ps -ef | grep node , ps -ef | grep PrettyRich


var runServer = exports.runServer = function(params){
  var port = config.config.port;
  var securePort = config.config.securePort;
  var s = new server ();
  s.listen(port,securePort);
};//runServer

handy.handleProcessEvents();
runServer();

