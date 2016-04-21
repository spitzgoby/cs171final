/**
 * Creates a new choropleth
 *
 * @param parentElem  The dom element within which the visualization should be
 *                    appended
 * @param topo        The topojson data for the choropleth's map
 * @param data        The death data with which to color the map
 * @return Choropleth
 */
function Choropleth(parentElem, topo, data) {
  this.parentElem = parentElem;
  this.topo = topo;
  this.data = data;
  this.displayData = {};
  
  this.sizeGroup = "medium";
  this.default = {
    duration: 1000
  };
}

/**
 * If an event handler is specified sets the choropleth's handler and adds 
 * the choropleth's listener callbacks. Returns the choropleth
 * If no event handler is specified returns the choropleth's current handler.
 *
 * @param handler The event handler to use with the choropleth
 * @return Choropleth|EventHandler
 */
Choropleth.prototype.eventHandler = function(handler) {
  if (handler) {
    this._eventHandler = handler;
    this._eventHandler.on('update', this, this.handleUpdate);
    this._eventHandler.on('resize', this, this.handleResize);
    this._eventHandler.on('mouseoverState', this, this.drawHighlight);
    this._eventHandler.on('mouseoutState', this, this.removeHighlight);
    return this;
  }
  
  return this._eventHandler;
}

/**
 * Creates SVG and initializes visualization variables.
 *
 * @return Choropleth
 */
Choropleth.prototype.initVis = function() {
  var vis = this;
  
  /* ** CREATE DRAWING AREA ** */
  vis.margin = { top: 100, right: 20, bottom: 20, left: 20 };
  vis.keyHeight = 80;
  vis.keyRectHeight = 20;
  vis.svg = d3.select('#'+vis.parentElem).append('svg')
    .classed('us-map', true);
  vis.graph = vis.svg.append('g');
  vis.key = vis.svg.append('g').classed('key', true);
  vis.keyTitle = vis.key.append('text')
    .text('Deaths Per 100,000')
    .classed('key-title', true)
    .attr('text-anchor', 'middle');
      
  /*** MAP DRAWING FUNCTIONS ***/
  vis.projection = d3.geo.albersUsa();
  vis.path = d3.geo.path()
    .projection(vis.projection);
    
  vis.resize();
  // return vis for chaining
  return vis;
}

/**
 * Responds to resize events by calling the visualization's resize method
 */
Choropleth.prototype.handleResize = function(event) {
  this.resize();
}

/**
 * Resizes the visualization and redraws it within its parent element.
 *
 * @return Choropleth
 */
Choropleth.prototype.resize = function() {
  var vis = this;
  
  vis.width = parseInt(d3.select('#'+vis.parentElem).style('width')) - vis.margin.left - vis.margin.right;
  vis.height = vis.width * .85 - vis.margin.top - vis.margin.bottom;
  
  vis.svg.attr('width', vis.width + vis.margin.left + vis.margin.right)
    .attr('height', vis.height + vis.margin.top + vis.margin.bottom + vis.keyHeight);
    
  vis.key.attr('transform', 'translate(0,40)');
  vis.keyTitle.attr('x', vis.width/2)
    .attr('y', 10);
      
  vis.graph.attr('transform', 'translate('+ vis.margin.left +','+ vis.margin.top +')');
  vis.keyWidth = Math.floor((1/6)*vis.width);
    
  vis.projection.scale(vis.width * 1.35)
    .translate([vis.width/2, vis.height/2]);
    
  vis.update({ duration: 0, });
  
  return vis;
}

Choropleth.prototype.keyLabelOffset = function() {
  if (this.sizeGroup == 'medium') {
    return 55;
  } else {
    return 50;
  }
}

Choropleth.prototype.fontSize = function() {
  if (this.sizeGroup == "medium") {
    return '14px';
  } else {
    return '12px';
  }
}


Choropleth.prototype.wrangleData = function(options) {
  var deathRateYear;
  if (!options || !options.years) {
    deathRateYear = parseYear('2014');
  } else {
    deathRateYear = options.years[0];
  }
  
  var vis = this;
  // empty object to hold filtered data
  vis.displayData = vis.data.map(function(state) {
    // filter out years falling beyond given date range
    return {
      id: state.id,
      death_rate: state.years.reduce(function(prev, year) {
        return prev + (year.year.getTime() == deathRateYear.getTime() ? year.death_rate : 0);
      }, 0)
    };
  });
}

/**
 * Handles update events by calling the visualizations update method
 */
Choropleth.prototype.handleUpdate = function(event) {
  this.update(event.options);
}

/**
 * Updates the visualization according to the new data year
 * Accepted Options:
 *  years:    An array of year objects where the first year corresponds with 
 *            death rate data
 *  duration: The duration (in milliseconds) that transitions should last
 *
 * @param options Options for redrawing the visualization 
 * @return Choropleth
 */
Choropleth.prototype.update = function(options) {
  var vis = this;
  vis.wrangleData(options);
  
  var duration = options.duration ? options.duration : vis.default.duration;
  // change colors domain
  colors.domain([0, 1, 5, 10, 15, 20]);
  var keyRects = vis.key.selectAll('rect').data(colors.domain());
  keyRects.enter().append('rect')
    .classed('key-rect', true);
  keyRects.transition().duration(duration)
    .attr('x', function(d, i) { return i * vis.keyWidth; })
    .attr('y', vis.keyRectHeight)
    .attr('width', vis.keyWidth)
    .attr('height', vis.keyRectHeight)
    .attr('fill', function(d) { return colors(d); });
  
  var keyLabels = vis.key.selectAll('.key-label').data(colors.domain())
  keyLabels.enter().append('text')
    .classed('key-label', true);
  keyLabels.transition().duration(duration)
    .text(function(d, i) { 
      if (i == colors.domain().length - 1) return d +'+';
      return d; 
    })
    .attr('x', function(d,i) { return i * vis.keyWidth + 2;})
    .attr('y', vis.keyLabelOffset());
    
  
  vis.states = vis.graph.selectAll('path')
    .data(topojson.feature(vis.topo, vis.topo.objects.usa).features);
  vis.states.enter()
    .append('path')
      .classed('state', true)
      .on('mouseover', function(d) { vis.highlightState(d); })
      .on('mouseout', function(d) { vis.unhighlightState(d); });
  vis.states.transition().duration(duration)
    .attr('d', vis.path)
    .attr('fill', function(d, i) { 
      return colors(vis.displayData[i].death_rate); });
  
  return vis;
}

/**
 * Draws a highlight around the given state and broadcasts the highlight event
 *
 * @param d The state topojson path that triggered the highlight event
 */
Choropleth.prototype.highlightState = function(d) {
  this.drawHighlight(d).eventHandler().broadcast({ name: 'mouseoverState', id: d.id }, this);
}

/**
 * Removes the highlight from the given state and broadcasts the unhighlight 
 * event
 *
 * @param d The state topojson path that triggered the unhighlight event
 */
Choropleth.prototype.unhighlightState = function(d) {
  this.removeHighlight(d).eventHandler().broadcast({ name: 'mouseoutState', id: d.id }, this);
}

/**
 * Draws a red ring around the highlighted state
 *
 * @param d The path of the state being highlighted
 * @return Choropleth
 */
Choropleth.prototype.drawHighlight = function(d) {
  this.states.filter(function(state) { return state.id == d.id})
    .classed('highlighted', true);
  return this;
}

/**
 * Removes the red ring from the unhighlighted state
 *
 * @param d The path of the state having its highlight removed
 * @return Choropleth
 */
Choropleth.prototype.removeHighlight = function(d) {
  this.states.filter(function(state) { return state.id == d.id; })
    .classed('highlighted', false);
  return this;
}

