var Controller = {

	init: function() {

		Model.initAirportsData(function(flightsMatrix, delayMatrix, airports, airportData, cal) {

			// Create the Chord Viz Here
			ChordViz.draw(flightsMatrix, delayMatrix, airports);

			// Create the Calendar Here
			Calendar.generateCalendar("2004, data/2004/2004_day_all.json");

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
		singleAirportSelect(null);
	},

	singleAirportSelect: function(airport) {

		Model.getAirportByDay(airport, function(result) {

			// Update the Calendar
			Calendar.clearSVG();
			Calendar.generateCalendar("" + Model.YEAR + "," + Model.YEAR +'_day_' + airport + '.json'");

		});
		
	},

	noWeekSelected: function() {
		weekSelect(null);
	},

	weekSelect: function(weekNum) {

		Model.getWeekAirportMatrix(weekNum, function(flightsMatrix, delayMatrix) {
			// Update the Chord
			ChordViz.draw(flightsMatrix, delayMatrix, Model.airports);

		})

	}

}

Controller.init();