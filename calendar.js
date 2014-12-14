function clearSVG() {
  d3.select("svg").remove();
}

function generateCalendar(year) {
var width = 130,
    height = 960,
    cellSize = 17; // cell size

var day = d3.time.format("%w"),
    week = d3.time.format("%U"),
    percent = d3.format(".1%"),
    format = d3.time.format("%Y-%m-%d");

var color = d3.scale.quantize()
    .domain([-.05, .05])
    .range(d3.range(11).map(function(d) { return "q" + d + "-11"; }));

var svg = d3.select("#calendar").selectAll("svg")
    .data(d3.range(+year, (+year + 1)))
  .enter().append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "RdYlGn")
  .append("g")
    .attr("transform", "translate(5, 20)");

var rect = svg.selectAll(".day")
    .data(function(d) { return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
  .enter().append("rect")
    .attr("class", "day")
    .attr("width", cellSize)
    .attr("height", cellSize)
    .attr("x", function(d) { return day(d) * cellSize; })
    .attr("y", function(d) { return week(d) * cellSize; })
    .datum(format);

rect.append("title")
    .text(function(d) { return d; });

svg.selectAll(".month")
    .data(function(d) { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
  .enter().append("path")
    .attr("class", "month")
    .attr("d", monthPath);

d3.csv("../testcal.csv", function(error, csv) {
  var data = d3.nest()
    .key(function(d) { return d.FL_DATE; })
    .rollup(function(d) { return d[0].AVG_DELAY; })
    .map(csv);

  rect.filter(function(d) { return d in data; })
      .attr("class", function(d) { return "day " + color(data[d]); })
    .select("title")
      .text(function(d) { return d + ": " + percent(data[d]); });
});



function monthPath(t0) {
  var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
      d0 = +day(t0), w0 = +week(t0),
      d1 = +day(t1), w1 = +week(t1);

  return "M" + d0 * cellSize + "," + w0 * cellSize +
    "H" + 7 * cellSize + 
    "V" + w1 * cellSize + 
    "H" + (d1 + 1) * cellSize + 
    "V" + (w1 + 1) * cellSize + 
    "H" + 0 +  
    "V" + (w0 + 1) * cellSize +
    "H" + d0 * cellSize + 
    "Z";
}

d3.select(self.frameElement).style("height", "2910px");
}