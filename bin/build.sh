#!/usr/bin/env bash

rm -rf dist
babel -d dist "source/**/*.js" "test/**/*.js"

for i in $( find ./source -type f ); do
  cp $i ./dist/$i.flow
done
