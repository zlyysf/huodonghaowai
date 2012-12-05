PIDS=`ps -ef | egrep 'nodePrettyRichServer' | egrep -v egrep | awk '{print $2}'`
#PIDS=`ps -ef | grep nodePrettyRichServer | grep -v grep | awk '{print $2}'`
echo $PIDS
for pid in $PIDS
do
  echo "will kill process,pid="$pid
  kill  $pid
done