
function SingleYearSlider(parentElem, years) {
  this.parentElem = parentElem;
  this.years = years;
}

SingleYearSlider.prototype.eventHandler = function(eventHandler) {
  if (eventHandler) {
    this._eventHandler = eventHandler;
    
    return this;
  }
  
  return this._eventHandler;
}

SingleYearSlider.prototype.initVis = function() {
  var vis = this;
  
  vis.svg = d3.select('#'+vis.parentElem).append("svg");
  vis.graph = vis.svg.append('g')
    .attr("class", "slider")

  vis.x = d3.scale.linear()
    .domain(vis.years)
    .clamp(true);

  vis.brush = d3.svg.brush()
    .x(vis.x)
    .on("brush", function() {vis.brushed();});

  vis.background = vis.graph.append("rect")
      .attr("class", "slider_background");
      
  vis.xAxis = d3.svg.axis()
    .scale(vis.x)
    .orient("bottom")
    .tickFormat(function (d) { return +d; })
    .tickSize(0)
    .tickPadding(12)
    
  vis.graph.append("g")
    .attr("class", "x axis")
    .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "halo");

  vis.slider = vis.graph.append("g")
    .attr("class", "slider")
    .call(vis.brush);

  vis.handle = vis.slider.append("circle")
    .attr("class", "handle")
    .attr("r", 9);
    
  vis.resize();
}

SingleYearSlider.prototype.resize = function(options) {
  var vis = this;
  
  vis.margin = { top: 10, left: 100, right: 100, bottom: 0};
  vis.width = parseInt(d3.select('#'+vis.parentElem).style('width')) - vis.margin.left - vis.margin.right,
  vis.height = 50 - vis.margin.top - vis.margin.bottom;
  vis.svg
    .attr("width", vis.width + vis.margin.right + vis.margin.left)
    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
    
  vis.x.range([0, vis.width]);
  
  vis.graph.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");
  vis.graph.call(vis.xAxis);
  
  vis.background
    .attr("height", 4)
    .attr("width", vis.width);
    
  vis.slider.select(".background")
    .attr("height", 100);
    
  vis.update({ year:vis.years[vis.years.length-1] });
}

SingleYearSlider.prototype.update = function(options) {
  var vis = this;
  
  var year = options.year;
  
  vis.slider
    .call(vis.brush.event)
    .transition()
    .duration(750)
    .call(vis.brush.extent([2013, 2013]))
    .call(vis.brush.event);
}

SingleYearSlider.prototype.brushed = function() {
  var vis = this;
  var value = Math.round(vis.brush.extent()[0]);
  if (d3.event.sourceEvent) { // not a programmatic event
    value = Math.round(vis.x.invert(d3.event.sourceEvent.x - vis.margin.left));
    this.eventHandler().broadcast({ name:'updateDrugs', year:value}, vis);
  }

  vis.handle.attr("cx", vis.x(value));
}