var Controller = {

	registeredVizs: [],

	register: function(viz) {
		registeredVizs.push(viz);
	},

	sendMessage: function(msg) {
		registeredVizs.map(function(viz) {
			viz.receive(msg);
		})
	},

	singleAirportSelect: function() {
		
	},

	multiAirportSelect: function() {

	},

	weekSelect: function() {

	}


}