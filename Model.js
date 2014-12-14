var Model = {

	YEAR: 2014,
	DATADIR: 'data/',
	FILETYPE: '_sample.json',

	airports: null,
	matrix: null,
	masterMatrix: null,
	cal: null

	getAirportMatrix: function(callback) {

		// If Already Loaded Data, Don't Load Again
		if (masterMatrix != null) {
			callback.call(window, airports, matrix);
			return;
		}

		var checkDoubleLoad = function() {
			if (airports != null && matrix != null) {
				callback.call(window, airports, matrix);
			}
		}

		// List of All Airports
		Model.loadFile('airports', function(result) {
			Model.airports = result;
			checkDoubleLoad();
		});

		// Adjacency Matrix for All Airports
		Model.loadFile('matrix', function(result) {
			Model.matrix = result;
			Model.masterMatrix = result;
			checkDoubleLoad();
		});

	},

	getWeekAirportMatrix: function(dateRangeStart, dateRangeEnd, callback) {



	}

	getTwoAirportsCalData: function(origin, destination, callback) {
		Model.loadFile(['double', origin, destination], function(result) {
			Model.cal = result;
			callback.call(window, result);
		});
	},

	getSingleAirportData: function(origin, callback) {
		Model.loadFile(['single', origin], function(result) {
			Model.cal = result;
			callback.call(window, result);
		});
	},


	// Private-ish Functions
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
			url: getAjaxURL(fileargs),
			dataType: 'json',
			error: Model.dataLoadError,
			success: successCallback
		})

	},

	getAjaxURL: function(args) {
		return DATADIR + YEAR + '_' + args.join('_') + FILETYPE
	}

}