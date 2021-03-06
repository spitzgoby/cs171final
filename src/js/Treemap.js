
/*--------------------*
 *** INITIALIZATION ***
 *--------------------*/
 
/**
 * Creates a new treemap
 *
 * @param parentElem  The ID of the DOM element within which the visualization
 *                    should be drawn.
 * @param chartElem   The ID of the DOM SVG element within which the 
 *                    visualization should be drawn. 
 * @param data        An array of substance abuse data organized by year
 * @return Treemap
 */
function Treemap(parentElem, chartElem, data) {
  this.parentElem = parentElem;
  this.chartElem = chartElem;
  this.treeData = data;
  this.year_index = data.years[1]-data.years[0];
  this.visible = true;
  this.zoomed = false;
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
Treemap.prototype.eventHandler = function(eventHandler) {
  if (eventHandler) {
    this._eventHandler = eventHandler;
    this._eventHandler.on('switchView', this, this.switchView);
    this._eventHandler.on('updateDrugs', this, this.handleUpdate);
    
    return this;
  }
  
  return this._eventHandler;
}


/**
 * Initializes the visualization by appending the necessary svg groups and 
 * defining scales and axes. Should only be called once on a given stacked area
 * chart.
 *
 * @return StackedAreaChart
 */
Treemap.prototype.initVis = function() {
  var vis = this;
  
  d3.select('#chart-title').text('Drug Treatment Cases By Substance Type');
  
  vis.svg = d3.select('#'+vis.parentElem).selectAll('svg#'+vis.chartElem);
  if (vis.svg.empty()) {
    vis.svg = d3.select('#'+vis.parentElem).append('svg');
  }
  
  vis.graph = vis.svg.append('g')
    .classed('chart', true)
    .attr('opacity', 1);
  
  vis.x = d3.scale.linear();
  vis.y = d3.scale.linear();
  
  vis.treemap = d3.layout.treemap()
    .round(false)
    .sticky(true);

    /*** treemap TIP ***/
  vis.tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function(d) {
        return "Substance Type: "+ d.name + "<br> Number of People Seeking Treatment : " + StackedAreaChart.format(d.size[vis.year_index]);
    });
  vis.graph.call(vis.tip);

  vis.resize();
}


/*------------*
 *** SIZING ***
 *------------*/

/**
 * Resizes the visualization and redraws it within its parent element.
 *
 * @return Choropleth
 */
Treemap.prototype.resize = function() {
  var vis = this;
    
  vis.margin = {top: 25, right: 100, bottom: 30, left: 100};
  vis.width = parseInt(d3.select('#'+vis.parentElem).style('width')) - vis.margin.left - vis.margin.right,
  vis.height = vis.width * .66 - vis.margin.top - vis.margin.bottom,
  
  vis.svg
    .attr('width', vis.width + vis.margin.left + vis.margin.right)
    .attr('height', vis.height + vis.margin.top + vis.margin.bottom);
  
  vis.graph
    .attr('transform', 'translate('+ vis.margin.left +','+ vis.margin.top +')');
    
  vis.treemap.size([vis.width, vis.height]);
  vis.x.range([0, vis.width]);
  vis.y.range([0, vis.height]);

  vis.update();
}


/*---------------------------*
 *** DRAWING VISUALIZATION ***
 *---------------------------*/

/**
 * Coerces data into an array the state's ID and death rate.
 * Accepted Options: (currently none)
 *
 * @param options The options for wrangling data
 */
Treemap.prototype.wrangleData = function(options) {
  // data needs no wrangling, this function placed here for consistency
}

/**
 * Updates the visualization according to the new data year
 * Accepted Options: (currently none)
 *
 * @param options Options for redrawing the visualization 
 * @return Treemap
 */
Treemap.prototype.update = function(options) {
  var vis = this;
  
  vis.wrangleData(options);
  
  vis.displayData = JSON.parse(JSON.stringify(this.treeData));
  
  vis.treemap.value(function(d) { return d.size[vis.year_index]; });
  var nodes = vis.treemap.nodes(vis.displayData)
      .filter(function(d) { return !d.children; });
  vis.node = vis.displayData;
  var root = vis.displayData;
      
  var cells = vis.graph.selectAll(".cell").data(nodes);
  
  // Enter
  var cellsEnter = cells.enter().append("g").attr("class", "cell")
      .on("click", function(d) { return vis.zoom(vis.node === d.parent ? root : d.parent); });
  cellsEnter.append("rect")
    .style("fill", function(d) { return drugColors(d.parent.name); })
      .on('mouseover', function(d) { vis.highlightSubstance(d) })
      .on('mouseout', function(d) { vis.unhighlightSubstance(d) });
  cellsEnter.append("text")
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .text(function(d) { return d.name; });
    
  // Update        
  cells.transition().duration(1000)
    .attr("transform", function(d) { return "translate(" + (d.x) + "," + (d.y) + ")"; })
  cells.selectAll('rect').transition().duration(1000)
    .attr("width", function(d) { return d.dx - 1; })
    .attr("height", function(d) { return d.dy - 1; });

  cells.selectAll('text').transition().duration(1000)
    .attr("x", function(d) { return d.dx / 2; })
    .attr("y", function(d) { return d.dy / 2; })
    .style("opacity", function(d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; });
}

Treemap.prototype.zoom = function(d) {
  var vis = this;

  var kx = (vis.width) / d.dx, ky = (vis.height) / d.dy;
  vis.x.domain([d.x, d.x + d.dx]);
  vis.y.domain([d.y, d.y + d.dy]);

  var t = vis.graph.selectAll(".cell").transition()
    .duration(d3.event.altKey ? 7500 : 750)
    .attr("transform", function (d) {
        return "translate(" + vis.x(d.x ) + "," + vis.y(d.y ) + ")";
    });

  t.select("rect")
    .attr("width", function (d) { return kx * d.dx - 1; })
    .attr("height", function (d) { return ky * d.dy - 1; })

  t.select("text")
    .attr("x", function (d) { return kx * d.dx / 2; })
    .attr("y", function (d) { return ky * d.dy / 2; })
    .style("opacity", function (d) { return kx * d.dx > d.w ? 1 : 0; });

  vis.node = d;
  //no need to stop propogation on brush events
  if(d3.event.type != "brush"){d3.event.stopPropagation();}
  
  vis.zoomed = !vis.zoomed;
}

/**
 * Displays a d3 tip for the given substance
 *
 * @param d The substance data element that was highlighted
 * @return StackedAreaChart
 */
Treemap.prototype.highlightSubstance = function(d) {
    var vis = this;
    vis.tip.show(d);
    return vis;
}

/**
 * Removes a d3 tip from the given substance
 *
 * @param d The substance data element that was unhighlighted
 * @return StackedAreaChart
 */
Treemap.prototype.unhighlightSubstance = function(d) {
    var vis = this;
    vis.tip.hide(d);

    return vis;
}


/*--------------------*
 *** EVENT HANDLERS ***
 *--------------------*/

/**
 * Switch the opacity of the visualization
 *
 * @return Treemap
 */
Treemap.prototype.switchView = function(event) {
  var vis = this;
  // update visibility
  vis.visible = !vis.visible;
  var offset = vis.visible? vis.margin.left : -3000;
  // transition to new layout
  vis.graph.transition().duration(1000)
    .attr('transform', 'translate('+ offset +','+ vis.margin.top +')');
    
  return vis;
}

/**
 * Handles a resize event from the visualization's event handler.
 *
 * @return Treemap
 */
Treemap.prototype.handleResize = function(event) {
  this.resize();
  return this;
}

/**
 * Handles update events by calling the visualizations update method
 *
 * @param event Event data
 * @return Treemap
 */
Treemap.prototype.handleUpdate = function(event) {
  var vis = this;
  
  var year_index = event.year - 2003;
  if (year_index != vis.year_index) {
    vis.year_index = year_index;
    vis.update();
  }
  
  return vis;
}

Treemap.format = d3.format("0,000");