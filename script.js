
function drawMap(mapData){

  const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", zoomed);
      


  projection = d3.geoConicConformal().scale(350).translate([200, 270]);
  var path = d3.geoPath().projection(projection);
  africaFeatures = mapData.features;
  console.log(africaFeatures);
  var map_svg = d3.select("#map-svg g")
      .selectAll("path")
          .data(africaFeatures)
          .enter()
          .append("path")
          .attr("d", path)
          .classed("countries", true)
          .attr("id", d=>d.properties.iso_a3);
  d3.select("#map-svg g").call(zoom);
}

function zoomed(event) {
  const {transform} = event;
  g = d3.select("#map-svg g");
  g.attr("transform", transform);
  g.attr("stroke-width", 1 / transform.k);
}

function loadData(mapData){
  d3.json("data/custom.geo.json").then(function(mapData){
    console.log(mapData);
    drawMap(mapData);
  });//.catch( err =>console.log(err));

}

function start(){
  loadData();
}

$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();   
    start();
  });
