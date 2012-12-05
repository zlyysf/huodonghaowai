
/*



ps -ef | grep nodePrettyRich
ps aux | grep nodePrettyRich


node parProc3keepRun.js "node childProcSlowExit.js > p3c.log 2>&1"

node parProc3keepRun.js "node childProc2.js childNormalExit > p3c1.log 2>&1"
node parProc3keepRun.js "node childProc2.js childErrorExit > p3c2.log 2>&1"

用exec方式，对于传入的command text在是否重定向时有差别。见后面的说明。
node parProc3keepRun.js "node childProc2.js childNotExit > p3c3.log 2>&1"
node parProc3keepRun.js "node childProc2.js childNotExit"

 */





var util = require('util');
var child_process = require('child_process');
var path = require('path');

var keepRun = require('./keepRun');


var cmdTextToRunChild = "node app.js > /dev/null  2>&1";//MUST NOT "node app.js > /dev/null  2>&1 &"
if (process.argv.length >= 3){
  cmdTextToRunChild = process.argv[2];
}


process.title = "nodePrettyRichKeepRun";//to support ps -ef | grep node , ps -ef | grep PrettyRich

var krObj = new keepRun.KeepRun({cmdTextToRunChild:cmdTextToRunChild});
krObj.addSignalHandlers();
krObj.run();















