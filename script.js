var DataContext = {
  codes:{}, 
  selectedYearPlot:"Africa",
  selectedCountry:"", 
  selectedCountryISO:"",
  selectedCountryPlot:"requests", 
  selectedBracketPlot:"requests", 
  selectedSunburst: "IT",
  normalizeCountries:false, 
  normalizeBrackets:false,
  normalizeYears:false,
};
/////////////////////////////////////////////
function drawGroupBarChart(data, svgId, margin, groupKey, keys){
  
  const {xv, yv, width, height} = d3.select(svgId).node().viewBox.baseVal;

  var groups =data.map(d=>d[groupKey]);
    
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
function createPattern(defs, fill) {
  const pattern = defs
    .append("pattern")
    .attr("id", `${fill.substr(1)}-pattern`)
    .attr("height", 10)
    .attr("width", 10)
    .attr("patternTransform","rotate(-45)")
    .attr("patternUnits","userSpaceOnUse")    ;

  pattern
    .append("rect")
    .attr("height", "100%")
    .attr("width", "100%")
    .attr("fill", fill);
  pattern
    .append("rect")
    .attr("x", 5)
    .attr("y", 0)
    .attr("height", "100%")
    .attr("width", "2px")
    .attr("fill", "white");
}
function createPatterns(svg, colors){
  Object.values(colors).forEach(color => {
    createPattern(svg, color);
  });
}

/////////////////////////////////////////
function drawMap(){
  svg_id ="#map-svg";
  mapData = DataContext.mapData;

  var svgBounds = d3.select("#map-svg").node().getBoundingClientRect();

  var height = 600;//svgBounds.height;
  var width = 700;//svgBounds.width;

  const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", zoomed);
  colors = {"low":"#bdd7e7","medium low":"#6baed6", "medium high":"#3182bd", "high":"#08519c"};
  
  projection = d3.geoConicConformal().scale(350).translate([200, 270]);
  var path = d3.geoPath().projection(projection);
  africaFeatures = mapData.features;
  console.log(africaFeatures);
  const svg = d3.select(svg_id);
  createPatterns(svg, colors);

  const g = svg.append("g");

  g.selectAll("path")
        .data(africaFeatures)
        .enter()
        .append("path")
        .attr("d", path) 
        .classed("countries", true)
        .attr("id", d=>d.properties.iso_a3)
        .attr("country", d=> DataContext.codes[d.properties.iso_a3])
        .style("fill", d=> 
        {
          try{
            return colors[DataContext.ds[DataContext.ds.findIndex(k=> k.country == DataContext.codes[d.properties.iso_a3])].bracket]
          }
          catch(ex){
            return "#d9d9d9";
          }
        })
        .attr("originalcolor", d=> 
        {
          try{
            return colors[DataContext.ds[DataContext.ds.findIndex(k=> k.country == DataContext.codes[d.properties.iso_a3])].bracket]
          }
          catch(ex){
            return "#d9d9d9";
          }
        })
        .on("click", countryMouseClick)
        .on("mouseenter", countryMouseEnter)
        .on("mousemove", countryMouseMove)
        .on("mouseleave", countryMouseLeave);
  g.call(zoom);

  legend = svg => {
    const g = svg
        .attr("transform", `translate(${width},40)`)
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
      .selectAll("g")
      .data(DataContext.bracket.map(a=>a.bracket))
      .join("g")
        .attr("transform", (d, i) => `translate(0,${10 + i * 20})`);
  
    g.append("rect")
        .attr("x", -19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", d=>colors[d.toLowerCase()]);
  
    g.append("text")
        .attr("x", -24)
        .attr("y", 9.5)
        .attr("dy", "0.35em")
        .text(d => d+" income");
  }
svg.append("g")
  .call(legend);

}

function countryMouseClick(evnt, datum){

  if(DataContext.selectedCountryISO)
  {
    const oldCountry = d3.select("#"+DataContext.selectedCountryISO);
    c2 = oldCountry.attr("originalcolor");
    oldCountry.style("fill", c2);
  }

  const newCountry = d3.select("#"+datum.properties.iso_a3);
  c1 = newCountry.attr("originalcolor");
  newCountry.style("fill",`url("${c1}-pattern")`)

  
  DataContext.selectedCountry=DataContext.codes[datum.properties.iso_a3];
  DataContext.selectedCountryISO= datum.properties.iso_a3;

  showTotal(false);
  drawYearBarChart(DataContext.selectedCountry);
}

function zoomed(event) {
  const {transform} = event;
  g = d3.select("#map-svg g");
  g.attr("transform", transform);
  g.attr("stroke-width", 1 / transform.k);
}
function countryMouseEnter(ent, datum){
  var tooltip = d3.select(".tooltip").style("opacity", 1);
  var country = DataContext.codes[datum.properties.iso_a3];
  var row = DataContext.ds[DataContext.ds.findIndex(item=>item.country == country)];

  tooltip.select("#tooltip-country-name").text(country);
  if(row)
  {
    tooltip.select("#tooltip-population").text("population: " + row.population);
    tooltip.select("#tooltip-GDP").text("GDP: "+ row.GDP);
    tooltip.select("#tooltip-req-EU").text(row.EU);
    tooltip.select("#tooltip-req-normal-EU").text(row.Normal_EU);
    tooltip.select("#tooltip-req-IT").text(row.IT);
    tooltip.select("#tooltip-req-normal-IT").text(row.Normal_IT);
    tooltip.select("#tooltip-bracket-name").text(row.bracket+" income");
  }
  else{
    tooltip.select("#tooltip-population").text("population: NA");
    tooltip.select("#tooltip-GDP").text("GDP: "+ "NA");
    tooltip.select("#tooltip-req-EU").text("NA");
    tooltip.select("#tooltip-req-normal-EU").text("NA");
    tooltip.select("#tooltip-req-IT").text("NA");
    tooltip.select("#tooltip-req-normal-IT").text("NA");
    tooltip.select("#tooltip-bracket-name").text("NA");
  }

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
  DataContext.normalizeYears = !DataContext.normalizeYears;
  drawYearBarChart(DataContext.selectedYearPlot);
}
function drawYearBarChart(country="Africa")
{
  DataContext.selectedYearPlot = country;
  d3.select("#selected-country-label").text(country);
  if(country!="Africa")
    d3.select("#selected-country-button").text(country);
  var margin = ({top: 50, right: 50, bottom: 60, left: 80})
  var pre=""
  if(DataContext.normalizeYears)
    pre="Normal_"
  var years=[];
  var data;
  for(i=2013;i<=2018;i++)
    years.push(i);
  if(country == "Africa")
    data = years.map(year => {
      return {"year": year, "EU":DataContext.total[pre+"EU"][year],"IT":DataContext.total[pre+"IT"][year]}
    });
  else
  {
    var row = DataContext.ds[DataContext.ds.findIndex(item=>item.country == country)];
    data = years.map(year=>{
      return {"year": year, "EU":row[pre+"EU"+year], "IT":row[pre+"IT"+year]};
    });
  }

  drawGroupBarChart(data,"#year-bar-chart", margin,"year",["EU","IT"])
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
  drawCountryBarChart(DataContext.selectedCountryPlot);
}

function drawCountryBarChart(plotType="requests"){
  d3.select("#country-chart-nav")
    .selectAll("button")
    .classed("active", false);
  d3.select("#country-nav-"+plotType.toLowerCase()).classed("active", true);

  DataContext.selectedCountryPlot=plotType;

  var margin = ({top: 50, right: 50, bottom: 200, left: 80})

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
  drawGroupBarChart(DataContext.ds, "#country-bar-chart", margin, "country", keys)
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

  const g = svg.select("g")
      .attr("transform", `translate(${width / 2},${width / 2})`);
  g.selectAll("g").data([0,0]).join("g")
  const path = g.select("g:nth-child(1)")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
      .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
      .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
      .attr("d", d => arc(d.current));

  path.filter(d => d.children)
      .style("cursor", "pointer")
      .on("click", clicked);

  path.selectAll("title")
    .data(d => [`${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`])
    .join("title")
    .text(d=>d);

  const label = g.select("g:nth-child(2)")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
    .selectAll("text")
    .data(root.descendants().slice(1))
    .join("text")
      .attr("dy", "0.35em")
      .attr("font-size", "1.4em")
      .attr("fill-opacity", d => +labelVisible(d.current))
      .attr("transform", d => labelTransform(d.current))
      .text(d => d.data.name);

    const parent = g.selectAll("circle").data([0]).join("circle")
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
function normalizeBracket(){
  DataContext.normalizeBrackets = !DataContext.normalizeBrackets;
  drawBracketCharts(DataContext.selectedBracketPlot);
}

function drawBracketCharts(plotType="requests"){
  d3.select("#bracket-chart-nav")
  .selectAll("button")
  .classed("active", false);
d3.select("#bracket-nav-"+plotType).classed("active", true);

DataContext.selectedBracketPlot=plotType;

if(plotType=="requests")
{
  d3.selectAll("#sunburst-options").style("visibility", "visible")
  var keys = ["EU", "IT"];
}
else
{
  d3.selectAll("#sunburst-options").style("visibility", "hidden")
  var keys= [plotType]
}

  
if(plotType=="requests" || plotType=="residents")
{
  d3.select("#normalize-bracket-switch").attr("disabled", null);
  if(DataContext.normalizeBrackets)
    keys = keys.map(d=> "Normal_"+d);
}
else
  d3.select("#normalize-bracket-switch").attr("disabled", "disabled");


  var margin = ({top: 50, right: 50, bottom: 80, left: 80})
  drawGroupBarChart(DataContext.bracket, "#bracket-bar-chart", margin, "bracket",  keys);

  if(plotType=="requests")
  { 
    let key = DataContext.selectedSunburst + "Hierarchy";
    if(DataContext.normalizeBrackets)
      key = "Normal_"+key;
    var hierarchyData = DataContext[key];
    drawSunburst(hierarchyData);
  }
  else
  {
    var hierarchyData = DataContext[keys[0]+"Hierarchy"]
    drawSunburst(DataContext[keys[0]+"Hierarchy"]);
  }
  drawSunburst(hierarchyData);
}
function sunburstChangeLocation(location){
  var otherLocation = "eu";
  if(location=="EU")
    otherLocation="it";
    
  d3.select(`#sunburst-${location.toLowerCase()}-button`)
    .classed("btn-outline-secondary", false)
    .classed("btn-secondary", true);

  d3.select(`#sunburst-${otherLocation}-button`)
    .classed("btn-outline-secondary", true)
    .classed("btn-secondary", false);

  DataContext.selectedSunburst = location;
  drawBracketCharts(DataContext.selectedBracketPlot);
}
/////////////////////////////////////
function loadData(){

  Promise.all([d3.csv("data/allcodes.csv").
    then(function (csv){
      csv.forEach(d=> DataContext.codes[d.code.trim()]=d.country.trim())}), 
    d3.csv("data/ds.csv").then(function(csv){
      var total ={
        IT : {2013:0, 2014:0, 2015:0, 2016:0, 2017:0, 2018:0},
        EU : {2013:0, 2014:0, 2015:0, 2016:0, 2017:0, 2018:0},
        Normal_EU : {2013:0, 2014:0, 2015:0, 2016:0, 2017:0, 2018:0},
        Normal_IT : {2013:0, 2014:0, 2015:0, 2016:0, 2017:0, 2018:0}
      };
      var totalPopulation =0;
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
          totalPopulation +=d.population;
          for(i=2013;i<=2018;i++)
          {
            d["EU"+i]= +d["EU"+i];
            d["IT"+i]= +d["IT"+i];
            d["Normal_EU"+i]= +d["Normal_EU"+i];
            d["Normal_IT"+i]= +d["Normal_IT"+i];
            total.IT[i] += d["IT"+i];
            total.EU[i] += d["EU"+i];
          }
        }
      );
      for(i=2013;i<=2018;i++)
      {
        total.Normal_EU[i] = total.EU[i]/totalPopulation*10000;
        total.Normal_IT[i] = total.IT[i]/totalPopulation*10000;
      }
      DataContext.total = total;
      DataContext.ds = csv;
      var EUKeys=[];
      var ITKeys=[];
      var NormalEUKeys=[];
      var NormalITKeys=[];

      for(i=2013;i<=2018;i++)
      {
        EUKeys.push("EU"+i);
        ITKeys.push("IT"+i);
        NormalEUKeys.push("Normal_EU"+i);
        NormalITKeys.push("Normal_IT"+i);      
      }
      var hKeys = ["bracket","country"];
      DataContext.EUHierarchy = changeToHierarchy(csv,hKeys, EUKeys);
      DataContext.ITHierarchy = changeToHierarchy(csv,hKeys, ITKeys);
      DataContext.residentsHierarchy = changeToHierarchy(csv,hKeys, ["residents"]);
      DataContext.populationHierarchy = changeToHierarchy(csv,hKeys, ["population"]);
      DataContext.Normal_EUHierarchy = changeToHierarchy(csv,hKeys, NormalEUKeys);
      DataContext.Normal_ITHierarchy = changeToHierarchy(csv,hKeys, NormalITKeys);
      DataContext.Normal_residentsHierarchy = changeToHierarchy(csv,hKeys, ["Normal_residents"]);
      
      drawCountryBarChart();
      
    }),
    d3.csv("data/bracket.csv").then(csv=>{
      csv.forEach(d=>{
        d.IT = +d.IT;
        d.EU = +d.EU;
        d.residents = +d.residents;
        d.Normal_IT = +d.Normal_IT;
        d.Normal_EU = +d.Normal_EU;
        d.Normal_residents = +d.Normal_residents;
      })
      DataContext.bracket = csv;
    }),
    d3.json("data/custom.geo.json").then(function(mapData){
      DataContext.mapData =mapData;
    })
  ]).then(()=>{
    drawYearBarChart();
    drawBracketCharts();
    drawMap();
  });//.catch( err =>console.log(err));
  


  
}

function changeToHierarchy(raw,keys,leafKeys){
  
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