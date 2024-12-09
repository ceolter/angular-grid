#!/bin/bash

SOURCE_COMMUNITY_LICENSE=./packages/ag-grid-community/LICENSE.txt

COMMUNITY_DIRS=("ag-grid-angular" "ag-grid-react" "ag-grid-vue3")

for directory in "${COMMUNITY_DIRS[@]}";
do
  cp $SOURCE_COMMUNITY_LICENSE "./packages/$directory"
done
