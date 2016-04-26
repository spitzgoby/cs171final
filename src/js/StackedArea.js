
function loadStackedArea(){

    var margin = {top: 10, right: 100, bottom: 30, left: 100},
        width = parseInt(d3.select('#treemap-area').style('width')) - margin.left - margin.right,
        height = width * .55 - margin.top - margin.bottom;

    var parseDate = d3.time.format("%Y").parse,
        formatPercent = d3.format(".0%");

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var axisYScale = d3.scale.linear()
        .domain([0, 2100000])
        .range([height, 0]);


    var color = d3.scale.category20();

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .orient("left")
        .scale(axisYScale)
        .tickFormat(d3.format(",.0f"));


    var area = d3.svg.area()
        .x(function(d) { return x(d.date); })
        .y0(function(d) { return y(d.y0); })
        .y1(function(d) { return y(d.y0 + d.y); });

    var stack = d3.layout.stack()
        .values(function(d) { return d.values; });

    var title = d3.select("#title")
        .append("h3")
        .text("Admission to Drug Treatment Programs by Subtance and Year");
    var svg = d3.select("#treemap-area");
    svg.selectAll("*").remove();

    var legend = d3.select("#treemap-area")
        .append("svg")
        .attr("class", "legend")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height/9)
        .attr("transform", "translate(" + margin.left + "," + 0 + ")");


    var svg = d3.select("#treemap-area")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.tsv("data/treatment2003_2013.tsv", function(error, data) {
        if (error) throw error;

        color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));

        data.forEach(function(d) {
            d.date = parseDate(d.date);
        });

        var substances = stack(color.domain().map(function(name) {
            return {
                name: name,
                values: data.map(function(d) {
                    return {date: d.date, y: d[name]/2100000
                }
                })
            };
        }));

        x.domain(d3.extent(data, function(d) { return d.date; }));

        var legendElements = legend.selectAll("g")
            .data(substances)
            .enter().append("svg:g")
            .attr("class", "legend")
            .attr("transform", "translate(" + margin.left + "," + 0 + ")");

        legendElements.append("svg:rect")
            .attr("x", function(d,i) {
                return i * (width*0.9)/(substances.length) +25; })
            .attr("y", 10)
            .attr("width", 10 )
            .attr("height", 10 )
            .style("fill", function(d) { return color(d.name); });

        legendElements.append("svg:text")
            .attr("x", function(d,i) {
                return i * (width*0.9)/(substances.length) +30; })
            .attr("y", 30)
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function(d) { return d.name; });

        var substance = svg.selectAll(".browser")
            .data(substances)
            .enter().append("g")
            .attr("class", "browser");

        substance.append("path")
            .attr("class", "area")
            .attr("d", function(d) { return area(d.values); })
            .style("fill", function(d) { return color(d.name); })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);

        substance.call(tip);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

    });

    var tip = d3.tip().attr('class', 'd3-tip').html(function(d) {

        var name = d.name.replace('_', ' ');
        var number = d.values;

        function makeTable(data){
            table = "<tr><td>Year</td><td>Admissions to Treatment</td>";

            for(var i=0;i<number.length;i++){
                table += "<tr>"+
                        "<td>" + data[i].date.getFullYear() + "</td>" +
                        "<td>" + (parseInt(data[i].y*2100000)) + "</td>" +
                    "</tr>";
            }
            return table;
        }

        var table = "<table>" + "<th>Substance Type : "+ name +"</th>" + makeTable(number)+ "</table>";
        return table;

    });


}