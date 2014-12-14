var Model = {

	YEAR: 2014,
	DATADIR: 'data/',
	FILETYPE: '_sample.json',

	airports: null,
	matrix: null,
	cal: null,

	getAirportMatrix: function(callback) {

		// If Already Loaded Data, Don't Load Again
		if (Model.matrix != null) {
			callback.call(window, Model.airports, Model.matrix);
			return;
		}

		// We Need to Load Two Files
		// Don't Call Callback Unless They're Both In
		var checkDoubleLoad = function() {
			if (Model.airports != null && Model.matrix != null) {
				callback.call(window, Model.airports, Model.matrix);
			}
		}

		// List of All Airports
		Model.loadFile('airports', function(result) {
			Model.airports = result;
			checkDoubleLoad();
		});

		// Adjacency Matrix for All Airports
		Model.loadFile('all', function(result) {
			Model.matrix = result;
			checkDoubleLoad();
		});

	},

	getWeekAirportMatrix: function(weekNum, callback) {
		Model.loadFile(["week", weekNum], callback);
	},

	getAllAirportsByDay: function(callback, origin, destination) {

		fileargs = ["day"];
		switch(arguments.length) {
			case 1: fileargs.push("all"); break;
			case 2: fileargs.push("single", origin); break;
			case 3: fileargs.push("multi", origin, destination); break;
			default: return;
		}

		Model.loadFile(fileargs, callback);

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
			url: Model.getAjaxURL(fileargs),
			dataType: 'json',
			error: Model.dataLoadError,
			success: successCallback
		})

	},

	getAjaxURL: function(args) {
		return this.DATADIR + this.YEAR + '_' + args.join('_') + this.FILETYPE
	}

}