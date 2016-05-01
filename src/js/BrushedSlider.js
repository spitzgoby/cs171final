
    var brushedSlider = d3.select("#treemap-area")
        .append("svg")
        .attr("class", "slider")
        .attr("width", width)
        .attr("height", height/9)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
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