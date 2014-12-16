var Controller = {

	init: function() {

		Model.initAirportsData(function(flightsMatrix, delayMatrix, airports, airportData) {

			// Create the Chord Viz Here
			ChordViz.draw(flightsMatrix, delayMatrix, airports);

			// Create the Map Here
			//MapViz.draw(airports, airport_data)

			// Create the Calendar Here

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

			console.log(result);

			// Update the Calendar

		});
		
	},

	noWeekSelected: function() {
		weekSelect(null);
	},

	weekSelect: function(weekNum) {

		Model.getWeekAirportMatrix(weekNum, function(flightsMatrix, delayMatrix, airports) {
			// Update the Chord
			ChordViz.draw(flightsMatrix, delayMatrix, airports);
			// Update the Map
		})

	}

}

Controller.init();