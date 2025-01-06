#!/bin/bash

SSH_LOCATION=$SSH_FILE

if [ -z "$SSH_LOCATION" ]
then
      echo "\$SSH_LOCATION is not set"
      exit ;
fi

function checkFileExists {
    file=$1
    if ! [[ -f "$file" ]]
    then
        echo "File [$file] doesn't exist - exiting script.";
        exit 1;
    fi
}

checkFileExists $SSH_LOCATION

ssh -i $SSH_LOCATION -p $SSH_PORT $HOST "JIRA_CREDENTIALS=$JIRA_CREDENTIALS && cd /home/ubuntu/jira_reports && ./getChangelog.sh && ./getPipeline.sh"
