
function StackedAreaChart(parentElem, chartElem, data) {
  this.parentElem = parentElem;
  this.chartElem = chartElem;
  this.data = data;
}

StackedAreaChart.prototype.eventHandler = function(eventHandler) {
  if (eventHandler) {
    this._eventHandler = eventHandler;
    this._eventHandler.on('resize', this, this.handleResize);
    this._eventHandler.on('switchView', this, this.switchView);
    
    return this;
  }
  
  return this._eventHandler;
}

StackedAreaChart.prototype.handleResize = function(event) {
  this.resize();
}

StackedAreaChart.prototype.switchView = function(event) {
  var vis = this;
  var opacity = (vis.graph.attr('opacity') == 1) ? 0 : 1 ;
  vis.graph.transition().duration(1000)
    .attr('opacity', opacity);
}

StackedAreaChart.prototype.initVis = function() {
  var vis = this;
    
  vis.svg = d3.select('#'+vis.parentElem).selectAll('svg#'+vis.chartElem);
  if (vis.svg.empty()) {
    vis.svg = d3.select('#'+vis.parentElem).append('svg');
  }
  vis.graph = vis.svg.append('g')
    .classed('graph', true)
    .attr('opacity', 0); // stacked area chart starts invisible
  
  vis.x = d3.time.scale();
  vis.y = d3.scale.linear();
  
  vis.xAxis = d3.svg.axis()
    .scale(vis.x)
    .orient("bottom");
  vis.yAxis = d3.svg.axis()
    .orient("left")
    .scale(vis.y)
    .tickFormat(d3.format(",.0f"));
    
  vis.xAxisG = vis.graph.append("g")
    .attr("class", "x axis");
  vis.yAxisG = vis.graph.append("g")
    .attr("class", "y axis")
      
  vis.area = d3.svg.area()
    .x(function(d) { return vis.x(d.date); })
    .y0(function(d) { return vis.y(d.y0); })
    .y1(function(d) { return vis.y(d.y0 + d.y); });
  vis.stack = d3.layout.stack()
    .values(function(d) { return d.values; });
      
  vis.tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function(d) {
      return ""+
        "<table>"+ 
          "<th>Substance Type: "+ d.name +"</th>"+ 
          vis.makeSubstanceTable(d.values)+ 
        "</table>";
    });
  vis.graph.call(vis.tip);
  
  vis.resize();
}

StackedAreaChart.prototype.resize = function() {
  var vis = this;
  vis.margin = {top: 10, right: 100, bottom: 30, left: 100},
  vis.width = parseInt(d3.select('#'+vis.parentElem).style('width')) - vis.margin.left - vis.margin.right,
  vis.height = vis.width * .66 - vis.margin.top - vis.margin.bottom;
  
  vis.svg
    .attr('width', vis.width + vis.margin.left + vis.margin.right)
    .attr('height', vis.height + vis.margin.top + vis.margin.bottom);
  
  vis.graph
    .attr('transform', 'translate('+ vis.margin.left +','+ vis.margin.top +')');
  
  vis.x.range([0, vis.width]);
  vis.y.range([vis.height, 0]);
  
  vis.xAxisG.attr("transform", "translate(0," + vis.height + ")");
  
  vis.update();
}

StackedAreaChart.prototype.wrangleData = function(options) {
  var vis = this;
  
  vis.displayData = vis.stack(Object.keys(vis.data[0]).filter(function(k) { return k !== 'date';})
    .map(function(substance) {
      return {
        name: substance,
        values: vis.data.map(function(d) { return { date: d.date, y: d[substance]}; }) 
      };
    }));
  console.log(vis.displayData);
}

StackedAreaChart.prototype.update = function(options) {
  var vis = this;
  
  vis.wrangleData(options);
  
  vis.x.domain(d3.extent(vis.data, function(d) { return d.date; }));
  vis.y.domain([0, 2100000]);
  
  vis.stack(vis.displayData);
  
  var substances = vis.graph.selectAll(".substance").data(vis.displayData);
  
  var substancesEnter = substances.enter().append("g")
    .attr("class", "substance");

  substancesEnter.append("path")
    .attr("class", "area");
  substances.selectAll('path.area')
    .attr("d", function(d) { return vis.area(d.values); })
    .attr("fill", function(d) { return drugColors(d.name); })
    .attr('stroke-width', 2)
    .on('mouseover', function(d) { vis.highlightSubstance(d) })
    .on('mouseout', function(d) { vis.unhighlightSubstance(d) });

  vis.xAxisG.call(vis.xAxis);
  vis.yAxisG.call(vis.yAxis);
}

StackedAreaChart.prototype.highlightSubstance = function(d) {
  var vis = this;
  if (vis.graph.attr('opacity') == 1) {
    vis.tip.show(d);
  }
  
  return vis;
}

StackedAreaChart.prototype.unhighlightSubstance = function(d) {
  var vis = this;
  vis.tip.hide(d);
  
  return vis;
}

StackedAreaChart.prototype.makeSubstanceTable = function(data){
  table = "<tr><td>Year</td><td>Admissions to Treatment</td>";
  for(var i=0;i<data.length;i++){
      table += "<tr>"+
              "<td>" + data[i].date.getFullYear() + "</td>" +
              "<td>" + (parseInt(data[i].y*2100000)) + "</td>" +
          "</tr>";
  }
  return table;
}