#!/bin/bash

set -eu

if [ ! -d ../ag-charts/ ] ; then
    echo "Didn't find an adjacent ag-charts checkout, please run the following command in the parent directory:"
    echo "git clone https://github.com/ag-grid/ag-charts.git"
    exit 1
fi

echo "Removing previous links of ag-charts-* packages..."
find ./node_modules ./packages/*/node_modules -name ag-charts-\* -depth 1 | xargs rm -rf

echo "Linking node_modules to local installs..."
packages=(
    ag-charts-angular
    ag-charts-vue3
    ag-charts-react
    ag-charts-types
    ag-charts-locale
    ag-charts-community
    ag-charts-enterprise
)
for name in ${packages[@]} ; do
    ln -s $(readlink -f $(pwd)/..)/ag-charts/packages/${name}/ ./node_modules/${name}
done

echo "Applying configuration patch..."
git apply ./scripts/setupLocalDeps.patch
