import csv 
from collections import defaultdict
import numpy as np
import sys

filename = 'test2.csv'

reader = csv.DictReader(open(filename))
reader2 = csv.DictReader(open(filename)) # reader gets consume
 

 # Get List of Airports
airports = []
for row in reader:
	if row["Origin"] not in airports:
		airports.append(row["Origin"])
	if row["Dest"] not in airports:
		airports.append(row["Dest"])

# Initialize Matrix
Matrix = [[0 for x in range(len(airports))] for x in range(len(airports))] 

# Populate Matrix 
count=0
for row in reader2:
	count +=1
	# print "processing LINE:", count
	origin = row["Origin"]
	destination = row["Dest"]
	for i in range(0,len(airports)):
		for j  in range(0,len(airports)):
			if origin == airports[i] and destination == airports[j]:
				Matrix[i][j] += int(row["DepDelay"])


def print_airport_list(airports):
	for x in airports:
		print x

def print_matrix_with_headers(Matrix, airports):
	print "   " , airports
	for x,i in enumerate(Matrix):
		print airports[x],i

def print_final_matrix(Matrix, airports):
	sys.stdout.write('[')
	for x,i in enumerate(Matrix):
		if x == len(Matrix) -1:
			print(i),
		else:
			print(i),
			sys.stdout.write(',')
	sys.stdout.write(']')
	print ""

def get_relative_matrix(Matrix):
	max_val = -sys.maxint
	for x in range(0,len(Matrix)):
		for y in range(0,len(Matrix)):
			if Matrix[x][y] > max_val:
				max_val = Matrix[x][y]
	for x in range(0,len(Matrix)):
		for y in range(0,len(Matrix)):
			Matrix[x][y] = float(Matrix[x][y])/float(max_val)
	print_final_matrix(Matrix, airports)


# print_airport_list(airports)
# print_final_matrix(Matrix,airports)
get_relative_matrix(Matrix)


