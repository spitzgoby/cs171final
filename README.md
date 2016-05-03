# CS171 Final Project
## Authors
* [Ravi Kollu](https://github.com/ravikollu)
* [Shawn Marriot](https://github.com/Mr-Shawn-Marriott)
* [Thomas Leu](https://github.com/spitzgoby)

## Description

Our data visualization project utilizes drug death and treatment information as 
well as U.S. economic data to visualize the unique nature of the current drug
epidemic in the U.S.

The libraries we used for this project include [d3](https://d3js.org/), 
[bootstrap](https://getbootstrap.com), 
[d3-tip](https://github.com/Caged/d3-tip), 
[colorbrewer](https://github.com/mbostock/d3/tree/master/lib/colorbrewer),
[jquery](http://jquery.com/), [topojson](https://github.com/mbostock/topojson),
and [d3-queue](https://github.com/d3/d3-queue). The source code for these libs 
is stored in the `src/js/lib` directory. Additionally, a lot of code was 
inspired by the excellent examples at [Blocks](http://bl.ocks.org/). Our code 
can be found in the `src/js` directory and encompasses the initialization, data
loading, and drawing of the visualizations. 

We also utilized [Gulp](http://gulpjs.com/) and [Sass](http://sass-lang.com/) to
speed up the implementation process. In order to build the code you must first 
install `npm` and then run `npm install`. Next, run `gulp libs` and finally 
`gulp` from the command line in the root project directory.

### Choropleth and Scatterplot
This pair of visualizations focuses on how economic factors have influenced drug
death rates. The choropleth provides a quick overview of the problem, and the 
scatterplot on the right allows the user to select two economic factors 
(unemployment and median income) to see how they correlate with drug deaths. The
only non-obvious piece of functionality is the ability to pull data from 
different years to compare. The rationale is that economic factors would not 
correlate with an immediate rise in deaths, but would instead be seen several 
years later. Clicking on the question mark below the visualization controls also
provides some interesting correlations that we found in our analysis.

### Treemap and Stacked Area Chart
These visualizations look at the change in the types of substances being abused.
Our research showed us that overall drug use has not increased as quickly as the
number of deaths and treatment episodes. These visualizations show the growing 
effect of opioids (both prescription and illicit) over the recent years. 

## Links
* [Screencast](https://www.youtube.com/watch?v=ArrsczwM2eA&feature=youtu.be)
* [Live Site](http://cs171.spitzgoby.com)
