
function Treemap(parentElem, data) {
  this.parentElem = parentElem;
  this.treeData = data;
  this.year_index = data.years[1]-data.years[0];
}

Treemap.prototype.eventHandler = function(eventHandler) {
  if (eventHandler) {
    this._eventHandler = eventHandler;
    this._eventHandler.on('switchView', this, this.switchView);
    this._eventHandler.on('resize', this, this.handleResize);
    this._eventHandler.on('updateDrugs', this, this.handleUpdate);
    
    return this;
  }
  
  return this._eventHandler;
}

Treemap.prototype.switchView = function(event) {
  var vis = this;
  var opacity = vis.graph.attr('opacity');
  opacity = (opacity == 1) ? 0:1;
  vis.graph.transition().duration(1000)
    .attr('opacity', opacity);
}

Treemap.prototype.handleResize = function(event) {
  console.log('resizing');
  this.resize();
}

Treemap.prototype.handleUpdate = function(event) {
  var vis = this;
  var year_index = event.year - 2003;
  if (year_index != vis.year_index) {
    vis.year_index = event.year - 2003;
    vis.update();
  }
}

Treemap.prototype.initVis = function() {
  var vis = this;
  
  vis.svg = d3.select('#'+vis.parentElem).append('svg');
  vis.graph = vis.svg.append('g')
    .classed('chart', true)
    .attr('opacity', 1);
  
  vis.x = d3.scale.linear();
  vis.y = d3.scale.linear();
  
  vis.treemap = d3.layout.treemap()
    .round(false)
    .sticky(true)
    .value(function(d) { return d.size[vis.year_index]; });
    
  vis.resize();
}

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

Treemap.prototype.wrangleData = function(options) {
  // data needs no wrangling, this function placed here for consistency
  this.displayData = this.treeData;
}

Treemap.prototype.update = function(options) {
  var vis = this;
  
  vis.wrangleData(options);
        
  var node = vis.displayData;
  var root = vis.displayData;

  var nodes = vis.treemap.nodes(root)
      .filter(function(d) { return !d.children; });
      
  var cells = vis.graph.selectAll(".cell").data(nodes);
  
  // Enter
  var cellsEnter = cells.enter().append("g").attr("class", "cell")
      .on("click", function(d) { return vis.zoom(node == d.parent ? root : d.parent); });
  cellsEnter.append("rect")
    .style("fill", function(d) { return drugColors(d.parent.name); });
  cellsEnter.append("text")
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .text(function(d) { return d.name; })
  // Update        
  cells.transition().duration(1000)
    .attr("transform", function(d) { return "translate(" + ( d.x) + "," + ( + d.y) + ")"; })
  cells.selectAll('rect').transition().duration(1000)
    .attr("width", function(d) { return d.dx - 1; })
    .attr("height", function(d) { return d.dy - 1; })
  cells.selectAll('text').transition().duration(1000)
    .attr("x", function(d) { return d.dx / 2; })
    .attr("y", function(d) { return d.dy / 2; })
    .style("opacity", function(d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; })

  d3.select(window).on("click", function() { vis.zoom(root); });
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

  node = d;
  //no need to stop propogation on brush events
  if(d3.event.type != "brush"){d3.event.stopPropagation();}
}
