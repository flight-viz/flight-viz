var Model = {

	YEAR: 2004,
	DATADIR: 'data/',
	FILETYPE: '.json',

	airports: null,
	flightsMatrix: null,
	delayMatrix: null,
	cal: null,
	airportData:null,
	mapData:null,

	initAirportsData: function(callback) {

		Model.airports = null;
		Model.flightsMatrix = null;
		Model.delayMatrix = null;
		Model.cal = null;
		Model.airportData = null;
		Model.mapData = null;

		// We Need to Load Two Files
		// Don't Call Callback Unless They're Both In
		var checkMultiLoad = function() {

			if (Model.airports != null && Model.flightsMatrix != null && Model.cal != null && Model.airportData!= null && Model.mapData != null)  {
				callback.call(window, Model.flightsMatrix, Model.delayMatrix, Model.airports, Model.airportData, Model.cal,Model.mapData);

			}
		}

		// List of All Airports
		Model.loadFile('airports', function(result) {
			Model.airports = result.airports;
			checkMultiLoad();
		});

		// Adjacency Matrix for All Airports
		Model.loadFile(['all','matrix'], function(result) {
			Model.flightsMatrix = result.flight_count_matrix;
			Model.delayMatrix = result.delay_matrix;
			checkMultiLoad();
		});

		Model.loadFile(['day','all'], function(result) {
			Model.cal = result.avg_delay_by_day;
			checkMultiLoad();
		});

		// Load all airport data (has airport locations) 
		Model.loadAirportData(function(result) {
			Model.airportData = result;
			checkMultiLoad();
		});

		Model.loadMapData(function(result) {
			Model.mapData = result;
			checkMultiLoad();
		});

	},

	getWeekAirportMatrix: function(weekNum, callback) {

		if (weekNum != null) {
			Model.loadFile(["week"+weekNum, "matrix"], function(result) {
				callback.call(window, result.flight_count_matrix, result.delay_matrix);
			});	
		} else {
			callback.call(window, Model.flightsMatrix, Model.delayMatrix);
		}

		
	},

	getAirportByDay: function(origin, callback) {

		if (origin != null) {
			Model.loadFile(["day", origin], callback);
		} else {
			callback.call(window, Model.cal);
		}		

	},

	getAirportsForAutocomplete: function(airportsRaw, airportsInUse) {

		airports = [];
		for (var i in airportsRaw) {
			if (airportsInUse.indexOf(airportsRaw[i].iata) == -1) { continue; }
			airports.push({
				value: airportsRaw[i].iata,
				label: airportsRaw[i].airport + " (" + airportsRaw[i].iata + ")"
			})
		}
		return airports;

	},

	airportCodeToIndex: function(code) {
		return Model.airports.indexOf(code);
	},

	// Internal Use Functions Below This Point

	dataLoadError: function(xhr, ajaxOptions, thrownError) {
		console.log(xhr, ajaxOptions, thrownError);
		alert('Could not load data from file.')
	},

	loadFile: function(file, successCallback) {

		if (!Array.isArray(file)) {
			fileargs = [file];
		} else {
			fileargs = file;
		}
		$.ajax({
			type: "GET",
			url: Model.getAjaxURL(fileargs),
			dataType: 'json',
			error: Model.dataLoadError,
			success: successCallback
		})

	},

	getAjaxURL: function(args) {
		return this.DATADIR + this.YEAR + '/' + this.YEAR + '_' + args.join('_') + this.FILETYPE
	},

	loadAirportData: function(successCallback){
		$.ajax({
			type: "GET",
			url: this.DATADIR + '/' + 'airport_data.json',
			dataType: 'json',
			error: Model.dataLoadError,
			success: successCallback
		})

	},
	loadMapData: function(successCallback){
			$.ajax({
				type: "GET",
				url: this.DATADIR + '/' + 'us.json',
				dataType: 'json',
				error: Model.dataLoadError,
				success: successCallback
			})

 	}
}