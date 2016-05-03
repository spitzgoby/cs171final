
/*--------------------*
 *** INITIALIZATION ***
 *--------------------*/

/**
 * Creats a new SingleYearSlider
 *
 * @param parentElem  The DOM element within which the slider should be drawn
 * @param years       An array of years to show in the slider
 * @return SingleYearSlider
 */
function SingleYearSlider(parentElem, years) {
  this.parentElem = parentElem;
  this.years = years;
}

/**
 * If a handler is specified the Treemap updates its event handler and registers 
 * listeners for the events for which it's interested. The receiving object is 
 * returned.
 * If no handler is given returns the object's current handler.
 *
 * @param handler (OptionaL)  The event handler for the object
 * @return Treemap|EventHandler
 */
SingleYearSlider.prototype.eventHandler = function(eventHandler) {
  if (eventHandler) {
    this._eventHandler = eventHandler;
    
    return this;
  }
  
  return this._eventHandler;
}

/**
 * Initializes the visualization by appending the necessary svg groups and 
 * defining scales and axes. Should only be called once on a given stacked area
 * chart.
 *
 * @return SingleYearSlider
 */
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
  
  return vis;
}


/*--------------*
 *** RESIZING ***
 *--------------*/

/**
 * Resizes the visualization and redraws it within its parent element.
 *
 * @return SingleYearSlider
 */
SingleYearSlider.prototype.resize = function() {
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
  
  return vis;
}

/**
 * Updates the visualization according to the new data year
 * Accepted Options: (currently none)
 *
 * @param options Options for redrawing the visualization 
 * @return SingleYearSlider
 */
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


/*--------------------*
 *** EVENT HANDLERS ***
 *--------------------*/
 
/**
 * Handles brush events by moving the slider handle and broadcasting the change 
 * in years.
 *
 * @return SingleYearSlider
 */
SingleYearSlider.prototype.brushed = function() {
  var horizontalOffset = (parseInt(d3.select("body").style('width')) - this.width) / 2;
  var vis = this;
  var value = Math.round(vis.brush.extent()[0]);
  if (d3.event.sourceEvent) { // not a programmatic event
    value = Math.round(vis.x.invert(d3.event.sourceEvent.x - horizontalOffset));
    this.eventHandler().broadcast({ name:'updateDrugs', year:value}, vis);
  }

  vis.handle.attr("cx", vis.x(value));
  
  return vis;
}

/**
 * Handles resize events 
 *
 * @return SingleYearSlider
 */
SingleYearSlider.prototype.handleResize = function(event) {
  var vis = this;
  
  vis.resize();
  
  return vis;
}