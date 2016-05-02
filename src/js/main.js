  
// convert year strings to date objects
var formatYear = d3.time.format('%Y');
var parseYear = formatYear.parse;

var formatPercent = d3.format('%');
var formatCurrency = d3.format('$');
var formatIdentity = function(str) { return str; };

// universal color scale
colorbrewer.Purples[6].unshift('#ffffff'); // unshift places white as the first color
var stateColors = d3.scale.quantile()
  .range(colorbrewer.Purples[6]);
var drugColors = d3.scale.category20();
    
/***---------------------***
 *** LOAD AND PARSE DATA ***
 ***---------------------***/
  
// load all data before cleaning
var dataLoaded = false;
var dataDir = 'data/';
d3_queue.queue()
  .defer(d3.json, dataDir+'topo_usa.json')
  .defer(d3.json, dataDir+'state_deaths.json')
  .defer(d3.json, dataDir+'state_income.json')
  .defer(d3.json, dataDir+'state_unemployment.json')
  .defer(d3.json, dataDir+'drug_use.json')
  .defer(d3.tsv, dataDir+'treatment2003_2013.tsv')
  .await(loadData);
  
// globals for data
function loadData(error, topo, deaths, income, unemployment, drugUse, treatment) {
  if (error) {
    console.log(error);
  } else {
    topo.objects.usa.geometries.sort(function(a,b) {
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });
    
    // convert death data from strings to numbers and dates
    deaths.forEach(function(state) {
      state.years.forEach(function(year) {
        year.death_rate = +year.death_rate;
        year.deaths = +year.deaths;
        year.population = +year.population;
        year.year = parseYear(year.year);
      });
    });
    // convert income data from strings to numbers and dates
    income.forEach(function(state) {
      state.years.forEach(function(year) {
        year.median_income = +year.median_income / 1000,
        year.year = parseYear(year.year)
      });
    });
    
    unemployment.forEach(function(state) {
      state.years.forEach(function(year) {
        year.unemployment = +year.unemployment;
        year.year = parseYear(year.year);
      })
    });
    
    
    treatment.forEach(function(year) {
      var total = 0;
      d3.keys(year).forEach(function(k) {
        if (k === 'date') { year.date = parseYear(year.date); } 
        else { year[k] = +year[k]; }
      });
    });
    
    // update data loading status
    dataLoaded = true;
    // create visualizations
    createVis(topo, deaths, income, unemployment, drugUse, treatment);
  }
}

/***--------------------------------***
 *** DRAW AND UPDATE VISUALIZATIONS ***
 ***--------------------------------***/

var handler = new EventHandler();
d3.select(window).on('resize', function() {handler.broadcast({name: 'resize'});});
d3.select('#switch-view-button').on('click', function() {handler.broadcast({name: 'switchView'});});

// creates and initializes all visualizations 
function createVis(topo, deaths, income, unemployment, drugUse, treatment) {
  
  choropleth = new Choropleth('choropleth', topo, deaths);
  choropleth.eventHandler(handler).initVis();
  
  scatterplot = new Scatterplot('scatterplot', 'median_income', deaths, income, unemployment);
  scatterplot.eventHandler(handler).initVis();
  
  yearSlider = new YearSlider('year-slider', [2002, 2014]);
  yearSlider.eventHandler(handler).initVis();
  handler.on('question-clicked', this, displaySliderDescription);
  
  stackedAreaChart = new StackedAreaChart('dual-view-area', 'shared-chart', treatment);
  stackedAreaChart.eventHandler(handler).initVis();
  
  treemap = new Treemap('dual-view-area', 'shared-chart', drugUse);
  treemap.eventHandler(handler).initVis();
  
  singleYearSlider = new SingleYearSlider('single-year-slider', [2003, 2013]);
  singleYearSlider.eventHandler(handler).initVis();
  
  drugTypes = drugUse.children.map(function(d) { return d.name; }).reverse();
  drugTypeLegend = new DrugTypeLegend('drug-type-legend', drugTypes);
  drugTypeLegend.eventHandler(handler).initVis();
}

// update visualizations based on selected options
function updateFactor(factor) {
  if (dataLoaded) {
    // build options
    options = {
      factor: factor,
      duration: 1000
    };
    
    handler.broadcast({ name: 'update', options: options});
  }
}

function displaySliderDescription() {
  $('#slider-modal').modal();
}