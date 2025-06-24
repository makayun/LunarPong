#! /bin/bash

cd rules/
curl -LO https://github.com/coreruleset/coreruleset/archive/refs/tags/v4.0.0.tar.gz
tar -xzf v4.0.0.tar.gz
mv coreruleset-4.0.0/* .
rm -rf coreruleset-4.0.0 v4.0.0.tar.gz