var Model = {

	YEAR: 2008,
	DATADIR: 'data/',
	FILETYPE: '.json',

	airports: null,
	flightsMatrix: null,
	delayMatrix: null,
	cal: null,

	initAirportsData: function(callback) {

		// We Need to Load Two Files
		// Don't Call Callback Unless They're Both In
		var checkMultiLoad = function() {
			if (Model.airports != null && Model.flightsMatrix != null && Model.cal != null) {
				callback.call(window, Model.flightsMatrix, Model.delayMatrix, Model.airports);
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

	},

	getWeekAirportMatrix: function(weekNum, callback) {

		if (weekNum != null) {
			Model.loadFile(["week"+weekNum, "matrix"], callback);	
		} else {
			callback.call(window, Model.flightsMatrix, Model.delayMatrix, Model.airports);
		}

		
	},

	getAirportByDay: function(origin, callback) {

		if (origin != null) {
			Model.loadFile(["day", origin], callback);
		} else {
			callback.call(window, Model.cal);
		}		

	},

	getGenericAirportData: function(callback) {



	},

	// Internal Use Functions
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
	}

}