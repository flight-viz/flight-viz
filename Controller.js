var Controller = {

	chordViz: null,
	mapViz: null,
	calendarViz: null,

	init: function() {

		Model.initAirportsData(function(flightsMatrix, delayMatrix, airports) {

			// Create the Chord Viz Here
			ChordViz.draw(flightsMatrix, delayMatrix, airports);

			// Create the Map Here
			// Create the Calendar Here

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