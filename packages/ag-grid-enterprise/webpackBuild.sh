#!/usr/bin/env bash

array=("production" "staging")

if [[ ${array[@]} =~ "$NX_TASK_TARGET_CONFIGURATION" ]]
then
  echo "Building PRODUCTION UMDs for $NX_TASK_TARGET_PROJECT"
  npx webpack --env production --env minify --env styles       --env entry=./src/main-umd-styles.ts &
  npx webpack --env production              --env styles       --env entry=./src/main-umd-styles.ts &
  npx webpack --env production --env minify --env styles=false --env entry=./src/main-umd-noStyles.ts &
  npx webpack --env production              --env styles=false --env entry=./src/main-umd-noStyles.ts &

  wait
else
  echo "Building DEVELOPMENT UMDs for $NX_TASK_TARGET_PROJECT"
  npx webpack
fi

