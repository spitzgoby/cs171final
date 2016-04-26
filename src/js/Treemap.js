
function loadTreemap() {

    //used to get data for the correct year for a node
    var year_index = 0

    var margin = {top: 25, right: 100, bottom: 30, left: 100};

    var width = parseInt(d3.select('#treemap-area').style('width')) - margin.left - margin.right,
        height = width * .66 - margin.top - margin.bottom,
        x = d3.scale.linear().range([0, width]),
        y = d3.scale.linear().range([0, height]),
        color = d3.scale.category20(),
        root,
        node;

    var treemap = d3.layout.treemap()
        .round(false)
        .size([width, height])
        .sticky(true)
        .value(function(d) { return d.size[year_index]; });

    var title = d3.select("#title");
    title.select("*").remove();
    title
        .append("h3")
        .text("Proportional Admission to Drug Treatment Programs by Subtance and Year");


    var svg = d3.select("#treemap-area");
    svg.select("*").remove();

    var brushedSlider = d3.select("#treemap-area")
        .append("svg")
        .attr("class", "slider")
        .attr("width", width)
        .attr("height", height/9)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var legend = d3.select("#treemap-area")
        .append("svg")
        .attr("class", "legend")
        .attr("width", width * 0.9)
        .attr("height", height/9)
        .attr("transform", "translate(" + margin.left + "," + 0 + ")");

    svg = d3.select("#treemap-area")
        .append("svg")
        .attr("class", "chart")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.json("data/betterTreeMapData.json", function(data) {
        node = root = data;

        var nodes = treemap.nodes(root)
            .filter(function(d) { return !d.children; });
        var cell = svg.selectAll("g")
            .data(nodes)
            .enter().append("svg:g")
            .attr("class", "cell")
            .attr("transform", function(d) { return "translate(" + ( d.x) + "," + ( + d.y) + ")"; })
            .on("click", function(d) { return zoom(node == d.parent ? root : d.parent); });

        cell.append("svg:rect")
            .attr("width", function(d) { return d.dx - 1; })
            .attr("height", function(d) { return d.dy - 1; })
            .style("fill", function(d) { return color(d.parent.name); });

        cell.append("svg:text")
            .attr("x", function(d) { return d.dx / 2; })
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function(d) { return d.name; })
            .style("opacity", function(d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; });

        d3.select(window).on("click", function() { zoom(root); });

        function getNames(items){
            a = [];
            for (var i = 0; i < items.length; i++) {
                a[i] = items[i].name
            }
            return a;
        }

        var legendElements = legend.selectAll("g")
            .data(getNames(node.children))
            .enter().append("svg:g")
            .attr("class", "legend")
            .attr("transform", "translate(" + margin.left + "," + 0 + ")");

        legendElements.append("svg:rect")
            .attr("x", function(d,i) {
                return i * (width*0.8)/(getNames(node.children).length) +25; })
            .attr("y", 10)
            .attr("width", 10 )
            .attr("height", 10 )
            .style("fill", function(d) { return color(d); });

        legendElements.append("svg:text")
            .attr("x", function(d,i) {
                return i * (width*0.8)/(getNames(node.children).length) +30; })
            .attr("y", 30)
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function(d) { return d.replace('_', ' '); });


        //x scale for the slider
        var sliderX = d3.scale.linear()
            .domain([2003, 2013])
            .range([0, width-margin.left-margin.right])
            .clamp(true);

        var brush = d3.svg.brush()
            .x(sliderX)
            .extent([0, 0])
            .on("brush", brushed);

        //adding the slider to the page
        brushedSlider.append("rect")
            .attr("class", "slider_background")
            .attr("height", 4)
            .attr("width", width-margin.left-margin.right)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        ;

        brushedSlider.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(d3.svg.axis()
                .scale(sliderX)
                .orient("bottom")
                .tickFormat(function (d) {
                    return +d;
                })
                .tickSize(0)
                .tickPadding(12))
            .select(".domain")
            .select(function () {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr("class", "halo");

        var slider = brushedSlider.append("g")
            .attr("class", "slider")
            .call(brush);


        slider.select(".background")
            .attr("height", 100);

        var handle = slider.append("circle")
            .attr("class", "handle")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("r", 9);

        slider
            .call(brush.event)
            .transition() // gratuitous intro!
            .duration(750)
            .call(brush.extent([2013, 2013]))
            .call(brush.event);
        function brushed() {
            var initialValue = value = Math.round(brush.extent()[0]);
            if (d3.event.sourceEvent) { // not a programmatic event
                value = Math.round(sliderX.invert(d3.mouse(this)[0]-margin.left));
                console.log(value);
                brush.extent([value, value]);
            }

            if ((value > 2002) && (value < 2014)) {
                year_index = value - 2003
                var year = function (d) {
                    return d.size[year_index];
                };
                treemap.value(year).nodes(root);
                zoom(node);
            }
            handle.attr("cx", sliderX(value));
        }

        //If an area is clicked, zoom in on that area
        //if the year is changed transition to the data for the new year
        function zoom(d) {

            var kx = (width) / d.dx, ky = (height) / d.dy;
            x.domain([d.x, d.x + d.dx]);
            y.domain([d.y, d.y + d.dy]);

            var t = svg.selectAll("g.cell").transition()
                .duration(d3.event.altKey ? 7500 : 750)
                .attr("transform", function (d) {
                    return "translate(" + x(d.x ) + "," + y(d.y ) + ")";
                });

            t.select("rect")
                .attr("width", function (d) {
                    return kx * d.dx - 1;
                })
                .attr("height", function (d) {
                    return ky * d.dy - 1;
                })

            t.select("text")
                .attr("x", function (d) {
                    return kx * d.dx / 2;
                })
                .attr("y", function (d) {
                    return ky * d.dy / 2;
                })
                .style("opacity", function (d) {
                    return kx * d.dx > d.w ? 1 : 0;
                });

            node = d;
            //no need to stop propogation on brush events
            if(d3.event.type != "brush"){d3.event.stopPropagation();}
        }
    });
}

