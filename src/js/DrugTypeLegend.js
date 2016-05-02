/*--------------------*
 *** INITIALIZATION ***
 *--------------------*/
 
/**
 * Creates a new DrugTypeLegend
 *
 * @param parentElem  The DOM element within which the legend should be drawn
 * @param types       The drug types displayed in the legend
 * @return DrugTypeLegend
 */
function DrugTypeLegend(parentElem, types) {
  this.parentElem = parentElem;
  this.types = types;
}

/**
 * If a handler is specified the legend updates its event handler and registers 
 * listeners for the events for which it's interested. The receiving object is 
 * returned.
 * If no handler is given returns the object's current handler.
 *
 * @param handler (OptionaL)  The event handler for the object
 * @return DrugTypeLegend|EventHandler
 */
DrugTypeLegend.prototype.eventHandler = function(eventHandler) {
  if (eventHandler) {
    this._eventHandler = eventHandler;
    this._eventHandler.on('resize', this, this.handleResize);
    
    return this;
  }
  
  return this._eventHandler;
}

/**
 * Initializes the drug legend's svg and groups
 *
 * @return DrugTypeLegend
 */
DrugTypeLegend.prototype.initVis = function() {
  var vis = this;
    
  vis.svg = d3.select('#'+vis.parentElem).append('svg');
  vis.legend = vis.svg.append('g').classed('legend', true);
  
  vis.resize();
  
  return vis;
}


/*--------------*
 *** RESIZING ***
 *--------------*/
 

/**
 * Resizes the visualization according to the width of its parent element
 *
 * @return DrugTypeLegend
 */
DrugTypeLegend.prototype.resize = function() {
  var vis = this;
  vis.margin = {top: 10, right: 100, bottom: 10, left: 100};
  vis.width = parseInt(d3.select('#'+vis.parentElem).style('width')) - vis.margin.left - vis.margin.right,
  vis.height = 50 - vis.margin.top - vis.margin.bottom;
  
  vis.svg
    .attr("width", vis.width + vis.margin.left + vis.margin.right)
    .attr("height", vis.height + vis.margin.top + vis.margin.bottom);
  
  vis.legend.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");
  
  vis.update();
  
  return vis;
}


/*---------------------------*
 *** DRAWING VISUALIZATION ***
 *---------------------------*/

/**
 * Updates the visualization
 *
 * @return DrugTypeLegend
 */
DrugTypeLegend.prototype.update = function() {
  var vis = this;
  
  // get width of each legend element
  var elementWidth = vis.width/vis.types.length;
  var elements = vis.legend.selectAll("g").data(vis.types);
  
  // enter
  var elementsEnter = elements.enter().append("g")
    .attr("class", "legend")
    .attr('width', elementWidth);
    
  elementsEnter.append('rect');
  elementsEnter.append('text')
    .attr("dy", ".35em")
    .attr("text-anchor", "middle");
  
  // update
  elements
    .attr('transform', function(d,i) {
      return 'translate('+ (i * elementWidth) +',0)';
    });
    
  elements.selectAll('rect')
    .attr("width", 10)
    .attr("height", 10)
    .attr('x', (elementWidth/2) - 5)
    .style("fill", function(d) { return drugColors(d); });

  elements.selectAll('text')
    .text(function(d) { return d.replace('_', ' '); })
    .attr("x", elementWidth/2)
    .attr("y", 30);
  
  return vis;
}


/*--------------*
 *** RESIZING ***
 *--------------*/

/**
 * Responds to resize events
 *
 * @return DrugTypeLegend
 */
DrugTypeLegend.prototype.handleResize = function(event) {
  this.resize();
}
