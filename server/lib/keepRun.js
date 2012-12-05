/*
 * keep running a node.js app.
 * Once the app exits for any reason, run it again immediately.
 * Once the keep-run process exit, try to kill the app which is a child process.
 *
when use exec to new process, there are differences when the command text param contains redirection feature.
  if the command text param does contain redirection feature, for example, the command text param="node childProc2.js childNotExit > p3c3.log 2>&1",
  then a /bin/sh process will be run as direct child process. we can see something like below when use ps -eHf.
    and so the killChild function here can not kill the very process that we want to kill, just /bin/sh be killed.
yu1       6446  6442  0 Jul05 pts/1    00:00:02     bash
yu1      22472  6446  0 02:59 pts/1    00:00:00       node parProc3keepRun.js node childProc2.js childNotExit > p3c3.log 2>&1
yu1      22474 22472  0 02:59 pts/1    00:00:00         /bin/sh -c node childProc2.js childNotExit > p3c3.log 2>&1
yu1      22475 22474  0 02:59 pts/1    00:00:00           node childProc2.js childNotExit

  but if the command text param does NOT contain redirection feature, NO /bin/sh process, so here the killChild function can do what we want.

So, we had to use shell scripts to stop all and we need process.title be set as xxxMyProc_yyy, and -f option should be used in ps command.
#PIDS=`ps -ef | grep MyProc | grep -v grep | awk '{print $2}'`
PIDS=`ps -ef | egrep 'MyProc_abc| MyProc_xyz' | egrep -v egrep | awk '{print $2}'`
echo $PIDS
for pid in $PIDS
do
  echo "will kill process,pid="$pid
  kill  $pid
done

 *
 */

var util = require('util');
var child_process = require('child_process');
var path = require('path');


/**
 *
 * @param params - contains cmdTextToRunChild
 *   cmdTextToRunChild is like, for example, node app.js or node app.js > abc.log 2>err.log
 * @returns {KeepRun}
 */
function KeepRun(params) {
  this.childProc = null;
  this.cmdTextToRunChild = params.cmdTextToRunChild;
  this.selfProcInfo = "" + process.title + " pid=" + process.pid;
};//KeepRun

exports.KeepRun = KeepRun;

/**
 *
 * @param signal - can be null
 */
KeepRun.prototype.killChild = function (signal) {
  if (this.childProc != null){
    if (signal){
      this.childProc.kill(signal);
    }else{
      this.childProc.kill();
    }
    this.childProc = null;
  }
};//killChild


KeepRun.prototype._addSignalHandler = function (signal, needExitProc) {
  var self = this;
  process.on(signal, function () {
    var msg = self.selfProcInfo+", process "+signal+" event entered.";
    console.error(msg);
    if (needExitProc){
      self.killChild();
      process.nextTick(function () { process.exit(11111); });
    }
  });//process.on
};//_addSignalHandler

var signalsInfoDefault = [
        {signal:'SIGINT', needExitProc:true},
        {signal:'SIGHUP', needExitProc:false},//...
        {signal:'SIGQUIT', needExitProc:true},
        {signal:'SIGILL', needExitProc:true},
        {signal:'SIGTRAP', needExitProc:false},
        {signal:'SIGABRT', needExitProc:true},
        {signal:'SIGBUS', needExitProc:true},
        {signal:'SIGFPE', needExitProc:true},
        {signal:'SIGKILL', needExitProc:true},
        {signal:'SIGUSR1', needExitProc:true},
        {signal:'SIGSEGV', needExitProc:true},
        {signal:'SIGUSR2', needExitProc:true},
        {signal:'SIGPIPE', needExitProc:true},//...
        {signal:'SIGALRM', needExitProc:true},
        {signal:'SIGTERM', needExitProc:true},
        //{signal:'SIGCHLD', needExitProc:false},//...
        {signal:'SIGSTKFLT', needExitProc:false},
        {signal:'SIGCONT', needExitProc:false},
        {signal:'SIGSTOP', needExitProc:false},
        //{signal:'SIGTSTP', needExitProc:false},
        //{signal:'SIGTTIN', needExitProc:false},
        {signal:'SIGTTOU', needExitProc:false},
        //{signal:'SIGURG', needExitProc:false},
        {signal:'SIGXCPU', needExitProc:true},
        {signal:'SIGXFSZ', needExitProc:true},
        {signal:'SIGVTALRM', needExitProc:true},
        {signal:'SIGPROF', needExitProc:true},
        {signal:'SIGWINCH', needExitProc:false},
        //{signal:'SIGIO', needExitProc:false},
        //{signal:'SIGPOLL', needExitProc:false},
        {signal:'SIGLOST', needExitProc:true},
        {signal:'SIGPWR', needExitProc:true},
        {signal:'SIGSYS', needExitProc:true},
        {signal:'SIGUNUSED', needExitProc:true}
    ];

/**
 *
 * @param signalsInfo - can be null
 */
KeepRun.prototype.addSignalHandlers = function (signalsInfo) {
  var self = this;
  var signalsInfo1 = signalsInfo;
  if (!signalsInfo1)  signalsInfo1 = signalsInfoDefault;
  for (var i=0; i<signalsInfo1.length; i++){
    var signalInfo = signalsInfo1[i];
    self._addSignalHandler(signalInfo.signal, signalInfo.needExitProc);
  }//for
};//addSignalHandlers

KeepRun.prototype.run = function () {
  var self = this;
  var options = {cwd:process.cwd()};
  var childProc = child_process.exec(self.cmdTextToRunChild,options, function (error, stdout, stderr) {
    if (error !== null) {
      console.error(self.selfProcInfo + 'got child error: ' + util.inspect(error,false,100));
    }
    console.log(self.selfProcInfo +' got child stdout: ' + stdout);
    console.error(self.selfProcInfo +' got child stderr: ' + stderr);
  });//exec
  childProc.on('exit', function (code) {
    console.log(self.selfProcInfo +' on child process exit event, exit code=' + code);
    process.nextTick(function () {
      self.run();
    });
  });//on exit
  if(self.childProc != null){
    //self.childProc.kill();
    self.childProc.kill('SIGTERM');
    //the self.childProc may be a proc of "/bin/sh -c", and it will create a child of node
    self.childProc = null;
  }
  self.childProc = childProc;
};//run














