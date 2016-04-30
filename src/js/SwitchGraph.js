var change = true;

function changeToOther() {
    var svg = d3.select("#treemap-area");
    svg.selectAll("*").remove();

    var title = d3.select("#tree-title");
    title.selectAll("*").remove();

    if(change){
        loadStackedArea();
        change = false;
    }
    else{
        loadTreemap();
        change = true;
    }
}

