#!/bin/bash

##########################################################################################
## This script is meant to live on ag-grid.com and be invoked by someone doing a deployment
## It's in a separate script as occasionally multiple "ssh -i" from a devs machine would
## result in some of the commands being rejected. Extracting these multiple commands into one
## should alleviate that
##########################################################################################

if [ "$#" -lt 1 ]
  then
    echo "You must supply a timestamp"
    echo "For example: ./scripts/release/switchReleaseRemote.sh 20191210"
    exit 1
fi

TIMESTAMP=$1

# create a backup of public_html ONLY if it doesn't already exist - this handles the situation where multiple deployments are done on the same day
# in that case we only want to backup the original public_html, not the subsequent attempts (for rollback)
if [ -d "public_html_$TIMESTAMP" ];
then
  # if this block is run then it means that this is not the first deployment done today
  echo "public_html_$TIMESTAMP already exists - not backing up existing public_html"

  # move archives from the previous "live" to the original public_html backup: public_html_$TIMESTAMP
  # this will in turn be moved to the new public_html down below
  mv public_html/archive public_html_$TIMESTAMP/archive

  # it's unlikely we'd need the version we're replacing, but just in case
  CURRENT_BACKUP_DIR="public_html_`date '+%Y%m%d_%H%M'`"
  mv public_html $CURRENT_BACKUP_DIR
else
  mv public_html public_html_$TIMESTAMP
fi

mv public_html_tmp public_html

# we don't copy the archives - it's too big
mv public_html_$TIMESTAMP/archive public_html/
