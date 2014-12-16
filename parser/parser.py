## Parser for csv data in http://stat-computing.org/dataexpo/2009/
##

import csv 
from collections import defaultdict
import numpy as np
import sys
import json
import os
import datetime
import pprint
import operator
import copy

###############################################################################
################################# UTILITY FUNCS  ##############################
###############################################################################
def save_to_json_file(dic, dictname, filename,year_str):
	d= defaultdict(dict)
	d[dictname] = dic
	if not os.path.exists(year_str):
		os.makedirs(year_str)
	f = open(year_str+'/'+filename+".json","wb")
	json.dump(d,f)

def print_airport_list(airports):
	for x in airports:
		print x

def print_matrix_with_headers(Matrix, airports):
	print "   " , airports
	for x,i in enumerate(Matrix):
		print airports[x],i

def pretty_print_dict(delays):
	for origin_dict in delays:
		print origin_dict 
		for destination_dict in delays[origin_dict]:
			print " ~~~~" ,destination_dict, delays[origin_dict][destination_dict]


###############################################################################
############################ AGGREGATOR LOGIC #################################
###############################################################################
def aggregate_row_in_dict(row,origin_dict):
	origin = row["Origin"]
	destination = row["Dest"]
	delay = float(row["DepDelay"])

	if origin in origin_dict: # 2th+ time we see an origin.
		if destination in origin_dict[origin]: # 2th+ time we see a destination. 
			origin_dict[origin][destination][0] += delay
			origin_dict[origin][destination][1] += 1  #count of how many flights in this path	
		else:  #else, if the destination has not been within found, add  new destination normally
			origin_dict[origin][destination] = [delay,1] #one, because this is the first time path has been found.
	else: #first time we see an origin and a destination.
		destination_dict = defaultdict(list)
		destination_dict[destination] = [delay,1]
		origin_dict[origin] = destination_dict
	return origin_dict

###############################################################################
############ AVERAGE DELAY per AIRPORT - Aggregated per YEAR ##################
###############################################################################

# Returns Adj List in the format { 'ORIGIN' : {'DEST': [10,10], 'DEST2':[1,2] }, 'ORIGIN2' : {..} }
def get_aggregate_delay_and_flight_count(filename):
	reader = csv.DictReader(open(filename))

	delays = defaultdict(list)
	for row in reader:
		delays = aggregate_row_in_dict(row,delays)
	return delays

def calc_average_in_delays(delays):
	for origin_dict in delays:
		for destination_dict in delays[origin_dict]:
			aggregate_delay = delays[origin_dict][destination_dict][0]
			delays[origin_dict][destination_dict][0] = float(aggregate_delay) / float(delays[origin_dict][destination_dict][1])
	return delays

def get_airports(delays):
	airports = []
	for i in delays:
		if i not in airports:
			airports = airports + [i]
		for j in delays[i]:
			if j not in airports:
				airports = airports + [j]
	return airports

def convert_to_delay_matrix(delays,airports):
	Matrix = [[0 for x in range(len(airports))] for x in range(len(airports))] 
	for i in airports:
		for j in airports:
			if i  in delays:
				if delays[i][j]:
					Matrix[airports.index(i)][airports.index(j)] = delays[i][j][0]

	return Matrix

def convert_to_flight_count_matrix(delays,airports):
	Matrix = [[0 for x in range(len(airports))] for x in range(len(airports))] 
	for i in airports:
		for j in airports:
			if i  in delays:
				if delays[i][j]:
					Matrix[airports.index(i)][airports.index(j)] = delays[i][j][1]

	return Matrix

def get_average_delays_dict(filename):
	aggregate_delays = get_aggregate_delay_and_flight_count(filename)
	average_delays = calc_average_in_delays(aggregate_delays)
	return average_delays

def save_airpots(airports, year_str):
	filename = year_str+"_airports"
	save_to_json_file(airports,"airports",filename,year_str)

def get_all_matrix(average_delays,airports):
	delay_matrix = convert_to_delay_matrix(average_delays,airports)
	flight_count_matrix = convert_to_flight_count_matrix(average_delays,airports)
	d = defaultdict(dict)
	d["delay_matrix"] = delay_matrix
	d["flight_count_matrix"] =  flight_count_matrix
	return d

def save_all_matrix(year_str,average_delays,airports):
	filename = year_str + "_all_matrix"
	delay_matrix = convert_to_delay_matrix(average_delays,airports)
	flight_count_matrix = convert_to_flight_count_matrix(average_delays,airports)
	
	d = defaultdict(dict)
	d["delay_matrix"] = delay_matrix
	d["flight_count_matrix"] =  flight_count_matrix
	if not os.path.exists(year_str):
		os.makedirs(year_str)
	f = open(year_str+'/'+filename+".json","wb")
	json.dump(d,f)

###############################################################################
######  AVERAGE DELAY per AIRPORT - Aggregated per WEEK in a year #############
###############################################################################
def organize_dict_by_week(year, filename):
	reader = csv.DictReader(open(filename))
	delays_by_week = defaultdict(dict)
	for row in reader:
		month = int(row["Month"])
		day = int(row["DayofMonth"])
		week_num = datetime.date(int(year),month,day).isocalendar()[1]
		if week_num in delays_by_week:
			delays_by_week[week_num] = aggregate_row_in_dict(row,delays_by_week[week_num])
		else:
			d  = defaultdict(list)
			delays_by_week[week_num] = aggregate_row_in_dict(row,d)

	return delays_by_week

def best_organize_dict_by_week(year, filename, airports):
	reader = csv.DictReader(open(filename))
	delays_by_week = defaultdict(dict)
	for row in reader:
		#only care about best airports.
		if row["Origin"] in airports and row["Dest"] in airports:
			month = int(row["Month"])
			day = int(row["DayofMonth"])
			week_num = datetime.date(int(year),month,day).isocalendar()[1]
			if week_num in delays_by_week:
				delays_by_week[week_num] = aggregate_row_in_dict(row,delays_by_week[week_num])
			else:
				d  = defaultdict(list)
				delays_by_week[week_num] = aggregate_row_in_dict(row,d)

	return delays_by_week

def calc_average_in_delays_by_week(delays_by_week):
	for week in delays_by_week:
		for origin_dict in delays_by_week[week]:
			for destination_dict in delays_by_week[week][origin_dict]:
				aggregate_delay = delays_by_week[week][origin_dict][destination_dict][0]
				delays_by_week[week][origin_dict][destination_dict][0] = float(aggregate_delay) / float(delays_by_week[week][origin_dict][destination_dict][1])
	return delays_by_week

def convert_to_delay_matrixes_by_week(delays_by_week,airports):
	delay_matrixes = defaultdict(list)
	for week in delays_by_week:
		delay_matrixes[week] = convert_to_delay_matrix(delays_by_week[week],airports)
	
	return delay_matrixes

def convert_to_flight_count_matrixes_by_week(delays_by_week,airports):
	flight_count_matrixes = defaultdict(list)
	for week in delays_by_week:
		flight_count_matrixes[week] = convert_to_flight_count_matrix(delays_by_week[week],airports)
	
	return flight_count_matrixes

def save_week_matrix(year_str,delays_by_week,airports):
	delay_matrixes_by_week = convert_to_delay_matrixes_by_week(delays_by_week,airports)
	flight_count_matrixes_by_week = convert_to_flight_count_matrixes_by_week(delays_by_week,airports)
	for week in delays_by_week:
		filename = year_str+"_week"+str(week)+"_matrix"
		d = defaultdict(dict)
		d["delay_matrix"] = delay_matrixes_by_week[week]
		d["flight_count_matrix"] =  flight_count_matrixes_by_week[week]
		if not os.path.exists(year_str):
			os.makedirs(year_str)
		f = open(year_str+'/'+filename+".json","wb")
		json.dump(d,f)

###############################################################################
################## AVERAGE DELAY per DAY - AGGREGATED BY DAY ##################
###############################################################################
def organize_dict_by_day(year, filename):
	reader = csv.DictReader(open(filename))
	delays_by_day = defaultdict(dict)
	for row in reader:
		month = int(row["Month"])
		day = int(row["DayofMonth"])
		day_num = datetime.date(int(year),month,day).timetuple().tm_yday
		if day_num in delays_by_day:
			delays_by_day[day_num] = aggregate_row_in_dict(row,delays_by_day[day_num])
		else:
			d  = defaultdict(list)
			delays_by_day[day_num] = aggregate_row_in_dict(row,d)

	return delays_by_day

def best_organize_dict_by_day(year, filename,airports):
	reader = csv.DictReader(open(filename))
	delays_by_day = defaultdict(dict)
	for row in reader:
		if row["Origin"] in airports and row["Dest"] in airports:
			month = int(row["Month"])
			day = int(row["DayofMonth"])
			day_num = datetime.date(int(year),month,day).timetuple().tm_yday
			if day_num in delays_by_day:
				delays_by_day[day_num] = aggregate_row_in_dict(row,delays_by_day[day_num])
			else:
				d  = defaultdict(list)
				delays_by_day[day_num] = aggregate_row_in_dict(row,d)

	return delays_by_day

def calc_average_in_delays_by_day(delays_by_day):
	for day in delays_by_day:
		for origin_dict in delays_by_day[day]:
			for destination_dict in delays_by_day[day][origin_dict]:
				aggregate_delay = delays_by_day[day][origin_dict][destination_dict][0]
				delays_by_day[day][origin_dict][destination_dict][0] = float(aggregate_delay) / float(delays_by_day[day][origin_dict][destination_dict][1])
	return delays_by_day

def save_total_avg_delay_by_day(delays_by_day,year_str):
	a = {}
	for day in delays_by_day:
		delay = 0; 
		count = 0; 
		for origin_dict in delays_by_day[day]:
			for destination in delays_by_day[day][origin_dict]:
				delay += delays_by_day[day][origin_dict][destination][0]
				count += delays_by_day[day][origin_dict][destination][1]
				a[day] =[delay,count]
	# calc avg
	b = {}
	for day in a:
		aggregate_delay = a[day][0]
		flight_count = a[day][1]
		avg_delay = float(aggregate_delay) / float(flight_count)
		b[day] = avg_delay
	#format it 
	c = {}
	for day in b:
		date = datetime.datetime(int(year_str), 1, 1) + datetime.timedelta(day - 1)
		c[date.strftime('%Y-%m-%d')] = b[day]

	save_to_json_file(c,"avg_delay_by_day",year_str+"_day_all",year_str )


###############################################################################
######### AVERAGE DELAY per AIRPORT per DAY - AGGREGATED BY DAY  ############## 
###############################################################################

def xxx_organize_dict_by_day(row, delays_by_day,year):
	month = int(row["Month"])
	day = int(row["DayofMonth"])
	day_num = datetime.date(int(year),month,day).timetuple().tm_yday
	if day_num in delays_by_day:
		delays_by_day[day_num] = aggregate_row_in_dict(row,delays_by_day[day_num])
	else:
		d  = {}
		delays_by_day[day_num] = aggregate_row_in_dict(row,d)

	return delays_by_day


def best_organize_dict_by_day_by_airport(filename,airports,year):
	reader = csv.DictReader(open(filename))
	delays_by_day_by_airport = defaultdict(dict)
	for row in reader:
		if row["Origin"] in airports and row["Dest"] in airports:
			month = int(row["Month"])
			day = int(row["DayofMonth"])
			
			origin = row["Origin"] 
			dest = row["Dest"]
			if origin in delays_by_day_by_airport:
				delays_by_day_by_airport[origin] = xxx_organize_dict_by_day(row,delays_by_day_by_airport[origin],year)
			else:
				d = {}
				delays_by_day_by_airport[origin] = xxx_organize_dict_by_day(row,d,year)

	return delays_by_day_by_airport


def xxx_save_total_avg_delay_by_day(delays_by_day,airportName,year_str):
	a = {}
	for day in delays_by_day:
		delay = 0; 
		count = 0; 
		for origin_dict in delays_by_day[day]:
			for destination in delays_by_day[day][origin_dict]:
				delay += delays_by_day[day][origin_dict][destination][0]
				count += delays_by_day[day][origin_dict][destination][1]
				a[day] =[delay,count]
	# calc avg
	b = {}
	for day in a:
		aggregate_delay = a[day][0]
		flight_count = a[day][1]
		avg_delay = float(aggregate_delay) / float(flight_count)
		b[day] = avg_delay
	#format it 
	c = {}
	for day in b:
		date = datetime.datetime(int(year_str), 1, 1) + datetime.timedelta(day - 1)
		c[date.strftime('%Y-%m-%d')] = b[day]

	save_to_json_file(c,"avg_delay_by_day",year_str+"_day_"+airportName,year_str)

def save_total_avg_delay_by_day_by_airport(delays_by_day_by_airport,year_str):
	for airport in delays_by_day_by_airport:
		xxx_save_total_avg_delay_by_day(delays_by_day_by_airport[airport],airport,year_str)
###############################################################################
############################### DEPRECATED STUFFF  ############################
###############################################################################
def get_relative_matrix(Matrix,airports):
	max_val = -sys.maxint
	for x in range(0,len(Matrix)):
		for y in range(0,len(Matrix)):
			if Matrix[x][y] > max_val:
				max_val = Matrix[x][y]
	for x in range(0,len(Matrix)):
		for y in range(0,len(Matrix)):
			Matrix[x][y] = float(Matrix[x][y])/float(max_val)
	print_final_matrix(Matrix, airports)

def old_stupid_parser(filename):
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

	# print_airport_list(airports)
	# print_final_matrix(Matrix,airports)
	# get_relative_matrix(Matrix,airports)

# Returns Adj List in the format { 'ORIGIN' : {'DEST': [10,10], 'DEST2':[1,2] } }
def OLD_get_avg_delays_for_all_airports(filename):
	reader = csv.DictReader(open(filename))

	delays = defaultdict(list)
	for row in reader:
		origin = row["Origin"]
		destination = row["Dest"]
		delay = row["DepDelay"]

		if origin in delays: # means the key probably has something already
			if destination in delays[origin]: # check if origin already has this destination.
				# if list already has this destination, then aggregate it. 
				list_to_modify = delays[origin]  # get the list to be modified
				destination_index = list_to_modify.index(destination) + 1 # the the destinattion index, plus one , because value follows it. 
				old_delay_value = list_to_modify[destination_index] 
				new_delay_value = old_delay_value + int(delay)  # add new and old
				#put new back in the list
				list_to_modify[destination_index] = new_delay_value
				
				#put new , modified list back 
				delays[origin] = list_to_modify
			else:  #else, if the destination has not been within found, add  new destination normally
				delays[origin] =  delays[origin] + [destination, int(delay)]
		else:
			delays[origin] = [destination, int(delay)]

	return delays


###############################################################################
################################### FILTERING   ###############################
###############################################################################
# 100 best airports from matrix.
def filter_to_best_airports(top_number,average_delays,airports):
	average_delays_copy = copy.deepcopy(average_delays)
	airports_copy = copy.deepcopy(airports)
	d = get_all_matrix(average_delays_copy,airports_copy)

	aggregate_traffic_by_airport = {}

	for i in range(0,len(airports_copy)):     #must fix this. counting. 
		for j in range(0,len(airports_copy)): 
			if airports_copy[i] not in aggregate_traffic_by_airport:
				aggregate_traffic_by_airport[airports_copy[i]] = d["flight_count_matrix"][i][j]
			else: 
				aggregate_traffic_by_airport[airports_copy[i]] += d["flight_count_matrix"][i][j]
			if airports_copy[j] not in aggregate_traffic_by_airport:
				aggregate_traffic_by_airport[airports_copy[j]] = d["flight_count_matrix"][i][j]
			else:
				if airports_copy[j] != airports_copy[i]:
					aggregate_traffic_by_airport[airports_copy[j]] += d["flight_count_matrix"][i][j]


	# sort by value
	sorted_by_traffic = sorted(aggregate_traffic_by_airport.items(), key=operator.itemgetter(1), reverse=True)
	top_list = []
	for i,j in sorted_by_traffic[:top_number]:
		top_list.append(i)
	# sort by alphabet
	top_list = sorted(top_list)
	#create a new average_delays
	new_average_delay = {}
	for origin in average_delays:
		if origin in top_list:
			dest_dict = {}
			for destination in average_delays[origin]:
				if destination in top_list:
					if average_delays[origin][destination]:
						dest_dict[destination] =  average_delays[origin][destination]
						new_average_delay[origin] = dest_dict 

	return {'delays':new_average_delay,'airports':top_list}

###############################################################################
################################### MAIN  #####################################
###############################################################################
def parse(filename,year_str,top):
	# Neeeded
	average_delays = get_average_delays_dict(filename)
	airports = get_airports(average_delays)

	# filter by best / top
	top_airports_number = top
	if top_airports_number > len(airports):
		print "error, choose lower top number"

	result = filter_to_best_airports(top_airports_number,average_delays,airports)
	best_average_delays = result['delays']
	best_airports = result['airports']

	# yearly
	save_airpots(best_airports,year_str)
	save_all_matrix(year_str,average_delays,best_airports)

	# weekly
	# delays_by_week = organize_dict_by_week(year_str,filename)
	delays_by_week = best_organize_dict_by_week(year_str,filename,best_airports)
	delays_by_week = calc_average_in_delays_by_week(delays_by_week)
	save_week_matrix(year_str,delays_by_week,best_airports)

	#daily
	# delays_by_day = organize_dict_by_day(year_str,filename)
	delays_by_day = best_organize_dict_by_day(year_str, filename, best_airports)
	delays_by_day = calc_average_in_delays_by_day(delays_by_day)
	save_total_avg_delay_by_day(delays_by_day,year_str)

	## daily, by airport.  
	delays_by_day_by_airport = best_organize_dict_by_day_by_airport(filename,best_airports,year_str)
	save_total_avg_delay_by_day_by_airport(delays_by_day_by_airport,year_str)

def parse_all():
	print "parsing 2008.csv"
	parse("raw_data/trimmed_2008.csv","2008",100)
	print "parsing 2007.csv"
	parse("raw_data/trimmed_2007.csv","2007",100)
	print "parsing 2006.csv"
	parse("raw_data/trimmed_2006.csv","2006",100)
	print "parsing 2005.csv"
	parse("raw_data/trimmed_2005.csv","2005",100)
	print "parsing 2004.csv"
	parse("raw_data/trimmed_2004.csv","2004",100)
	print "parsing 2004.csv"
	parse("raw_data/trimmed_2004.csv","2004",100)
	print "parsing 2003.csv"
	parse("raw_data/trimmed_2003.csv","2003",100)
	print "parsing 2002.csv"
	parse("raw_data/trimmed_2002.csv","2002",100)
	print "parsing 2001.csv"
	parse("raw_data/trimmed_2001.csv","2001",100)
	print "parsing 2000.csv"
	parse("raw_data/trimmed_2000.csv","2000",100)
	print "parsing 1999.csv"
	parse("raw_data/trimmed_1999.csv","1999",100)
	print "parsing 1998.csv"
	parse("raw_data/trimmed_1998.csv","1998",100)
	print "parsing 1997.csv"
	parse("raw_data/trimmed_1997.csv","1997",100)
	print "parsing 1996.csv"
	parse("raw_data/trimmed_1996.csv","1996",100)
	print "parsing 1995.csv"
	parse("raw_data/trimmed_1995.csv","1995",100)
	print "parsing 1994.csv"
	parse("raw_data/trimmed_1994.csv","1994",100)
	print "parsing 1993.csv"
	parse("raw_data/trimmed_1993.csv","1993",100)
	print "parsing 1992.csv"
	parse("raw_data/trimmed_1992.csv","1992",100)
	print "parsing 1991.csv"
	parse("raw_data/trimmed_1991.csv","1991",100)
	print "parsing 1990.csv"
	parse("raw_data/trimmed_1990.csv","1990",100)
	print "parsing 1989.csv"
	parse("raw_data/trimmed_1989.csv","1989",100)
	print "parsing 1988.csv"
	parse("raw_data/trimmed_1988.csv","1988",100)
	print "parsing 1987.csv"
	parse("raw_data/trimmed_1987.csv","1987",100)


# parse_all()
parse("raw_data/test.csv","2000",10)
