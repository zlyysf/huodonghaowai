PIDS=`ps -ef | egrep 'nodePrettyRich' | egrep -v egrep | awk '{print $2}'`
#PIDS=`ps -ef | grep nodePrettyRich | grep -v grep | awk '{print $2}'`
echo $PIDS
for pid in $PIDS
do
  echo "will kill process,pid="$pid
  kill  $pid
done