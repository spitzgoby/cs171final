  
// convert year strings to date objects
var formatYear = d3.time.format('%Y');
var parseYear = formatYear.parse;

var formatPercent = d3.format('%');
var formatCurrency = d3.format('$');
var formatIdentity = function(str) { return str; };

// universal color scale
colorbrewer.Purples[6].unshift('#ffffff');
var colors = d3.scale.quantile()
  .range(colorbrewer.Purples[6]);
    
/***---------------------***
 *** LOAD AND PARSE DATA ***
 ***---------------------***/
  
// load all data before cleaning
var dataLoaded = false;
d3_queue.queue()
  .defer(d3.json, 'data/topo_usa.json')
  .defer(d3.json, 'data/state_deaths.json')
  .defer(d3.json, 'data/state_income.json')
  .defer(d3.json, 'data/state_unemployment.json')
  .await(loadData);
  
// globals for data
function loadData(error, topo, deaths, income, unemployment) {
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
    })
    // update data loading status
    dataLoaded = true;
    // create visualizations
    createVis(topo, deaths, income, unemployment);
  }
}

/***--------------------------------***
 *** DRAW AND UPDATE VISUALIZATIONS ***
 ***--------------------------------***/

var handler = new EventHandler();
d3.select(window).on('resize', function() {handler.broadcast({name: 'resize'})});

// creates and initializes all visualizations 
function createVis(topo, deaths, income, unemployment) {
  
  choropleth = new Choropleth('choropleth', topo, deaths);
  choropleth.eventHandler(handler).initVis();
  
  scatterplot = new Scatterplot('scatterplot', 'median_income', deaths, income, unemployment);
  scatterplot.eventHandler(handler).initVis();
  
  yearSlider = new YearSlider('year-slider', [2002, 2014]);
  yearSlider.eventHandler(handler).initVis();
  handler.on('question-clicked', this, displaySliderDescription);
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