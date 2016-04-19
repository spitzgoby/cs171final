// code found at http://bl.ocks.org/benvandyke/8459843
function Regression() {
  this.xSeries = function(xSeries) {
    if (!xSeries) {
      return this._xSeries;
    }
    
    this._xSeries = xSeries;
    return this;
  };
  
  this.ySeries = function(ySeries) {
    if (!ySeries) {
      return this._ySeries;
    }
    
    this._ySeries = ySeries;
    return this;
  };
  
  this.reduceSum = function(prev, cur) {
    return prev + cur;
  };
  
  this.coefficients = function() {
    var self = this;
    var xBar = this._xSeries.reduce(this.reduceSum) * 1.0 / this._xSeries.length;
    var yBar = this._ySeries.reduce(this.reduceSum) * 1.0 / this._ySeries.length;

    var ssXX = this._xSeries.map(function(d) { return Math.pow(d - xBar, 2); })
      .reduce(this.reduceSum);
    
    var ssYY = this._ySeries.map(function(d) { return Math.pow(d - yBar, 2); })
      .reduce(this.reduceSum);
      
    var ssXY = this._xSeries.map(function(d, i) { return (d - xBar) * (self._ySeries[i] - yBar); })
      .reduce(this.reduceSum);
      
    var slope = ssXY / ssXX;
    var intercept = yBar - (xBar * slope);
    var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);
    
    return [slope, intercept, rSquare];
  };
}