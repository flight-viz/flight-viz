var Calendar = {

    clearSVG: function() {

        d3.select("#calendar svg").remove();

    },

    generateCalendar: function(yeardata) {

        Calendar.clearSVG();

        d3.select("#cal-slider").style("visibility", "visible")

        var yd = yeardata.split(",");
        var year = yd[0];
        var yearfile = yd[1];

        var width = 130,
            height = 960,
            cellSize = 17,
            cellHorizontalOffset = 5
            cellVerticalOffset = 10;


        var day = d3.time.format("%w"),
            week = d3.time.format("%U"),
            percent = d3.format(".1%"),
            format = d3.time.format("%Y-%m-%d");

        var color = d3.scale.linear()
              .domain([0,15,30])
              .range(["#00c000", "#c0c000", "#c00000"]);

        var svg = d3.select("#calendar").selectAll("svg")
            .data(d3.range(+year, (+year + 1)))
          .enter().append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "RdYlGn")
          .append("g");

        var rect = svg.selectAll(".day")
            .data(function(d) { return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
          .enter().append("rect")
            .attr("class", "day")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("transform", "translate(" + cellHorizontalOffset + "," + cellVerticalOffset + ")")
            .attr("x", function(d) { return day(d) * cellSize; })
            .attr("y", function(d) { return week(d) * cellSize; })
            .datum(format);

        rect.append("title")
            .text(function(d) { return d; });

        svg.selectAll(".month")
            .data(function(d) { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
          .enter().append("path")
            .attr("class", "month")
            .attr("d", monthPath)
            .attr("transform", "translate(" + cellHorizontalOffset + "," + cellVerticalOffset + ")");

        d3.json(yearfile, function(error, json) {
          var data = json["avg_delay_by_day"];

          rect.filter(function(d) { return d in data; })
              .attr("style", function(d) {return "fill: " + color(data[d]); })
            .select("title")
              .text(function(d) { return d + ": " + +data[d].toFixed(2); });
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
};