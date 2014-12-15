var ChordViz = {

	// Data
	dataMatrix: null,
	colorMatrix: null,
	labels: null,

	// D3 Components
	colorScale: null,
	svg: null,

	draw: function(dataMatrix, colorMatrix, labels) {

		// Save for Later, I Guess?
		this.dataMatrix = dataMatrix;
		this.colorMatrix = colorMatrix;
		this.labels = labels;

		// Init Chord Viz
		var chord = d3.layout.chord()
			.padding(.01)
			.sortSubgroups(d3.descending)
			.matrix(dataMatrix);

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
		var mMinMax = ChordViz.getMatrixAveragedMaxMin(colorMatrix);
		console.log(mMinMax);
		this.colorScale = d3.scale.linear()
			.domain([0,10,20])
			.range(["#00c000", "#c0c0c0", "#c00000"]);

		// Build the Image Container
		var svg = d3.select("#map").append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
		this.svg = svg;

		// Outer Circles Only
		svg.append("g").selectAll("path")
			.data(chord.groups)
			.enter().append("path")
			.style("fill", function(d) { return "#808080"; })
			.style("stroke", function(d) { return "#202020"; })
			.attr("d", arc)
			.on("mouseover", ChordViz.mouseOverHandle)
			.on("mouseout", ChordViz.mouseOutHandle);

		var groupTicks = function(d) {
			return [{
				angle: (d.startAngle+d.endAngle)/2,
				label: labels[d.index]
			}]
		}

		// Creates Text Elements Around the Circle
		var ticks = svg.append("g").selectAll("g")
			.data(chord.groups)
			.enter().append("g").selectAll("g")
			.data(groupTicks)
			.enter().append("g")
			.attr("transform", function(d) {
				return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
				+ "translate(" + outerRadius + ",0)";
			});

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
				var avg = (colorMatrix[d.source.index][d.target.index] + colorMatrix[d.target.index][d.source.index])/2;
				console.log(Math.round(avg), ChordViz.colorScale(avg), d);
				return ChordViz.colorScale(avg);
			})
			.style("opacity", 1);

	},

	mouseOverHandle: function(g, i) {

		// Fade Out Other Chords
		ChordViz.svg.selectAll(".chord path")
			.filter(function(d) { return d.source.index != i && d.target.index != i; })
			.transition()
			.style("opacity", 0.1);
		
		// Change Color Based on Context
		ChordViz.svg.selectAll(".chord path")
			.filter(function(d) { return d.source.index == i || d.target.index == i; })
			.transition()
			.style("fill", function(d) { 

				var c;

				if (i == d.source.index) {
					c = ChordViz.colorMatrix[d.source.index][d.target.index];
				} else if (i == d.target.index) {
					c = ChordViz.colorMatrix[d.target.index][d.source.index];
				}

				return ChordViz.colorScale(c);
			});

	},

	mouseOutHandle: function(g, i) {

		// Fade Other Chords Back In
		ChordViz.svg.selectAll(".chord path")
			.filter(function(d) { return d.source.index != i && d.target.index != i; })
			.transition()
			.style("opacity", 1);

		// Change Color Back to Original Average
		ChordViz.svg.selectAll(".chord path")
			.filter(function(d) { return d.source.index == i || d.target.index == i; })
			.transition()
			.style("fill", function(d) { 

				var c = (ChordViz.colorMatrix[d.source.index][d.target.index] + ChordViz.colorMatrix[d.target.index][d.source.index])/2;
				return ChordViz.colorScale(c);

			})
			.style("opacity", 1);

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


