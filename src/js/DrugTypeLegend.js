
var legend = d3.select("#treemap-area")
    .append("svg")
    .attr("class", "legend")
    .attr("width", width * 0.9)
    .attr("height", height/9)
    .attr("transform", "translate(" + margin.left + "," + 0 + ")");
    
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