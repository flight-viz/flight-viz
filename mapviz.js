var MapViz = {

	// Data
	flightsMatrix : null,
	airports_arr : null,
	mapData : null,
	airports: null,
	// Config
	selector: "#map",

	draw: function(flightsMatrix,airports_arr,airportData,mapData) {
		// Destroy The Old One
		d3.select(this.selector).selectAll("svg").remove();
		this.svg = null;

		this.flightsMatrix = flightsMatrix;
		this.airports_arr = airports_arr;
		this.mapData = mapData;
		

		var airports = [];

		// only keep used airports
		for (var j = 0; j < airports_arr.length; j++){
			airports[j] = airportData[airports_arr[j]]
		};

		this.airports = airports

		var width = 480,
		    height = 250;

		var projection = d3.geo.albers()
		    .translate([width / 2, height / 2])
		    .scale(540);

		var path = d3.geo.path()
		    .projection(projection);

		var voronoi = d3.geom.voronoi()
		    .x(function(d) { return d.x; })
		    .y(function(d) { return d.y; })
		    .clipExtent([[0, 0], [width, height]]);

		var svg = d3.select(this.selector).append("svg")
		    .attr("width", width)
		    .attr("height", height);

		var airportByID = d3.map(),
			positions = [];

			// console.log(airports)
     	

     	airports.forEach(function(d) {
     	  airportByID.set(d.iata, d);
     	  d.outgoing = [];
     	  d.incoming = [];
     	});
		


		flightsMatrix.forEach(function(row,i) {
			for (var j = 0; j < airports_arr.length; j++){
				if (row[j] != 0) {
					var source = airports[i], 
						target = airports[j],
						link = {source:source,target:target};
					source.outgoing.push(link);
					target.incoming.push(link);
				}
			}
		} );

		// console.log(airports)

	  airports = airports.filter(function(d) {
	    if (d.count = Math.max(d.incoming.length, d.outgoing.length)) {

	      d[0] = +d.long;
	      d[1] = +d.lat;

	      var position = projection(d);
	      d.x = position[0];
	      d.y = position[1];

	      return true;
	    }
	  });
	  
	  voronoi(airports)
	      .forEach(function(d) { d.point.cell = d; });

	  svg.append("path")
	      .datum(topojson.feature(mapData, mapData.objects.land))
	      .attr("class", "states")
	      .attr("d", path);

	  svg.append("path")
	      .datum(topojson.mesh(mapData, mapData.objects.states, function(a, b) { return a !== b; }))
	      .attr("class", "state-borders")
	      .attr("d", path);

	  var airport = svg.append("g")
	      .attr("class", "airports")
	    .selectAll("g")
	      .data(airports.sort(function(a, b) { return b.count - a.count; }))
	    .enter().append("g")
	      .attr("class", "airport");

	  airport.append("path")
	      .attr("class", "airport-cell")
	      .attr("d", function(d) { return d.cell.length ? "M" + d.cell.join("L") + "Z" : null; });

	  airport.append("g")
	      .attr("class", "airport-arcs")
	    .selectAll("path")
	      .data(function(d) { return d.outgoing; })
	    .enter().append("path")
	      .attr("d", function(d) { return path({type: "LineString", coordinates: [d.source, d.target]}); });

	  airport.append("circle")
	      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
	      .attr("r", function(d, i) { return Math.sqrt(d.count); });


	}


}




