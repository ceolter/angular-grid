#!/bin/bash

set -eu

echo "Removing previous links of ag-charts-* packages..."
find ./node_modules ./packages/*/node_modules -name ag-charts-\* -type l -depth 1 | xargs rm -rf

echo "Reinstalling latest ag-charts-* versions."
npm run bootstrap --force

echo "Reverting configuration patch..."
git apply -R ./scripts/setupLocalDeps.patch
