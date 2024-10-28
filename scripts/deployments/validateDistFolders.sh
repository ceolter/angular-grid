#!/usr/bin/env bash

excluded=("react" "vue3" "angular" "ag-grid-react" "ag-grid-vue3" "ag-grid-angular" "styles" "theming" "locale")
frameworks=("react" "vue3" "angular" "ag-grid-react" "ag-grid-vue3" "ag-grid-angular")

validatePackageJsonExists()
{
  local directory=$1

  if [[ ! -s $directory/package.json  ]]
  then
    echo "ERROR: $directory/package.json empty or does not exist"
    exit 1
  fi
}

validateExpectedDirs()
{
  local directory=$1
  local expected_count=$2

  local count=`find $directory -maxdepth 1 | wc -l | tr -d ' '`;

  if [[ $count -ne $expected_count ]]
  then
    echo "ERROR: Expected $directory to have $expected_count directories but it only has $count"
    exit 1
  fi
}

validateCommonDist()
{
  local directory=$1

  if [[ ! -d "$directory" ]]
  then
    echo "ERROR: $directory doesn't exist"
    exit 1
  fi

  validatePackageJsonExists $directory

  if [[ ! -d "$directory/dist" ]]
  then
    echo "ERROR: $directory/dist doesn't exist"
    exit 1
  fi

  local expected_count=5
  local count=`find "$directory/dist/package" -type f | wc -l | tr -d ' '`;
  if [[ $count -ne $expected_count ]]
  then
    echo "ERROR: $directory/dist/package should have $expected_count artefacts but has $count"
    exit 1
  fi

  local count=`find "$directory/dist/types" -type f | grep .d.ts | wc -l | tr -d ' '`;
  if [[ $count -eq 0 ]]
  then
    echo "ERROR: $directory/dist/types should have at type files - none found"
    exit 1
  fi
}

validateModules()
{
  local packagesDir=$1

  for directory in `ls $packagesDir`;
  do
    if [[ ! ${excluded[@]} =~ $directory ]]
    then
      # a core modules
      validateCommonDist "$packagesDir/$directory/package"
    elif [[ ${frameworks[@]} =~ $directory ]]
    then
      # a framework
      package_dir=$packagesDir/$directory/package

      validatePackageJsonExists $package_dir

      count=`tree $package_dir | grep .d.ts | wc -l | tr -d ' '`;
      if [[ $count -le 5 ]]
      then
        echo "ERROR: $package_dir should have at least 5 artefacts"
        exit 1
      fi
    fi
  done
}

validatePackages()
{
  local packagesDir=$1

  for directory in `ls $packagesDir`;
  do
    if [[ ! ${excluded[@]} =~ $directory ]]
    then
      # a core package
      current_root_dir="$packagesDir/$directory/package"
      validateCommonDist "$current_root_dir"

      current_dist=$current_root_dir/dist
      count=`find $current_dist -maxdepth 1 -name *.js | wc -l | tr -d ' '`
      if [[ $count -ne 4 ]]
      then
        echo "ERROR: $current_dist should have 4 umd files"
        exit 1
      fi
    elif [[ ${frameworks[@]} =~ $directory ]]
    then
      # a framework - here we're just checking there are files in the package as a sanity check
      package_dir=$packagesDir/$directory/package

      validatePackageJsonExists $package_dir

      count=`tree $package_dir | grep .d.ts | wc -l | tr -d ' '`;
      if [[ $count -le 5 ]]
      then
        echo "ERROR: $package_dir should have at least 5 artefacts"
        exit 1
      fi
    fi
  done
}

validateLocale()
{
  local directory=$1
  validatePackageJsonExists $directory

  count=`find "$directory/dist" | wc -l | tr -d ' '`
  if [[ $count -le 30 ]] # just checking files exist
  then
    echo "ERROR: $directory/dist should have files"
    exit 1
  fi
}

# check all expected modules & packages are there
validateExpectedDirs "dist/artifacts/contents/community-modules" 11
validateExpectedDirs "dist/artifacts/contents/enterprise-modules" 21
validateExpectedDirs "dist/artifacts/contents/packages" 7

validateExpectedDirs "dist/artifacts/community-modules" 11
validateExpectedDirs "dist/artifacts/enterprise-modules" 21
validateExpectedDirs "dist/artifacts/packages" 7

validateModules "dist/artifacts/contents/community-modules"
validateModules "dist/artifacts/contents/enterprise-modules"
validatePackages "dist/artifacts/contents/packages"

validateLocale "dist/artifacts/contents/community-modules/locale/package"

