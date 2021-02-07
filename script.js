var DataContext = {codes:{}, selectedCountry:"", selectedPlot:"requests", normalizeCountries:false};
/////////////////////////////////////////////
function drawGroupBarChart(data, svgId, margin, groupKey, keys){
  
  var svgBounds = d3.select(svgId).node().getBoundingClientRect();

  var height = svgBounds.height;
  var width = svgBounds.width;

  var groups =DataContext.total.map(d=>d[groupKey]);
    
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
  bar_styler = (bar)  => {
    return bar.attr("x", d => x1(d.key))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => y(0) - y(d.value))
      .attr("fill", d => color(d.key));
  }

  const t = d3.transition().duration(500);

  var svg = d3.select(svgId);
  svg.selectAll("g").data(data).join("g")
    .attr("transform", d => `translate(${x0(d[groupKey])},0)`)
    .selectAll("rect")
    .data(d=>keys.map(key => ({key, value: d[key]})))
    .join(
      enter => bar_styler(enter.append("rect")),
      update => update.call(u => bar_styler(u.transition(t))),
      exit => exit.remove()
    );
  
  xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)    
    .call(d3.axisBottom(x0).tickSizeOuter(0))

  yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, "s"))
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .text(data.y));
    
  svg.append("g")
      .call(xAxis).selectAll("text")
      .attr("dx", "-1em").attr("dy", "-0.2em")
      .attr("transform", "rotate(-65)")
      .style("font-size", "1.2em")
      .attr("text-anchor", "end")
      
  svg.append("g")
      .call(yAxis);

  legend = svg => {
        const g = svg
            .attr("transform", `translate(${width},10)`)
            .attr("text-anchor", "end")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
          .selectAll("g")
          .data(color.domain().slice().reverse())
          .join("g")
            .attr("transform", (d, i) => `translate(0,${10 + i * 20})`);
      
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
/////////////////////////////////////////
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
          .attr("id", d=>d.properties.iso_a3)
          .on("click", countryMouseClick)
          .on("mouseenter", countryMouseEnter)
          .on("mousemove", countryMouseMove)
          .on("mouseleave", countryMouseLeave);
  d3.select("#map-svg g").call(zoom);
}

function deselectAllCountries(){
  d3.select("#map-svg g").selectAll("path").classed("country-active", false);
}


function countryMouseClick(evnt, datum){
  deselectAllCountries();
  const e = d3.select("#map-svg g").selectAll("path").nodes();
  const index = e.indexOf(this);
  d3.select(this).classed("country-active",true);

  var country = DataContext.codes[datum.properties.iso_a3];
  DataContext.selectedCountry=country;
  showTotal(false);
  drawYearBarChart(country);
}

function zoomed(event) {
  const {transform} = event;
  g = d3.select("#map-svg g");
  g.attr("transform", transform);
  g.attr("stroke-width", 1 / transform.k);
}
function countryMouseEnter(ent, datum){
  var tooltip = d3.select(".tooltip").style("opacity", 1);
  tooltip.select("#tooltip-country-name").text(DataContext.codes[datum.properties.iso_a3]);
}
function countryMouseMove(evnt, datum){
  tooltip = d3.select(".tooltip");
  tooltip.style("transform", `translate(`
      + `calc( -50% + ${evnt.pageX}px),`
      + `calc( 10% + ${evnt.pageY}px)`
      + `)`)
}
function countryMouseLeave() {
  d3.select(".tooltip").style("opacity", 0)
}
function normalizeYears()
{

}
function drawYearBarChart(country="Africa"){

  d3.select("#selected-country-label").text(country);
  if(country!="Africa")
    d3.select("#selected-country-button").text(country);

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
  bar_styler = (bar)  => {
    return bar.attr("x", d => x1(d.key))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => y(0) - y(d.value))
      .attr("fill", d => color(d.key));
  }

  const t = d3.transition().duration(500);

  var svg = d3.select("#year-bar-chart");
  svg.selectAll("g").data(data).join("g")
    .attr("transform", d => `translate(${x0(d[groupKey])},0)`)
    .selectAll("rect")
    .data(d=>keys.map(key => ({key, value: d[key]})))
    .join(
      enter => bar_styler(enter.append("rect")),
      update => update.call(u => bar_styler(u.transition(t))),
      exit => exit.remove()
    );
  
  xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)    
    .call(d3.axisBottom(x0).tickSizeOuter(0))

  yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, "s"))
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
            .attr("transform", `translate(${width},10)`)
            .attr("text-anchor", "end")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
          .selectAll("g")
          .data(color.domain().slice().reverse())
          .join("g")
            .attr("transform", (d, i) => `translate(0,${10 + i * 20})`);
      
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

function showTotal(flag){
    d3.select("#selected-country-button").classed("active", !flag);
    d3.select("#africa-button").classed("active", flag);
    if(flag)
    {
      drawYearBarChart("Africa");
    }
    else
    {
      if(DataContext.selectedCountry)
        drawYearBarChart(DataContext.selectedCountry);
    }
}
//country chart/////////////////////////////////////////////////////
function normalizeCountries()
{
  DataContext.normalizeCountries = !DataContext.normalizeCountries;
  drawCountryBarChart(DataContext.selectedPlot);
}
function drawCountryBarChart(plotType="requests"){
  d3.select("#country-chart-nav")
    .selectAll("button")
    .classed("active", false);
  d3.select("#country-nav-"+plotType).classed("active", true);
  
  DataContext.selectedPlot=plotType;

  svgId = "#country-bar-chart"
  
  var margin = ({top: 50, right: 50, bottom: 200, left: 80})
  var svgBounds = d3.select(svgId).node().getBoundingClientRect();

  var height = svgBounds.height;
  var width = svgBounds.width;

  var groupKey = "country";
  var groups =DataContext.total.map(d=>d.country);


  if(plotType=="requests")
    var keys = ["EU", "IT"];
  else
    var keys= [plotType]
    
  if(plotType=="requests" || plotType=="residents")
  {
    d3.select("#normalize-country-switch").attr("disabled", null);
    if(DataContext.normalizeCountries)
      keys = keys.map(d=> "Normal_"+d);
  }
  else
    d3.select("#normalize-country-switch").attr("disabled", "disabled");

  data = DataContext.total
  
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
  bar_styler = (bar)  => {
    return bar.attr("x", d => x1(d.key))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => y(0) - y(d.value))
      .attr("fill", d => color(d.key));
  }

  const t = d3.transition().duration(500);

  var svg = d3.select(svgId);
  svg.selectAll("g").data(data).join("g")
    .attr("transform", d => `translate(${x0(d[groupKey])},0)`)
    .selectAll("rect")
    .data(d=>keys.map(key => ({key, value: d[key]})))
    .join(
      enter => bar_styler(enter.append("rect")),
      update => update.call(u => bar_styler(u.transition(t))),
      exit => exit.remove()
    );
  
  xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)    
    .call(d3.axisBottom(x0).tickSizeOuter(0))

  yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, "s"))
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .text(data.y));
    
  svg.append("g")
      .call(xAxis).selectAll("text")
      .attr("dx", "-1em").attr("dy", "-0.2em")
      .attr("transform", "rotate(-65)")
      .style("font-size", "1.2em")
      .attr("text-anchor", "end")
      
      

  svg.append("g")
      .call(yAxis);

  legend = svg => {
        const g = svg
            .attr("transform", `translate(${width},10)`)
            .attr("text-anchor", "end")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
          .selectAll("g")
          .data(color.domain().slice().reverse())
          .join("g")
            .attr("transform", (d, i) => `translate(0,${10 + i * 20})`);
      
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
//sunburst////////////////////////
function drawSunburst(data){
  var svgId = "#sunburst";
  var svgBounds = d3.select(svgId).node().getBoundingClientRect();
  var width = svgBounds.width;
  radius = width / 6
  format = d3.format(",d")
  color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1))

  arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius(d => d.y0 * radius)
    .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

  partition = data => {
    const root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
    return d3.partition()
        .size([2 * Math.PI, root.height + 1])
      (root);
  }

  const root = partition(data);

  root.each(d => d.current = d);

  const svg = d3.select(svgId)
      .attr("viewBox", [0, 0, width, width])
      .style("font", "10px sans-serif");

  const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${width / 2})`);

  const path = g.append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
      .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
      .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
      .attr("d", d => arc(d.current));

  path.filter(d => d.children)
      .style("cursor", "pointer")
      .on("click", clicked);

  path.append("title")
      .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

  const label = g.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
    .selectAll("text")
    .data(root.descendants().slice(1))
    .join("text")
      .attr("dy", "0.35em")
      .attr("fill-opacity", d => +labelVisible(d.current))
      .attr("transform", d => labelTransform(d.current))
      .text(d => d.data.name);

  const parent = g.append("circle")
      .datum(root)
      .attr("r", radius)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("click", clicked);

  function clicked(event, p) {
    parent.datum(p.parent || root);

    root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth)
    });

    const t = g.transition().duration(750);

    // Transition the data on all arcs, even the ones that aren’t visible,
    // so that if this transition is interrupted, entering arcs will start
    // the next transition from the desired position.
    path.transition(t)
        .tween("data", d => {
          const i = d3.interpolate(d.current, d.target);
          return t => d.current = i(t);
        })
      .filter(function(d) {
        return +this.getAttribute("fill-opacity") || arcVisible(d.target);
      })
        .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
        .attrTween("d", d => () => arc(d.current));

    label.filter(function(d) {
        return +this.getAttribute("fill-opacity") || labelVisible(d.target);
      }).transition(t)
        .attr("fill-opacity", d => +labelVisible(d.target))
        .attrTween("transform", d => () => labelTransform(d.current));
  }
  
  function arcVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
  }

  function labelTransform(d) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  
  }
  
}

/////////////////////////////////////
function drawBracketBarChart(plotType="request"){
  var margin = ({top: 50, right: 50, bottom: 80, left: 80})
  drawGroupBarChart(DataContext.total, "#bracket-bar-chart", margin, "bracket",  ["EU", "IT"] );
}

/////////////////////////////////////
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
      d3.csv("data/allcodes.csv").
        then(function (csv){
        csv.forEach(d=> DataContext.codes[d.code.trim()]=d.country.trim())}),
      d3.csv("data/year-eu.csv").then(csv=>loadYears(csv,"yearsEU")),
      d3.csv("data/year-it.csv").then(csv=>loadYears(csv,"yearsIT"))
    ]).then(()=>drawYearBarChart());
  
  d3.csv("data/total.csv").then(function(csv){
    csv.forEach(d=>
      {
        d.GDP = +d.GDP;
        d.EU = +d.EU;
        d.IT = +d.IT;
        d.Normal_EU = +d.Normal_EU;
        d.Normal_IT = +d.Normal_IT;
        d.Normal_residents = +d.Normal_residents;
        d.population = +d.population;
        d.residents = +d.residents;
        for(i=2013;i<=2018;i++)
        {
          d["EU"+i]= +d["EU"+i];
          d["IT"+i]= +d["IT"+i];
        }
      }
    );
    DataContext.total = csv;
    var EUKeys=[]
    var ITKeys=[]
    for(i=2013;i<=2018;i++)
    {
      EUKeys.push("EU"+i);
      ITKeys.push("IT"+i);
    }

    DataContext.EUHierarchy = changeToHierarchy(csv, EUKeys);
    DataContext.ITHierarchy = changeToHierarchy(csv, ITKeys);

    
    drawCountryBarChart();
    drawSunburst(DataContext.EUHierarchy);
  })
  d3.csv("data/bracket.csv").then(csv=>{
    csv.forEach(d=>{
      d.IT =+d.IT;
      d.EU =+d.EU;
      d.residents =+d.residents;
      d.Normal_IT = +d.Normal_IT;
      d.Normal_EU = +d.Normal_EU;
      d.Normal_residents = +d.Normal_residents;
    })
    DataContext.bracket = csv;
    drawBracketBarChart();
  })
  
  d3.json("data/custom.geo.json").then(function(mapData){
    console.log(mapData);
    drawMap(mapData);
  });//.catch( err =>console.log(err));
}

function changeToHierarchy(raw,leafKeys){
  keys = ["bracket","country"]
  data = {name:"brackets", children:[]};

  raw.forEach(d=>{
    var node = data.children;
    keys.forEach(key =>{
      nextNode = node.filter(a=>a.name==d[key])[0]
      if(!nextNode)
      {
        nextNode={name:d[key], children:[]};
        node.push(nextNode);
      } 
      node = nextNode.children;   
    });
    leafKeys.forEach(leaf=>{
      node.push({name:leaf, value:d[leaf]})
    });
  });
  return data;
}
$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();   
    loadData();
  });