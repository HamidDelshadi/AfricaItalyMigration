var DataContext = {}

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

function drawYearBarChart(country="Africa"){
  var margin = ({top: 50, right: 50, bottom: 60, left: 80})
  var svgBounds = d3.select("#year-bar-chart").node().getBoundingClientRect();

  var height = svgBounds.height;
  var width = svgBounds.width;

  var dEU = DataContext.yearsEU[DataContext.yearsEU.findIndex(item=>item.country == country)];
  var dIT = DataContext.yearsIT[DataContext.yearsIT.findIndex(item=>item.country == country)];

  var groups =DataContext.yearsEU.columns.slice(1,-1);
  var keys = ["EU", "IT"];

  data = groups.map(year=> {return {"year":year, "EU":dEU[year], "IT":dIT[year]};});
  var groupKey = "year";
  var x0 = d3.scaleBand()
    .domain(groups)
    .rangeRound([margin.left, width - margin.right])
    .paddingInner(0.1)

  var x1 = d3.scaleBand()
    .domain(keys)
    .rangeRound([0, x0.bandwidth()])
    .padding(0.05)

  var y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d3.max(keys, key => d[key]))]).nice()
    .rangeRound([height - margin.bottom, margin.top])

  color = d3.scaleOrdinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"])
    
  var svg = d3.select("#year-bar-chart");
  svg.selectAll("g").data(data).join("g")
    .attr("transform", d => `translate(${x0(d[groupKey])},0)`)
    .selectAll("rect")
    .data(d=>keys.map(key => ({key, value: d[key]})))
    .join("rect")
    .attr("x", d => x1(d.key))
    .attr("y", d => y(d.value))
    .attr("width", x1.bandwidth())
    .attr("height", d => y(0) - y(d.value))
    .attr("fill", d => color(d.key));

  xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x0).tickSizeOuter(0))
    .call(g => g.select(".domain").remove())

  yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, "s"))
    .call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(data.y))
    
  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);

  legend = svg => {
        const g = svg
            .attr("transform", `translate(${width},0)`)
            .attr("text-anchor", "end")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
          .selectAll("g")
          .data(color.domain().slice().reverse())
          .join("g")
            .attr("transform", (d, i) => `translate(0,${i * 20})`);
      
        g.append("rect")
            .attr("x", -19)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", color);
      
        g.append("text")
            .attr("x", -24)
            .attr("y", 9.5)
            .attr("dy", "0.35em")
            .text(d => d);
      }
  svg.append("g")
      .call(legend);
}

function loadData(){
  loadYears = function(csv,dataName){
    csv.forEach(d => {
      for(i=2013;i<=2018;i++)
        d[i]= +d[i];
      d.sum = +d.sum;
    });
    console.log(dataName);
    DataContext[dataName] = csv;
  }
  Promise.all([
      d3.csv("data/year-eu.csv").then(csv=>loadYears(csv,"yearsEU")),
      d3.csv("data/year-it.csv").then(csv=>loadYears(csv,"yearsIT"))
    ]).then(()=>drawYearBarChart());
  
  
  d3.json("data/custom.geo.json").then(function(mapData){
    console.log(mapData);
    drawMap(mapData);
  });//.catch( err =>console.log(err));
}
$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();   
    loadData();
  });