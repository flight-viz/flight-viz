#!/bin/bash

# trim columns
echo "Cutting $1"
cat $1 | csvfilter -f 1,2,3,8,15,16,17,21 > out.csv

# remove canceled 
echo "remove canceled"
csvgrep -c 8 -m 0 out.csv > out1.csv

# remove canceled column
echo "remove candeled column"
cat out1.csv | csvfilter -f 0,1,2,3,4,5,6 > trimmed_$1
