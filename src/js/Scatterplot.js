
/*--------------------*
 *** INITIALIZATION ***
 *--------------------*/

/**
 * Creates a new Scatterplot visualization
 *
 * @param parentElem    The ID of the DOM element within which the visualization
 *                      should be drawn.
 * @param handler       The event handler for the visualization
 * @param deaths        An array of death data sorted alphabetically by state
 * @param income        An array of income data sorted alphabetically by state
 * @param unemployment  An array of unemployment data sorted alphabetically by 
 *                      state
 * @return Scatterplot
 */
function Scatterplot(parentElem, factor, deaths, income, unemployment) {
  this.parentElem = parentElem;
  this.data = {
    'death_rate': {
      data: deaths,
      name: 'Deaths Per 100,000',
      format: formatIdentity,
      domain: [
        d3.min(deaths, function(d) { return d3.min(d.years, function(d) {return d.death_rate; }); }),
        d3.max(deaths, function(d) { return d3.max(d.years, function(d) {return d.death_rate; }); })
      ]
    },
    'median_income': {
      data: income,
      name: 'Median Income (1000s)',
      shortName: 'Median Income',
      format: formatCurrency,
      domain: [
        d3.min(income, function(d) { return d3.min(d.years, function(d) {return d.median_income; }); }),
        d3.max(income, function(d) { return d3.max(d.years, function(d) {return d.median_income; }); })
      ]
    },
    'unemployment': {
      data: unemployment,
      name: 'Unemployment Rate',
      shortName: 'Unemployment Rate',
      format: formatPercent,
      domain: [
        d3.min(unemployment, function(d) { return d3.min(d.years, function(d) {return d.unemployment; }); }),
        d3.max(unemployment, function(d) { return d3.max(d.years, function(d) {return d.unemployment; }); })
      ]
    }
  };
  
  this.factor = factor;
  this.factorYear = parseYear('2014');
  this.deathRateYear = parseYear('2014');
  
  this.displayData = {};
  this.regression = new Regression();
  
  this.sizeGroup = "medium";
  this.default = {
    duration: 1000
  }
}

/**
 * If a handler is specified the Scatterplot updates its event handler and 
 * registers listeners for the events for which it's interested. The receiving
 * object is returned.
 * If no handler is given returns the objects current handler.
 *
 * @param handler (Optional) The event handler for the object
 * @return EventHandler|Scatterplot
 */
Scatterplot.prototype.eventHandler = function(handler) {
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
 * Initalizes the visualization by appending and sizing the containing SVG 
 * before defining scales and axes. Should only be called once on a given 
 * scatter plot.
 *
 * @return Scatterplot
 */
Scatterplot.prototype.initVis = function() {
  // grab reference to self
  var vis = this;
  
  /*** SVG DRAWING AREA ***/
  vis.margin = {top: 20, right: 20, bottom: 40, left: 70};
  vis.padding = {x: 10, y: 10};
      
  vis.svg = d3.select('#'+vis.parentElem).append('svg');
  vis.graph = vis.svg.append('g');
  
  vis.title = vis.graph.append('text')
    .text('What Factors Influence Drug Deaths?')
    .attr('text-anchor', 'middle')
    .attr('font-weight', 'bold');
      
  /*** CHART DATA ELEMENTS ***/
  vis.scatter = vis.graph.append('g')
    .classed('scatter-plot', true);
    
  vis.bfl = vis.graph.append('g')
    .classed('best-fit', true);
    
  vis.x = d3.scale.linear();
  vis.y = d3.scale.linear();
    
  /*** CHART AXES ***/
  vis.xAxisG = vis.graph.append('g')
    .classed('axis x-axis', true);
    
  vis.yAxisG = vis.graph.append('g')
    .classed('axis y-axis', true);
    
  vis.xAxis = d3.svg.axis()
    .scale(vis.x)
    .ticks(6)
    .orient('bottom');
    
  vis.yAxis = d3.svg.axis()
    .scale(vis.y)
    .orient('left');
    
  vis.xTitle = vis.xAxisG.append('text')
    .classed('axis-label', true)
    .attr('text-anchor', 'middle');
    
  vis.yTitle = vis.yAxisG.append('text')
    .classed('axis-label', true)
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'middle')
    .text('Deaths per 100,000');
    
  vis.stateTip = d3.tip()
    .attr('class', 'd3-tip')
    .direction('s')
    .offset([5,0])
    .html(function(d) {
      return ''+
        '<h4>'+ d.id +'</h4><p>'+
          '<span class="tip-header">Death Rate: <span class="death-rate">'+ 
            d.death_rate +'</span></span><br>'+
          '<span class="tip-header">'+ vis.data[vis.factor].name +
            ': <span class="factor">'+ vis.data[vis.factor].format(d.factor) +'</span></span></p>';
    });
  vis.graph.call(vis.stateTip);
  
  vis.bflTip = d3.tip()
    .attr('class', 'd3-tip')
    .direction('s')
    .offset([5,0])
    .html(function(d) {
      return ''+
        '<span class="tip-header">Death Rate <span class="tip-death-rate">('
          + formatYear(vis.deathRateYear) +')</span></span><br>'+
        '<span class="tip-header">'+ vis.data[vis.factor].shortName +
          ' <span class="tip-factor">('+ formatYear(vis.factorYear) +')</span></span><br>'+
        '<span class="tip-header">Correlation: '+ d.correlation.toFixed(2) +'</span>'+
        '<span class="more-info">Click for detailed information</span>';
    });
  vis.graph.call(vis.bflTip);
  
  vis.resize();
  
  // return vis for chaining
  return vis;
}

/*------------*
 *** SIZING ***
 *------------*/

Scatterplot.prototype.labelFontSize = function() {
  if (this.sizeGroup == 'medium') return '10pt'; 
  return '8pt';
}

Scatterplot.prototype.yAxisTicks = function() {
  if (this.sizeGroup == 'medium') return 10;
  return 4;
}

/**
 * Resizes the visualization according to its parent within the DOM. 
 *
 * @return Scatterplot
 */
Scatterplot.prototype.resize = function() {
  var vis = this;
  
  // grab width of current container
  vis.width = parseInt(d3.select('#'+vis.parentElem).style('width')) - vis.margin.left - vis.margin.right;
  vis.height = vis.width;
  
  // update size group
  vis.sizeGroup = (vis.width > 256) ? 'medium' : 'small';
    
  // resize svg, reset margin
  vis.svg.attr('width', vis.width + vis.margin.left + vis.margin.right)
    .attr('height', vis.height + vis.margin.top + vis.margin.bottom);
  vis.graph.attr('transform', 'translate('+ vis.margin.left +','+ vis.margin.top +')');
  
  vis.title.attr('x', vis.width/2)
    .attr('y', 6)
    .attr('font-size', vis.labelFontSize());
  // change scale drawing range
  vis.x.range([vis.padding.x, vis.width-vis.padding.x]);
  vis.y.range([vis.height-vis.padding.y, vis.padding.y]);
  // update axis offests and title positions
  vis.xAxisG.attr('transform', 'translate(0, '+ vis.height +')');
  vis.xTitle.attr('x', vis.width/2)
    .attr('y', vis.margin.bottom-2);
    
  vis.yAxis.ticks(vis.yAxisTicks());
  vis.yTitle.attr('x', -vis.width/2)
    .attr('y', -vis.margin.left * (3/4) );
  
  // update vis with default options now that svg has been resized
  vis.update(vis.default);
  
  // return vis for chaining
  return vis;
}


/*---------------------------*
 *** DRAWING VISUALIZATION ***
 *---------------------------*/

/**
 * Filters the visualizations data by year according to the given options 
 * Accepted Options:
 *  year: The year for which to show data on the x axis
 *
 * @param options (Optional) An object containing options for manipulating data 
 * @return Scatterplot
 */
Scatterplot.prototype.wrangleData = function(options) {
  var vis = this;
  
  if (!options) {
    // create local shadow variable so shared object doesn't change
    var options = {};
  }
  
  vis.deathRateYear = options.years ? options.years[0] : vis.deathRateYear; 
  vis.factorYear = options.years ? options.years[1] : vis.factorYear;
  vis.factor = options.factor ? options.factor : vis.factor;
  
  // wrangled data is placed into variable displayData
  vis.displayData = vis.data[vis.factor].data.reduce(function(prev, current, i) {
    // skip any national data
    if (current.id === 'United States') {
      return prev;
    }
    
    // grab corresponding state death and factor data
    var deaths = vis.data['death_rate'].data[i];
    var factorData = vis.data[vis.factor].data[i];
    
    // get data only from specified year
    deathYearData = deaths.years.filter(function(y) { 
      return y.year.getTime() == vis.deathRateYear.getTime(); })[0];
    factorYearData = factorData.years.filter(function(y) {
      return y.year.getTime() == vis.factorYear.getTime(); })[0];
    
    // add an object with the state's data to the array
    prev.push({
      id: current.id,
      death_rate: deathYearData.death_rate,
      factor: factorYearData[vis.factor]
    });
    return prev; 
  }, []);
  
  // return vis for chaining
  return vis;
}

/**
 * Updates the visualization by updating display data according to the given
 * options and redrawing the scatterplot accordingly.
 * Accepted Options:
 *  year: The year to use when drawing the x axis (default is most recent)
 *  duration: The duration of any trasnitions (default is 0)
 *
 * @param options The options for updating the scatterplot.
 * @return Scatterplot
 */
Scatterplot.prototype.update = function(options) {
  var vis = this;
  
  // update display data
  vis.wrangleData(options);
  
  var duration = options.duration ? options.duration : vis.default.duration;
  // update x and y domains according to new data
  vis.x.domain(vis.data[vis.factor].domain);
  vis.y.domain([0, 35]);
  
  // redraw axes
  vis.xTitle
    .html(vis.data[vis.factor].name +
      ' <tspan class="factor">('+ formatYear(vis.factorYear) +')</tspan>')
    .attr('font-size', vis.labelFontSize());
    
  vis.yTitle
    .html(vis.data.death_rate.name +
      ' <tspan class="death_rate">('+ formatYear(vis.deathRateYear) +')</tspan>')
    .attr('font-size', vis.labelFontSize());
  
  vis.xAxis.tickFormat(vis.data[vis.factor].format);
  vis.xAxisG.transition().duration(duration)
    .call(vis.xAxis);
  vis.yAxisG.transition().duration(duration)
    .call(vis.yAxis);
  // update scatter plot dots data
  vis.dots = vis.scatter.selectAll('circle').data(vis.displayData);
  // draw any new dots 
  vis.dots.enter()
    .append('circle')
      .attr('class', function(d) { return 'dot '+d.id.replace(' ', ''); })
      .attr('r', 5)
      .on('mouseover', vis.highlightState.bind(vis))
      .on('mouseout', vis.unhighlightState.bind(vis));
  // move existing dots into new position according to display data  
  vis.dots.transition().duration(duration)
    .attr('cx', function(d) { return vis.x(d.factor); })
    .attr('cy', function(d) { return vis.y(d.death_rate); })
    .attr('fill', function(d) { return colors(d.death_rate)});
      
  // get variables to pass to regression calculator
  var xSeries = vis.displayData.map(function(d) { return d.factor; });
  var ySeries = vis.displayData.map(function(d) { return d.death_rate;});
  var coeff = vis.regression.xSeries(xSeries)
    .ySeries(ySeries)
    .coefficients();
  
  // calculate best fit line path
  var bflData = [{x1: vis.x.domain()[0], y1: coeff[1],
                  x2: vis.x.domain()[1], y2: coeff[0] * vis.x.domain()[1] + coeff[1],
                  correlation: Math.sqrt(coeff[2])}];
  vis.regLine = vis.bfl.selectAll('line').data(bflData);
  // append best fit line (if necessary) or redraw with new data
  vis.regLine.enter().append('line')
    .classed('best-fit', true)
    .on('mouseover', function(d) { vis.highlightBFL(d); })
    .on('mouseout', function(d) { vis.unhighlightBFL(d); });
  vis.regLine.transition().duration(duration)
    .attr('x1', function(d) { return vis.x(d.x1); })
    .attr('y1', function(d) { return vis.y(d.y1); }) 
    .attr('x2', function(d) { return vis.x(d.x2); })
    .attr('y2', function(d) { return vis.y(d.y2); });
}

/*--------------------*
 *** EVENT HANDLERS ***
 *--------------------*/

/**
 * Handles 'resize' events by calling the visualizations resize method. 
 *
 * @param event The event object
 */
Scatterplot.prototype.handleResize = function(event) {
  this.resize();
}
 
/**
 * Handles 'update' events by calling the visualizations 'update' method
 *
 * @param event The event object created by the object that fired the event
 */
Scatterplot.prototype.handleUpdate = function(event) {
  this.update(event.options);
}


/**
 * Draws a red ring around highlighted dot and increases its size
 *
 * @return Scatterplot
 */
Scatterplot.prototype.drawHighlight = function(d) {
  var vis = this;
  vis.dots.filter(function(state) { return state.id == d.id; })
    .classed('highlighted', true)
    .attr('r', 10);
  vis.stateTip.show(vis.displayData[vis.stateIndex(d)]);
  // return vis for chaining
  return vis;
}

/**
 * Removes red ring around highlighted state and reduces its size back to the 
 * starting amount.
 *
 * @return Scatterplot
 */
Scatterplot.prototype.removeHighlight = function(d) {
  var vis = this;
  vis.dots.filter(function(state) { return state.id == d.id; })
    .classed('highlighted', false)
    .attr('r', 5);
  vis.stateTip.hide();
  // return vis for chaining
  return vis;
}

Scatterplot.prototype.highlightBFL = function(d) {
  this.regLine.classed('highlighted', true);
  this.bflTip.show(d);  
}

Scatterplot.prototype.unhighlightBFL = function(d) {
  this.regLine.classed('highlighted', false);
  this.bflTip.hide();
}

/**
 * Draws highlight around selected state and broadcasts event 
 *
 * @param d The dot of the state being highlighted
 */
Scatterplot.prototype.highlightState = function(d) {
  this.drawHighlight(d).eventHandler().broadcast({ name: 'mouseoverState', id: d.id }, this);
}

/**
 * Removes highlight from deselected state and broadcasts event
 *
 * @param d The dot of the state having its highlight removed
 */
Scatterplot.prototype.unhighlightState = function(d) {
  this.removeHighlight(d).eventHandler().broadcast({ name: 'mouseoutState', id: d.id }, this);
}

Scatterplot.prototype.stateIndex = function(d) {
  for (var i = 0; i < this.displayData.length; i++) {
    if (this.displayData[i].id == d.id) return i;
  }
  return 0;
}