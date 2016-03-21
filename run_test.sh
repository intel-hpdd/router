#!/usr/bin/env bash
set -ex

. ~/.nvm/nvm.sh

NODE_VERSIONS="
0.10
4
stable
"

for node_version in $NODE_VERSIONS
do
    nvm use $node_version
    rm -rf node_modules
    npm i
    npm run cover -- --reporter=cobertura
    mv ./coverage/cobertura-coverage.xml ../coverage
    mv *results*.xml ../results
done
