#!/usr/bin/env bash

##
# Include dotfiles on file operations
#
shopt -s dotglob

##
# App
#

function main() {
  echo "Upgrading..."

  prepareEnvironment $1

  runTests
}

##
# Prepare the environment
#
function prepareEnvironment() {
  ##
  # Define all variables
  #
  rootDir=.
}

##
# Run tests
#
function runTests() {
  echo "-- Running tests..."

  if [ -f ${rootDir}/composer.lock ]; then
    rm ${rootDir}/composer.lock
  fi

  if [ -d ${rootDir}/vendor ]; then
    rm -rf ${rootDir}/vendor
  fi

  composer install

  vendor/bin/phpcs
}

##
# Run the app
#
main $@
