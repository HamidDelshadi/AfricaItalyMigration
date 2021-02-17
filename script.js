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
var f = d3.format(",");

/*    utilities    */
function showUserMessage(msg){
  iqwerty.toast.toast(msg);
}

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
  colors.forEach(color => {
    createPattern(svg, color);
  });
}

function getCountryName(d){
  return DataContext.codes[getISO(d)];
  //return d.properties.geounit;
}

function getISO(d){
  if(d.iso)
    return d.iso;
  return d.properties.iso_a3;
}

function CountryNameToISO(country)
{
  if(country!="Africa")
    return Object.keys(DataContext.codes).find(key => DataContext.codes[key] == country);
  else
    return country;
}
/*     draw Bar-charts   */
function drawVerticalGroupBarChart(data, svgId, margin, groupKey, keys){
  
  const {xv, yv, width, height} = d3.select(svgId).node().viewBox.baseVal;

  var groups =data.map(d=>d[groupKey]);
    
  var y0 = d3.scaleBand()
    .domain(groups)
    .rangeRound([margin.top, height - margin.bottom])
    .paddingInner(0.1)

  var y1 = d3.scaleBand()
    .domain(keys)
    .rangeRound([0, y0.bandwidth()])
    .padding(0.05)

  var x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d3.max(keys, key => d[key]))]).nice()
      .rangeRound([ 0,width - margin.right])

  color = d3.scaleOrdinal()
    .range([ "#8a89a6","#98abc5"])
  bar_styler = (bar)  => {
    return bar.attr("y", d => y1(d.key))
      .attr("x", d => margin.left)
      .attr("height", y1.bandwidth())
      .attr("width", d => x(d.value))
      .attr("fill", d => color(d.key));
  }

  const t = d3.transition().duration(500);

  var svg = d3.select(svgId);
  svg.selectAll("g").data(data).join("g")
    .attr("transform", d => `translate(0,${y0(d[groupKey])})`)
    .selectAll("rect")
    .data(d=>keys.map(key => ({key, value: d[key]})))
    .join(
      enter => bar_styler(enter.append("rect")),
      update => update.call(u => bar_styler(u.transition(t))),
      exit => exit.remove()
    );
  
  yAxis = g => g
  .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y0).tickSizeOuter(0))


  xAxis = g => g
    .attr("transform", `translate(${margin.left}, ${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(null, "s"))
    .call(g => g.select(".tick:last-of-type text").clone()
    .attr("x", 3)
    .attr("text-anchor", "start")
    .text(data.x));
    
    
    
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

  color = d3.scaleOrdinal().domain(keys)
    //.range([ "#2683c6","#32b3e2"])
    //.range([ "#f06d48","#83cda7"])
    //.range(["#4ca5b3", "#4089b7"])
    //.range([ "#ff8080", "#ffcccc"])
    //.range(["#6baed6","#00a140"])
    //.range(["LightSlateGray","#81ccbb"])
    .range(["#bec4f8","#81ccbb"])
    //.range(["#2e83be", "#6bb0d7"])
    
  bar_styler = (bar)  => {
    return bar.attr("x", d => x1(d.key))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => y(0) - y(d.value))
      //.style("opacity", "0.8")
      // .attr("data-toggle", "tooltip")
      // .attr("data-placement", "top")
      // .attr("title", d=>d.value)
      .attr("fill", d => color(d.key));
  }
  addTitle = rect => rect.selectAll("title")
  .data(d=>[d])
  .join("title")
  .text(d=>d.value);

  const t = d3.transition().duration(500);

  d3.select(svgId+" > g:nth-child(1)").selectAll("g").data(data).join("g")
    .attr("transform", d => `translate(${x0(d[groupKey])},0)`)
    .selectAll("rect")
    .data(d=>keys.map(key => ({key, value: d[key]})))
    .join(
      enter => addTitle(bar_styler(enter.append("rect"))),
      update => addTitle(update.call(u => bar_styler(u.transition(t)))),
      exit => exit.remove()
    );
  
  xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)    
    .call(d3.axisBottom(x0).tickSizeOuter(0))

  yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .transition(t)
    .call(d3.axisLeft(y));
    
  d3.select(svgId+" > g:nth-child(2)")
      .call(xAxis).selectAll("text")
      .attr("dx", "-1em").attr("dy", "-0.2em")
      .attr("transform", "rotate(-65)")
      .style("font-size", "1.2em")
      .attr("text-anchor", "end")
      
  d3.select(svgId+" > g:nth-child(3)")
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
      
        g.selectAll("rect").data(d=>[d]).join("rect")
            .attr("x", -19)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", color);
      
            g.selectAll("text").data(d=>[d]).join("text")
            .attr("x", -24)
            .attr("y", 9.5)
            .attr("dy", "0.35em")
            .text(d => d);
      }
  d3.select(svgId+" > g:nth-child(4)")
      .call(legend);
}

/*     draw Map       */
function drawMap(){
  svg_id ="#map-svg";
  mapData = DataContext.mapData;

  var svgBounds = d3.select(svg_id).node().getBoundingClientRect();

  var height = 600;
  var width = 700;
  
  colors = ["#bdd7e7","#6baed6", "#3182bd", "#08519c"];
  brackets = DataContext.bracket.map(d=>d.bracket.toLowerCase());
  ranges = DataContext.bracket.map(d=>d.range);
  var colorScale = d3.scaleOrdinal()
    .domain(brackets)
    .range(colors);
  
  projection = d3.geoConicConformal().scale(350).translate([200, 270]);
  var path = d3.geoPath().projection(projection);
  //africaFeatures = topojson.feature(mapData, mapData.objects.continent_Africa_subunits).features;
  africaFeatures = mapData.features;
  DataContext.africaFeatures = africaFeatures;
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
        .attr("id", d=>getISO(d))
        .attr("country", d=> getCountryName(d))
        .style("fill", d=> 
        {
          try{
            return colorScale(DataContext.ds[DataContext.ds.findIndex(k=> k.country == getCountryName(d))].bracket)
          }
          catch(ex){
            return "#d9d9d9";
          }
        })
        .attr("originalcolor", d=> 
        {
          try{
            return colorScale(DataContext.ds[DataContext.ds.findIndex(k=> k.country == getCountryName(d))].bracket)
          }
          catch(ex){
            return "#d9d9d9";
          }
        })
        .on("click", countryMouseClick)
        .on("mouseenter", countryMouseEnter)
        .on("mousemove", countryMouseMove)
        .on("mouseleave", countryMouseLeave);

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
        .attr("fill", d=>colorScale(d.toLowerCase()));
  console.log(ranges);
    g.append("text")
        .attr("x", -24)
        .attr("y", 9.5)
        .attr("dy", "0.35em")
        .text((d,i) => d+` income (PPP: ${ranges[i]})`);
  }
svg.append("g")
  .call(legend);

svg.append("g").selectAll("path")
  .data(DataContext.smallIslands)
  .join("path")
  .attr("d", d=>d.d)
  .attr("transform", d=>`translate(${d.x},${d.y})`)
  .classed("countries", true)
  .attr("id", d=>getISO(d))
  .attr("country", d=> getCountryName(d))
  .style("fill", d=> 
  {
    try{
      return colorScale(DataContext.ds[DataContext.ds.findIndex(k=> k.country == getCountryName(d))].bracket)
    }
    catch(ex){
      return "#d9d9d9";
    }
  })
  .attr("originalcolor", d=> 
  {
    try{
      return colorScale(DataContext.ds[DataContext.ds.findIndex(k=> k.country == getCountryName(d))].bracket)
    }
    catch(ex){
      return "#d9d9d9";
    }
  })
  .on("click", countryMouseClick)
  .on("mouseenter", countryMouseEnter)
  .on("mousemove", countryMouseMove)
  .on("mouseleave", countryMouseLeave);

  svg.append("g").attr("id", "pin-g");
}

function loadListOfCountries(){
  countries = DataContext.ds.map(a=>a.country)
  countries.push("Africa")
  countries.sort();
  d3.select("#select-country-options")
    .selectAll("option")
    .data(countries)
    .join("option")
    .attr("value", d=>d)
    .text(d=>d)
    .attr("id", d=>"option-"+CountryNameToISO(d))
    .attr("selected", d=>(d=="Africa")?true:null)
    ;
}

/*    years charts events    */
function changeCountry(country)
{
  iso = CountryNameToISO(country);


  if(country!="Africa" && !DataContext.ds.some(d=> d.country == country))
  {
    showUserMessage(`There is no data available related to ${country}`);return;
  }

  d3.selectAll("#select-country-options option").attr("selected", null);
  d3.select("#select-country-options").select("#option-"+iso).attr("selected", true);

  try{
    if(DataContext.selectedCountryISO)
    {
      const oldCountry = d3.select("#"+DataContext.selectedCountryISO);
      c2 = oldCountry.attr("originalcolor");
      oldCountry.style("fill", c2);
  }}
  catch(err){
      console.log("country is selected");
  }
  try{
    const newCountry = d3.select("#"+iso);
    dropPin(iso,"#map-svg")
    if(newCountry)
    {
      c1 = newCountry.attr("originalcolor");
      newCountry.style("fill",`url("${c1}-pattern")`)

    }
  }catch(err){
    console.log("country is selected");
  }
  
  
    DataContext.selectedCountry=country;
    DataContext.selectedCountryISO= iso;
    drawYearBarChart(DataContext.selectedCountry);
}

function countryMouseClick(evnt, datum){
  changeCountry(getCountryName(datum));
}

function countryMouseEnter(ent, datum){
  d3.select("#tooltip-country").style("opacity", 1);
  var country = getCountryName(datum)
  var row = DataContext.ds[DataContext.ds.findIndex(item=>item.country == country)];

  d3.selectAll(".info-country-name").text(country);
  if(row)
  {
    d3.selectAll(".info-population").text("population: " + f(row.population));
    d3.selectAll(".info-GDP").text("PPP: "+ f(row.GDP));
    d3.selectAll(".info-req-EU").text(f(row.EU));
    d3.selectAll(".info-req-normal-EU").text(f(row.Normal_EU));
    d3.selectAll(".info-req-IT").text(f(row.IT));
    d3.selectAll(".info-req-normal-IT").text(f(row.Normal_IT));
    d3.selectAll(".info-bracket-name").text(row.bracket+" income");
  }
  else{
    d3.selectAll(".info-population").text("population: NA");
    d3.selectAll(".info-GDP").text("PPP: "+ "NA");
    d3.selectAll(".info-req-EU").text("NA");
    d3.selectAll(".info-req-normal-EU").text("NA");
    d3.selectAll(".info-req-IT").text("NA");
    d3.selectAll(".info-req-normal-IT").text("NA");
    d3.selectAll(".info-bracket-name").text("NA");
  }

}

function countryMouseMove(evnt, datum){
  tooltip = d3.select("#tooltip-country");
  tooltip.style("transform", `translate(`
      + `calc( -50% + ${evnt.pageX}px),`
      + `calc( 10% + ${evnt.pageY}px)`
      + `)`)
}

function countryMouseLeave() {
  d3.select("#tooltip-country").style("opacity", 0)
}

function normalizeYears()
{
  DataContext.normalizeYears = !DataContext.normalizeYears;
  drawYearBarChart(DataContext.selectedYearPlot);
}

function drawYearBarChart(country="Africa")
{
  DataContext.selectedYearPlot = country;
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
  var vmargin = ({left: 180, bottom: 50, right:150 , top: 80})

  if(plotType=="requests")
    var keys = ["EU", "IT"];
  else
    var keys= [plotType]
    
  if(plotType=="requests" || plotType=="residents")
  {
    d3.select("#normalize-country-switch-div").classed("animate__fadeInDown", true)
    .classed("animate__fadeOutUp", false).select("input").attr("disabled", null);
    if(DataContext.normalizeCountries)
      keys = keys.map(d=> "Normal_"+d);
  }
  else
    d3.select("#normalize-country-switch-div").classed("animate__fadeInDown", false)
    .classed("animate__fadeOutUp", true).select("input").attr("disabled", "disabled");
  
  drawGroupBarChart(DataContext.ds, "#country-bar-chart-horizontal", margin, "country", keys)
  drawVerticalGroupBarChart(DataContext.ds, "#country-bar-chart-vertical", vmargin, "country", keys)
}

/*      bracket charts      */
function drawSunburst(data,showNameInLeaf){
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
  styler = a => a
    .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
    .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
    
  const t1 = d3.transition().duration(750);

  const path = g.select("g:nth-child(1)")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join(
      enter => styler(enter.append("path")
        .attr("x0", d=>d.x0)
        .attr("x1",d=>d.x1)
        .attr("d", d => arc(d.current))),

      update => update.call(u=>styler(u)
        .transition(t1)
        .attrTween("d", arcTweenUpdate).on("end", function(d){d3.select(this).attr("x0",d.x0).attr("x1", d.x1);})
        ),
      exit => exit.remove()
    )

    

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
      .classed("sunburst-label", true)
      .attr("fill-opacity", d => +labelVisible(d.current))
      .attr("transform", d => labelTransform(d.current))
      .text(d => {
        if((!showNameInLeaf) &&(d.depth>=3))
          return d.data.value;
        else
          return d.data.name.substr(0,13);
      });

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

    const t = d3.transition().duration(750);
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

  function arcTweenUpdate(a) {
    element = d3.select(this)
    var x0 = element.attr("x0");
    var x1 = element.attr("x1");

    var i = d3.interpolate({x0: x0, x1: x1}, a);
    var flag = false;
    return function(t) {
      var b = i(t);
      return arc(b);
    };
  }
  
}

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
  var isRequest = false
  if(plotType=="requests")
  {
    isRequest = true;
    d3.selectAll("#sunburst-options").classed("animate__fadeInDown", true)
    .classed("animate__fadeOutUp", false);
    var keys = ["EU", "IT"];
  }
  else
  {
    d3.selectAll("#sunburst-options").classed("animate__fadeInDown", false)
    .classed("animate__fadeOutUp", true);
    var keys= [plotType]
  }

    
  if(plotType=="requests" || plotType=="residents")
  {
    d3.select("#normalize-bracket-switch-div")
      .classed("animate__fadeInDown", true)
      .classed("animate__fadeOutUp", false).select("input").attr("disabled", null);

    if(DataContext.normalizeBrackets)
      keys = keys.map(d=> "Normal_"+d);
  }
  else
    d3.select("#normalize-bracket-switch-div")
      .classed("animate__fadeInDown", false)
      .classed("animate__fadeOutUp", true).select("input").attr("disabled", true);


  var margin = ({top: 50, right: 50, bottom: 80, left: 80})
  drawGroupBarChart(DataContext.bracket, "#bracket-bar-chart", margin, "bracket",  keys);

  if(plotType=="requests")
  { 
    let key = DataContext.selectedSunburst + "Hierarchy";
    if(DataContext.normalizeBrackets)
      key = "Normal_"+key;
    var hierarchyData = DataContext[key];
    drawSunburst(hierarchyData, isRequest);
  }
  else
  {
    var hierarchyData = DataContext[keys[0]+"Hierarchy"]
    drawSunburst(DataContext[keys[0]+"Hierarchy"], isRequest);
  }
  drawSunburst(hierarchyData, isRequest);
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
function CreateBracketInfo(data){
  console.log(data)
  d3.select("#bracket-info")
    .selectAll("div")
    .data(data)
    .join("div")
    .classed("info-card", true)
    .selectAll("p")
    .data(d=>[d.bracket+" income", d.range, "GDP per capita (PPP)"])
    .join("p")
    .text(d=>d);
}
/*    Initiations    */
function initSVGs(svgIds){
  svgIds.forEach(d=>d3.select(d).selectAll("g").data([0,0,0,0]).join("g"));
}
function showTotals(){
  d3.select("#EU-total-value").text(f(DataContext.total.EUSum));
  d3.select("#IT-total-value").text(f(DataContext.total.ITSum));
}

function loadData(){

  Promise.all([d3.csv("data/allcodes.csv").
    then(function (csv){
      csv.forEach(d=> DataContext.codes[d.code.trim()]=d.country.trim())}), 
    d3.csv("data/ds.csv").then(function(csv){
      var total ={
        IT : {2013:0, 2014:0, 2015:0, 2016:0, 2017:0, 2018:0},
        EU : {2013:0, 2014:0, 2015:0, 2016:0, 2017:0, 2018:0},
        Normal_EU : {2013:0, 2014:0, 2015:0, 2016:0, 2017:0, 2018:0},
        Normal_IT : {2013:0, 2014:0, 2015:0, 2016:0, 2017:0, 2018:0},
        ITSum:0,
        EUSum:0
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
            total.ITSum += d["IT"+i];
            total.EUSum += d["EU"+i];
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
      showTotals();
      
    }),
    d3.csv("data/bracket.csv").then(csv=>{
      csv.forEach(d=>{
        d.IT = +d.IT;
        d.EU = +d.EU;
        d.residents = +d.residents;
        d.population = +d.population;
        d.Normal_IT = +d.Normal_IT;
        d.Normal_EU = +d.Normal_EU;
        d.Normal_residents = +d.Normal_residents;
      })
      DataContext.bracket = csv;
      CreateBracketInfo(csv);
    }),
    d3.json("data/custom.geo.json").then(function(mapData){

      console.log(mapData);
      DataContext.mapData =mapData;
    }),
    d3.json("data/islands.json").then(function(islands){
      console.log(islands);
      DataContext.smallIslands = islands.islands;
    })
  ]).then(()=>{
    loadListOfCountries();
    drawYearBarChart();
    drawBracketCharts();
    drawMap();
  }).catch( err =>console.log(err));
  
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

function dropPin(iso){
var selectedFeature = DataContext.africaFeatures.filter(d=>getISO(d)==iso);
smallIslandFlag = false;
if(selectedFeature.length == 0){
  selectedFeature = DataContext.smallIslands.filter(d=>d.iso == iso);
  smallIslandFlag = true;
}
return d3.select("#pin-g").selectAll("path")
    .data(selectedFeature)
    .join("path")
    .attr("d", "M0,0l-8.8-17.7C-12.1-24.3-7.4-32,0-32h0c7.4,0,12.1,7.7,8.8,14.3L0,0z")
    .classed("pin", true)
    .on("mouseenter", countryMouseEnter)
    .on("mousemove", countryMouseMove)
    .on("mouseleave", countryMouseLeave)
    .transition(750)
    .attr("transform", d=>
      !smallIslandFlag ? `translate(${projection(d3.geoCentroid(d))[0]},${projection(d3.geoCentroid(d))[1]})scale(0.75,0.75)` : `translate(${d.x},${d.y})scale(0.75,0.75)`)
}
        
$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();   
    initSVGs(["#year-bar-chart","#country-bar-chart-horizontal","#bracket-bar-chart"])
    loadData();
  });