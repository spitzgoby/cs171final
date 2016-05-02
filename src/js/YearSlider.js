function YearSlider(parentElem, range) {
  this.parentElem = parentElem;
  this.range = range;
  this.years = d3.range(range[0], range[1]+1);
  this.topYear = range[1];
  this.bottomYear = range[1];
  
  this.colors = {
    markers: {
      top: {
        hover: '#756BB1',
        normal: '#54278F'
      },
      bottom: {
        hover: '#6CD16C',
        normal: '#23A923' 
      }
    }
  };
}

YearSlider.prototype.question = function(text) {
  if (text) {
    this.descriptiveText = text;
    return this;
  }
  
  return this.descriptiveText;
}

YearSlider.prototype.eventHandler = function(handler) {
  if (handler) {
    this._eventHandler = handler;
    this._eventHandler.on('resize', this, this.handleResize);
    
    return this;
  }
  
  return this._eventHandler;
}

YearSlider.prototype.initVis = function() {
  // grab reference to vis
  var vis = this;
  
  /*** SIZES AND SVG ***/
  vis.margin = { top: 10, right: 20, bottom: 10, left: 20};
  vis.marker = {radius: 10};
  vis.axis = {tick: {height: 10}};
  
  vis.svg = d3.select('#'+vis.parentElem).append('svg');
  vis.slider = vis.svg.append('g');
  
  /*** SCALE ***/
  vis.x = d3.scale.linear()
    .domain(vis.range);
  
  /* * DRAWING GROUPS ***/
  vis.dualSlider = vis.slider.append('g').classed('slider dual', true);
  vis.topSlider = vis.slider.append('g').classed('slider top', true);
  vis.bottomSlider = vis.slider.append('g').classed('slider bottom', true);
  
  vis.yearsText = vis.slider.append('g').classed('years', true);
  
  vis.topAxis = vis.topSlider.append('g').classed('axis top-axis', true);
  vis.bottomAxis = vis.bottomSlider.append('g').classed('axis bottom', true);
    
  vis.topAxisLine = vis.topAxis.append('line').attr('stroke-width', 4);
  vis.bottomAxisLine = vis.bottomAxis.append('line').attr('stroke-width', 4);
  
  /*** SLIDER TEXT ***/
  vis.topText = vis.topSlider.append('text')
    .classed('axis-label top', true)
    .text('Death Rate')
    .attr('text-anchor', 'middle');
  vis.bottomText = vis.bottomSlider.append('text')
    .classed('axis-label bottom', true)
    .text('Factor Data')
    .attr('text-anchor', 'middle');
  
  vis.questionButton = vis.slider.append('text')
    .classed('slider question', true)
    .html('&#xf29c')
    .on('click', function(d) {vis.questionClicked();});
  
  vis.yearsText.selectAll('text')
    .data(vis.years).enter()
    .append('text')
      .text(function(d) { return d; })
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(90)')
  
  /*** DRAG BEHAVIOR ***/
  vis.dragTopMarker = d3.behavior.drag()
    .on('dragstart', function(d) { vis.topMarkerStartedDragging(d); })
    .on('drag', function(d) { vis.markerDragged(d); })
    .on('dragend', function(d) { vis.markerEndedDragging(d); });
  vis.dragBottomMarker = d3.behavior.drag()
    .on('dragstart', function(d) { vis.bottomMarkerStartedDragging(d); })
    .on('drag', function(d) { vis.markerDragged(d); })
    .on('dragend', function(d) { vis.markerEndedDragging(d); });
  
  // resize within bounds
  vis.resize();

  // return vis for chaining
  return vis;
}

YearSlider.prototype.resize = function() {
  // grab reference to vis
  var vis = this;
  
  // update width with new parameters
  vis.width = parseInt(d3.select('#'+vis.parentElem).style('width')) - vis.margin.left - vis.margin.right;
  vis.height = (1/3) * vis.width;
  
  /*** RESIZE SVG AND MAIN GROUP ***/
  vis.svg
    .attr('width', vis.width + vis.margin.left + vis.margin.right)
    .attr('height', vis.height + vis.margin.top + vis.margin.bottom);
  vis.slider
    .attr('transform', 'translate('+ vis.margin.left +','+ vis.margin.top +')');
    
  vis.topText.attr('x', vis.width/2)
    .attr('y', -15);
  vis.bottomText.attr('x', vis.width/2)
    .attr('y', 25);
  /*** UPDATE SCALE ***/
  vis.x.range([0, vis.width]);
  
  /*** RESIZE DRAWING GROUPS ***/
  vis.topSlider.attr('transform', 'translate(0,'+ Math.floor(vis.height / 4) +')');
  vis.bottomSlider.attr('transform', 'translate(0,'+ vis.height / 4 * 3 +')');
  vis.dualSlider.attr('transform', 'translate(0,'+ (vis.height / 4) +')');
  
  vis.topAxisLine
    .attr('x0', 0)
    .attr('x1', vis.width);
  vis.bottomAxisLine
    .attr('x0', 0)
    .attr('x1', vis.width);
  
  vis.yearsText
    .attr('transform', 'translate(0,'+ vis.height/2 +')');     
    
  vis.yearsText.selectAll('text')
    .attr('y', function(d) { return -vis.x(d) + 4; });
  
  vis.questionButton.attr('x', vis.width)
    .attr('y', vis.height + 5);
  
  // update visualization now that size is set
  vis.update();
  
  // return vis for chaining
  return vis;
}

YearSlider.prototype.update = function() {
  var vis = this;
  
  vis.updateMarkers();
  vis.updateText();
}

YearSlider.prototype.updateText = function() {
  var vis = this;
  
  var maxYear = d3.max([vis.topYear, vis.bottomYear]);
  var minYear = d3.min([vis.topYear, vis.bottomYear]);
  
  vis.yearsText.selectAll('text')
    .attr('font-weight', function(d) {
      return (d >= minYear && d <= maxYear) ? 'bold' : 'lighter';
    })
    .attr('fill', function(d) {
      return (d >= minYear && d <= maxYear) ? '#fff' : '#333';
    });
}

YearSlider.prototype.updateMarkers = function() {
  var vis = this;
  
  var draggingBoxData;
  if (vis.bottomYear < vis.topYear) {
    draggingBoxData = [{left:vis.bottomYear, right:vis.topYear}];
  } else {
    draggingBoxData = [{left:vis.topYear, right:vis.bottomYear}];
  }
  
  var draggingBox = vis.dualSlider.selectAll('rect').data(draggingBoxData);
  draggingBox.enter().append('rect')
    .classed('dragging-box', true)
    .attr('fill', '#000')
    .attr('opacity', 0.8);
  
  draggingBox.transition().duration(250)
    .attr('x', function(d) { return vis.x(d.left) - vis.marker.radius;})
    .attr('width', function(d) { return vis.x(d.right) - vis.x(d.left) + 2*vis.marker.radius;})
    .attr('height', vis.height/2);
  
  var topMarker = vis.topSlider.selectAll('circle').data([vis.topYear]);
  // enter
  topMarker.enter()
    .append('circle')
      .attr('r', vis.marker.radius)
      .on('mouseover', function() {vis.changeMarkerColor(topMarker, vis.colors.markers.top.hover);})
      .on('mouseout', function() {vis.changeMarkerColor(topMarker, vis.colors.markers.top.normal);})
      .call(vis.dragTopMarker);
  // update  
  topMarker.transition().duration(250)
    .attr('cx', vis.x);
    
  var bottomMarker = vis.bottomSlider.selectAll('circle').data([vis.bottomYear]);
  // enter
  bottomMarker.enter()
    .append('circle')
      .attr('r', vis.marker.radius)
      .on('mouseover', function() {vis.changeMarkerColor(bottomMarker, vis.colors.markers.bottom.hover);})
      .on('mouseout', function() {vis.changeMarkerColor(bottomMarker, vis.colors.markers.bottom.normal);})
      .call(vis.dragBottomMarker);
  // update
  bottomMarker.transition().duration(250)
    .attr('cx', vis.x);
}

YearSlider.prototype.changeMarkerColor = function(marker, color) {
  marker.attr('fill', color);
}

YearSlider.prototype.handleResize = function(event) {
  this.resize();
}

/***--------------------------***
 *** MARKER DRAGGING BEHAVIOR ***
 ***--------------------------***/
 
YearSlider.prototype.topMarkerStartedDragging = function(d) {
  this.draggingSlider = 'topSlider';
  this.draggingYear = 'topYear';
  this.markerStartedDragging(d);
}

YearSlider.prototype.bottomMarkerStartedDragging = function(d) {
  this.draggingSlider = 'bottomSlider';
  this.draggingYear = 'bottomYear';
  this.markerStartedDragging(d);
}

YearSlider.prototype.markerStartedDragging = function(d) {
  this[this.draggingSlider].selectAll('circle').classed('dragging', true);
}

YearSlider.prototype.markerDragged = function(d) {
  var vis = this;
  // redraw objects as drag moves
  // dragging should not extend objects outside of the slider's svg
  var x = d3.min([d3.max([d3.event.x, 0]), vis.width]);
  vis[vis.draggingSlider].select('circle').attr('cx', x);
  vis[vis.draggingYear] = Math.round(vis.x.invert(x));
  vis.updateText();
}

YearSlider.prototype.markerEndedDragging = function(d) {
  // set new year values and call update to animate transition into stopping point
  // broadcast new year values
  this[this.draggingSlider].selectAll('circle').classed('dragging', false);
  this.updateMarkers();
  this.eventHandler().broadcast({
    name:'update', 
    options:{
      years: [parseYear(this.topYear.toString()), parseYear(this.bottomYear.toString())]
    }
  });
}

YearSlider.prototype.questionClicked = function() {
  this.eventHandler().broadcast({
    name:'question-clicked',
    options: {}
  });
}












