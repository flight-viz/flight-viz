var Controller = {

	liveAirportCode: null,

	init: function() {

		Model.initAirportsData(function(flightsMatrix, delayMatrix, airports, airportData, cal) {

			Model.YEAR = 2004;

			// Create the Chord Viz Here
			ChordViz.draw(flightsMatrix, delayMatrix, airports);

			// Create the Calendar Here
			Calendar.generateCalendar(Model.YEAR + ", data/"+ Model.YEAR + "/" + Model.YEAR + "_day_all.json");

			// Autocomplete
			$(document).ready(function() {
				$('#airport-search-text').autocomplete({
					source: Model.getAirportsForAutocomplete(airportData, airports),
					select: function(event, ui) {
						ChordViz.activate(Model.airportCodeToIndex(ui.item.value));
						Controller.singleAirportSelect(ui.item.value);
					}
				});
			})

		})

	},

	noAirportSelected: function() {
		Controller.singleAirportSelect('all');
	},

	singleAirportSelect: function(airport) {

		this.liveAirportCode = airport;

		Model.getAirportByDay(airport, function(result) {

			var url = Model.YEAR + ", data/"+ Model.YEAR + "/" + Model.YEAR +"_day_" + airport + ".json";

			// Update the Calendar
			Calendar.clearSVG();
			Calendar.generateCalendar(url);

		});
		
	},

	noWeekSelected: function() {
		Controller.weekSelect(null);
	},

	weekSelect: function(weekNum) {

		Model.getWeekAirportMatrix(weekNum, function(flightsMatrix, delayMatrix) {
			// Update the Chord
			ChordViz.draw(flightsMatrix, delayMatrix, Model.airports, Controller.liveAirportCode);

		})

	}

}

Controller.init();