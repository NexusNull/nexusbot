#!/bin/bash

# we want to take a name from the user input
# we want to make sure it is a valid file name
# prepend this file with a number from
set -e
time=$(date +%s)
touch ./src/migrations/"$time-$1.sql"