var ChordViz = {

	// Data
	dataMatrix: null,
	colorMatrix: null,
	labels: null,

	// Config
	selector: "#chord",
	ringSelectedColor: "#474747",
	ringDefaultColor: "#1972BF",

	// Interaction
	currHover: null,
	currSelected: null,

	// D3 Components
	colorScale: null,
	chord: null,
	svg: null,
	tip: null,

	draw: function(dataMatrix, colorMatrix, labels) {

		// Destroy The Old One
		d3.select(this.selector).selectAll("svg").remove();
		this.svg = null;

		// Save for Later
		this.dataMatrix = dataMatrix;
		this.colorMatrix = colorMatrix;
		this.labels = labels;

		currHover = null;
		currSelected = null;

		// Experimental: Removes Weight from the Chord
		/*var simpleMatrix = [];
		for (var i = 0; i < 100; i++) {
			simpleMatrix[i] = [];
			for (var j = 0; j < 100; j++) {
				if (dataMatrix[i][j] != 0) {
					simpleMatrix[i][j] = 1;
				} else {
					simpleMatrix[i][j] = 0;
				}
			}
		}*/

		// Init Chord Viz
		this.chord = d3.layout.chord()
			.padding(.005)
			.sortSubgroups(d3.descending)
			.matrix(dataMatrix);
		var chord = this.chord;

		// Initial Params for Image Size
		var width = 960,
			height = 800,
			innerRadius = Math.min(width, height) * .41,
			outerRadius = innerRadius * 1.05;

		// Sets Outer Bounds on Circle
		var arc = d3.svg.arc()
			.innerRadius(innerRadius)
			.outerRadius(outerRadius);

		// Sets Color of the Chords Going Across Circle
		this.colorScale = d3.scale.linear()
			.domain([0,15,30])
			.range(["#00c000", "#c0c000", "#c00000"]);

		// Build the Image Container
		var svg = d3.select(this.selector).append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
		this.svg = svg;

		// Outer Circles Only
		svg.append("g")
			.attr("class", "outer")
			.selectAll("path")
			.data(chord.groups)
			.enter().append("path")
			.style("fill", ChordViz.ringDefaultColor)
			// .style("stroke", function(d) { return "#202020"; })
			.attr("d", arc)
			.on("mouseover", ChordViz.mouseOverHandle)
			.on("mouseout", ChordViz.mouseOutHandle)
			.on("click", ChordViz.clickHandle);

		var groupTicks = function(d) {
			return [{
				angle: (d.startAngle+d.endAngle)/2,
				label: labels[d.index]
			}]
		}

		// Tooltips
		ChordViz.tip = d3.tip()
			.attr('class', 'd3-tip')
			.offset([0, 0])
			.direction(function(d) {
				var a = (d.angle != undefined) ? d.angle : (d.startAngle+d.endAngle)/2;
				if (a < 1.57) { return "ne"; }
				else if (a < 3.14) { return "se"; }
				else if (a < 4.71) { return "sw"; }
				else { return "nw"; }
			})
			.html(function(d) {
				if (d.index != undefined) {
					return "<strong>"+Model.airports[d.index]+"</strong><br />"+Model.airportData[Model.airports[d.index]].airport;
				} else {
					return "<strong>"+d.label+"</strong><br />"+Model.airportData[d.label].airport;
				}
			})
		ChordViz.svg.call(ChordViz.tip);

		// Creates Text Elements Around the Circle
		var ticks = svg.append("g").selectAll("g")
			.data(chord.groups)
			.enter().append("g").selectAll("g")
			.data(groupTicks)
			.enter().append("g")
			.attr("transform", function(d) {
				return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
				+ "translate(" + outerRadius + ",0)";
			})
			.on("mouseover", ChordViz.tip.show)
			.on("mouseout", ChordViz.tip.hide);

		// Fills the Text Elements Around the Circle
		ticks.append("text")
			.attr("x", 8)
			.attr("dy", ".35em")
			.attr("transform", function(d) { return d.angle > Math.PI ? "rotate(180)translate(-16)" : null; })
			.style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
			.text(function(d) { return d.label; });

		// Inner Circles Only
		svg.append("g")
			.attr("class", "chord")
			.selectAll("path")
			.data(chord.chords)
			.enter().append("path")
			.attr("d", d3.svg.chord().radius(innerRadius))
			.style("fill", function(d) {
				var avg = (ChordViz.colorMatrix[d.source.index][d.target.index] + ChordViz.colorMatrix[d.target.index][d.source.index])/2;
				return ChordViz.colorScale(avg);
			})
			.style("opacity", 1);

	},

	transitionChords: function() {

		// Change Color of Outer Ring
		ChordViz.svg.selectAll(".outer path")
			.transition()
			.style("fill", function(d) { 
				return ChordViz.isItemActive(d.index) ? ChordViz.ringSelectedColor : ChordViz.ringDefaultColor
			});

		// Change Color and Opacity Based on Context
		ChordViz.svg.selectAll(".chord path")
			.transition()
			.style("fill", function(d) { 

				var c;
				var c1 = ChordViz.colorMatrix[d.source.index][d.target.index];
				var c2 = ChordViz.colorMatrix[d.target.index][d.source.index];
				var avg = (c1 + c2) / 2;

				// Context: Something Clicked, Something Hovered --> Average
				if (ChordViz.currSelected != null && ChordViz.currHover != null) {
					if (ChordViz.currSelected == ChordViz.currHover) {
						switch(ChordViz.currHover) {
							case d.source.index: c = c1; break;
							case d.target.index: c = c2; break;
							default: c = avg; break;
						}
					} else {
						c = avg;
					}

				// Context: Nothing Clicked, Something Hovered --> Hovered Thing Color
				} else if (ChordViz.currSelected == null && ChordViz.currHover != null) {
					switch(ChordViz.currHover) {
						case d.source.index: c = c1; break;
						case d.target.index: c = c2; break;
						default: c = avg; break;
					}

				// Context: Something Clicked, Nothing Hovered --> Clicked Thing Color
				} else if (ChordViz.currSelected != null && ChordViz.currHover == null) {
					switch(ChordViz.currSelected) {
						case d.source.index: c = c1; break;
						case d.target.index: c = c2; break;
						default: c = avg; break;
					}

				// Context: Nothing Clicked, Nothing Hovered --> Average
				} else {
					c = avg;
				}

				return ChordViz.colorScale(c);
			})
			.style("opacity", function(d) {
				return ChordViz.isChordActive(d) ? 1 : 0;
			});

	},

	activate: function(i) {

		ChordViz.currSelected = i;
		ChordViz.transitionChords();

	},

	mouseOverHandle: function(g, i) {

		ChordViz.tip.show(g);
		ChordViz.currHover = i;
		ChordViz.transitionChords();

		if (ChordViz.currSelected) {
			d3.selectAll("#chord-detail").html(ChordViz.labels[ChordViz.currSelected]+" &#8594; "+ChordViz.labels[ChordViz.currHover]+"<br />"
				+"Average Delay: "+Math.round(ChordViz.colorMatrix[ChordViz.currSelected][ChordViz.currHover])+" Minutes");
		}

	},

	mouseOutHandle: function(g, i) {

		ChordViz.tip.hide(g);
		ChordViz.currHover = null;
		ChordViz.transitionChords();

		d3.selectAll("#chord-detail").text("")

	},

	isItemActive: function(index) {

		return ChordViz.currSelected == index || ChordViz.currHover == index;

	},

	isChordActive: function(d) {

		// d: Current Chord Element in Loop
		// i: Index of Current Outer Element Being Hovered
		// i is -1 if Hover Out

		var i = ChordViz.currHover;
			
		if (ChordViz.currSelected != null) {

			var c = ChordViz.currSelected;

			// One Thing Selected, so Any Chord That
			// Starts at Hover, Ends at Selected
			// Ends at Hover, Starts at Selected
			// Starts/Ends on Selected if Nothing is Hovered or Hovering Selection

			return (d.source.index == i && d.target.index == c) ||
				(d.target.index == i && d.source.index == c) ||
				((i == null || i == c) && (d.target.index == c || d.source.index == c))

		} else {

			// Nothing Selected, so Any Chord that Starts/Ends at Hover
			// If Mouseout, Everything is Active
			return i == null || d.source.index == i || d.target.index == i;

		}

	},

	clickHandle: function(g, i) {

		if (ChordViz.currSelected == i) {
			// If The Clicked Element is Already Selected, Unselect
			ChordViz.currSelected = null;
			Controller.noAirportSelected();
		} else {
			// Otherwise, Save that Element
			ChordViz.currSelected = i;
			Controller.singleAirportSelect(ChordViz.labels[i]);
		}

		ChordViz.transitionChords();

		$('#airport-search-text').val('');

	},

	getMatrixAveragedMaxMin: function(matrix) {

		averages = [];

		for (var j = 0; j < matrix.length; j++) {
			for (var i = 0; i < matrix[j].length; i++) {
				averages.push( ( matrix[j][i] + matrix[i][j] ) / 2 );
			}
		}

		var min = averages.reduce(function (prev, curr, i, arr) {
			if (prev < curr) { return prev; }
			else { return curr; }
		}, 99999999)

		var max = averages.reduce(function (prev, curr, i, arr) {
			if (prev > curr) { return prev; }
			else { return curr; }
		}, -99999999)


		var avg = averages.reduce(function (prev, curr, i, arr) {
			return prev+curr
		})/averages.length;

		return {
			max: max,
			min: min,
			avg: avg
		}

	}

}

var matrixCrop = function(m) {
	var newm = [];
	for (var i = 0; i < 100; i++) {
		newm[i] = [];
		for (var j = 0; j < 100; j++) {
			newm[i][j] = m[i][j];
		}
	}
	return newm;
}
