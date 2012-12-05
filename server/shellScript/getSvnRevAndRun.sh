#!/bin/bash

#PreConditions: svn checkout or svn up command must be run in the machine before, and password should be stored.
#workTopDir should NOT be in windows file system, or else may cause this error "Can't move '.svn/tmp/entries' to '.svn/entries': Permission denied"

#command help: sh getSvnRevAndRun.sh svnUrl revision workTopDir
#such as sh getSvnRevAndRun.sh svn://ysfcentsrv/prettyrich/server/trunk 116 /home/yu1/zly/prsvn2

paramNeedCount=3

if test $# -lt $paramNeedCount
then
    echo must provide $paramNeedCount params, svnUrl revision workTopDir
    echo "such as sh getSvnRevAndRun.sh svn://ysfcentsrv/prettyrich/server/trunk 116 /home/user1/somePath"
    exit
fi
svnUrl=$1
revision=$2
workTopDir=$3

if [ $revision -lt 1 ]
then
    echo "revision must be a positive integer"
    exit
fi

if [ ! -d $workTopDir ]
then
  echo "workTopDir $workTopDir NOT exists"
  exit
fi
cd $workTopDir
workTopDirFullPath=`pwd`
curSvnDirName=svnRev$revision
curSvnDirPath=$workTopDirFullPath/$curSvnDirName
if [ ! -d $curSvnDirName ]
then
  mkdir $curSvnDirName
fi
cd $curSvnDirPath

stopAllScriptFilePath=$curSvnDirPath/shellScript/keepRunStopAll.sh
svnSpecialDirName=.svn
svnCmdRet=12345
if [ -d $svnSpecialDirName ]
then
  if [ -f $stopAllScriptFilePath ]
  then
    sh $stopAllScriptFilePath
  fi
  rm -Rf *
  rm -Rf $svnSpecialDirName
fi
svn checkout $svnUrl -r $revision .
svnCmdRetVal=$?
if [ $svnCmdRetVal -ne 0 ]
then
    echo "svn checkout fail. Maybe you should run svn checkout manually and store the password."
    exit
fi

confLocalConfigFile=$workTopDirFullPath/conf/configLocal.js
svnRevDirLocalConfigFile=$curSvnDirPath/lib/configLocal.js
if [ ! -f $confLocalConfigFile ]
then
  echo "Warning, NO local config file at $confLocalConfigFile. If it is prod server, the local config file should exist."
else
  cp -f $confLocalConfigFile $svnRevDirLocalConfigFile
fi

sh $stopAllScriptFilePath
if [ $? -ne 0 ]
then
    echo "run $stopAllScriptFilePath FAIL. SHOULD CHECK MANUALLY."
    exit
fi

cd $workTopDirFullPath/$curSvnDirName
startScriptFile=shellScript/keepRunStart.sh
sh $startScriptFile
if [ $? -ne 0 ]
then
    echo "run $startScriptFile FAIL. SHOULD CHECK MANUALLY."
    exit
fi









