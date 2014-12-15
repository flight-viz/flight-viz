import csv 
from collections import defaultdict
import numpy as np
import sys
import json
import os
import datetime
import pprint

###################################################################################
################################# UTILITY FUNCS  ##################################
###################################################################################
def save_to_json_file(dic, dictname, filename):
	d= defaultdict(dict)
	d[dictname] = dic
	if not os.path.exists(fileyear):
		os.makedirs(fileyear)
	f = open(fileyear+'/'+filename+".json","wb")
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


####################################################################################
############################ important functions ####################################
####################################################################################
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

####################################################################################
##################  DELAYS FOR ALL AIRPPORT COMBOS AGG YEARLY ######################
####################################################################################

# Returns Adj List in the format { 'ORIGIN' : {'DEST': [10,10], 'DEST2':[1,2] }, 'ORIGIN2' : {..} }
def get_aggregate_delay_and_flight_count(filename):
	reader = csv.DictReader(open(filename))

	delays = defaultdict(list)
	for row in reader:
		delays = aggregate_row_in_dict(row,delays)
		# origin = row["Origin"]
		# destination = row["Dest"]
		# delay = float(row["DepDelay"])

		# if origin in delays: # 2th+ time we see an origin.
		# 	if destination in delays[origin]: # 2th+ time we see a destination. 
		# 		delays[origin][destination][0] += delay
		# 		delays[origin][destination][1] += 1  #count of how many flights in this path	
		# 	else:  #else, if the destination has not been within found, add  new destination normally
		# 		delays[origin][destination] = [delay,1] #one, because this is the first time path has been found.
		# else: #first time we see an origin and a destination.
		# 	destination_dict = defaultdict(list)
		# 	destination_dict[destination] = [delay,1]
		# 	delays[origin] = destination_dict

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

def save_airpots(year_str, average_delays):
	filename = year_str+"_airports"
	airports = get_airports(average_delays)
	save_to_json_file(airports,"airports",filename)

def save_delay_matrix(year_str, average_delays,airports):
	filename = year_str + "_all_delay_matrix"
	delay_matrix = convert_to_delay_matrix(average_delays,airports)
	save_to_json_file(delay_matrix,"delay_matrix",filename)

def save_flight_count_matrix(year_str,average_delays,airports):
	filename = year_str + "_all_flight_count_matrix"
	flight_count_matrix = convert_to_flight_count_matrix(average_delays,airports)
	save_to_json_file(flight_count_matrix,"flight_count",filename)



####################################################################################
##################  DELAYS FOR ALL AIRPPORT COMBOS AGG WEEKLY ######################
####################################################################################
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

def save_delay_matrixes_by_week(fileyear,delays_by_week,airports):
	delay_matrixes_by_week = convert_to_delay_matrixes_by_week(delays_by_week,airports)
	for week in delays_by_week:
		filename = fileyear+"_week"+str(week)+"_delay_matrix"
		save_to_json_file(delay_matrixes_by_week[week],"delay_matrix",filename)

def save_flight_count_matrixes_by_week(fileyear,delays_by_week, airports):
	flight_count_matrixes_by_week = convert_to_flight_count_matrixes_by_week(delays_by_week,airports)
	for week in delays_by_week:
		filename = fileyear+"_week"+str(week)+"_flight_count_matrix"
		save_to_json_file(flight_count_matrixes_by_week[week],"flight_count_matrix",filename)

####################################################################################
##################  DELAYS FOR ALL AIRPPORT COMBOS AGG DAILY ######################
####################################################################################
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

def calc_average_in_delays_by_day(delays_by_day):
	for day in delays_by_day:
		for origin_dict in delays_by_day[day]:
			for destination_dict in delays_by_day[day][origin_dict]:
				aggregate_delay = delays_by_day[day][origin_dict][destination_dict][0]
				delays_by_day[day][origin_dict][destination_dict][0] = float(aggregate_delay) / float(delays_by_day[day][origin_dict][destination_dict][1])
	return delays_by_day

def convert_to_delay_matrixes_by_day(delays_by_day,airports):
	delay_matrixes = defaultdict(list)
	for day in delays_by_day:
		delay_matrixes[day] = convert_to_delay_matrix(delays_by_day[day],airports)
	
	return delay_matrixes

def convert_to_flight_count_matrixes_by_day(delays_by_day,airports):
	flight_count_matrixes = defaultdict(list)
	for day in delays_by_day:
		flight_count_matrixes[day] = convert_to_flight_count_matrix(delays_by_day[day],airports)
	
	return flight_count_matrixes

def save_delay_matrixes_by_day(fileyear,delays_by_day,airports):
	delay_matrixes_by_day = convert_to_delay_matrixes_by_day(delays_by_day,airports)
	for day in delays_by_day:
		filename = fileyear+"_day"+str(day)+"_delay_matrix"
		save_to_json_file(delay_matrixes_by_day[day],"delay_matrix",filename)

def save_flight_count_matrixes_by_day(fileyear,delays_by_day, airports):
	flight_count_matrixes_by_day = convert_to_flight_count_matrixes_by_day(delays_by_day,airports)
	for day in delays_by_day:
		filename = fileyear+"_day"+str(day)+"_flight_count_matrix"
		save_to_json_file(flight_count_matrixes_by_day[day],"flight_count_matrix",filename)


##################################################################################
############################### DEPRECATED STUFFF  ###############################
###################################################################################
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



filename = "2008_trimmed.csv"
fileyear = "2008"


# yearly
average_delays = get_average_delays_dict(filename)
airports = get_airports(average_delays)
save_airpots(fileyear,average_delays)
save_delay_matrix(fileyear,average_delays,airports)
save_flight_count_matrix(fileyear,average_delays,airports)

#weekly
delays_by_week = organize_dict_by_week(fileyear,filename)
delays_by_week = calc_average_in_delays_by_week(delays_by_week)
save_delay_matrixes_by_week(fileyear,delays_by_week,airports)
save_flight_count_matrixes_by_week(fileyear,delays_by_week,airports)

#daily
delays_by_day = organize_dict_by_day(fileyear,filename)
delays_by_day = calc_average_in_delays_by_day(delays_by_day)
save_delay_matrixes_by_day(fileyear,delays_by_day,airports)
save_flight_count_matrixes_by_day(fileyear,delays_by_day,airports)

