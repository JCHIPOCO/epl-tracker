/**
 * Created by John on 6/17/16.
 */

lineChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = [];
    this.d = [];
    this.initVis();
}

lineChart.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 17, right:40, bottom:33, left:30};

    vis.width = 750 - vis.margin.left - vis.margin.right;

    vis.height = 400 - vis.margin.top - vis.margin.bottom;

    vis.x = d3.scale.linear()
        .range([0, vis.width]);

    vis.y = d3.scale.linear()
        .range([vis.height, 0]);

    vis.svg = d3.select("#"+vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.linegroup = vis.svg.append("g").attr("id", "lines");

    vis.circlegroup = vis.svg.append("g").attr("id", "circles")

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    vis.tip = d3.select("#"+vis.parentElement).append("div").attr("class","tooltip hidden");

    vis.svg_info = d3.select("#gInfo");

    vis.svg.append("text")
        .attr("id", "xlabel")
        .attr("text-anchor", "middle")
        .attr("transform", "translate("+ (vis.width/2) +","+(vis.height+30)+")")
        .text("Matchday");

    vis.wrangleData();
}

lineChart.prototype.wrangleData = function(){
    var vis = this;

    // Array of arrays initialization
    vis.matchDayArray = [];

    // Filter data with only finished fixtures and existing odds
    vis.finishedFixture = vis.data.filter(function(d){ return d.status == "FINISHED" && d.odds !== null;});

    // Filter data with null odds, replace with 0 odds
    vis.finishedNull = vis.data.filter(function(c){ return c.status == "FINISHED" && c.odds == null});
    for(var q = 0; q < vis.finishedNull.length; q++){
        vis.finishedNull[q].odds = {homeWin: 0, draw: 0, awayWin: 0};
    }

    // Final fixture list
    vis.finishedFixture = vis.finishedFixture.concat(vis.finishedNull);

    // Assign for later use in add_svg_info()
    vis.d = vis.finishedFixture;

    // Reorganize data as fixture lists per matchday
    for (var z = 0; z < Math.floor(vis.finishedFixture.length/10); z++){
        vis.matchDayArray.push(vis.finishedFixture.filter(function(d){ return d.matchday == z+1;}));
    }

    // Initialize displayData array, list of objects with name of team as keys
    vis.displayData = vis.matchDayArray[0].map(awayTeams).concat(vis.matchDayArray[0].map(homeTeams))
                         .sort(function(a, b) {
                            var textA = a.teamName.toUpperCase();
                            var textB = b.teamName.toUpperCase();
                            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                        });

    // Populate fixture data arrays for each team
    for (var i = 0; i < vis.displayData.length; i++){
        for (var j = 1; j < vis.matchDayArray.length; j++){
            for (var k = 0; k < (vis.displayData.length/2); k++){
                if (vis.displayData[i].teamName == vis.matchDayArray[j][k].awayTeamName){
                    vis.displayData[i].matches.push({
                        date: vis.matchDayArray[j][k].date,
                        playingAs: "AWAY",
                        opponent: vis.matchDayArray[j][k].homeTeamName,
                        self: vis.matchDayArray[j][k].awayTeamName,
                        matchday: vis.matchDayArray[j][k].matchday,
                        totalGoalsFor: vis.displayData[i].matches[j-1].totalGoalsFor + vis.matchDayArray[j][k].result.goalsAwayTeam,
                        totalGoalsAllowed: vis.displayData[i].matches[j-1].totalGoalsAllowed + vis.matchDayArray[j][k].result.goalsHomeTeam,
                        totalGoalsDifferential: vis.displayData[i].matches[j-1].totalGoalsDifferential + 
                                                vis.matchDayArray[j][k].result.goalsAwayTeam - vis.matchDayArray[j][k].result.goalsHomeTeam,
                        totalPoints: vis.displayData[i].matches[j-1].totalPoints + 
                                     pointsEarned(vis.matchDayArray[j][k].result.goalsAwayTeam - vis.matchDayArray[j][k].result.goalsHomeTeam),
                        winningOdds: vis.matchDayArray[j][k].odds.awayWin,
                        unique_id: vis.matchDayArray[j][k].unique_id
                    });
                }
                else if (vis.displayData[i].teamName == vis.matchDayArray[j][k].homeTeamName){
                    vis.displayData[i].matches.push({
                        date: vis.matchDayArray[j][k].date,
                        playingAs: "HOME",
                        opponent: vis.matchDayArray[j][k].awayTeamName,
                        self: vis.matchDayArray[j][k].homeTeamName,
                        matchday: vis.matchDayArray[j][k].matchday,
                        totalGoalsFor: vis.displayData[i].matches[j-1].totalGoalsFor + vis.matchDayArray[j][k].result.goalsHomeTeam,
                        totalGoalsAllowed: vis.displayData[i].matches[j-1].totalGoalsAllowed + vis.matchDayArray[j][k].result.goalsAwayTeam,
                        totalGoalsDifferential: vis.displayData[i].matches[j-1].totalGoalsDifferential +
                                                vis.matchDayArray[j][k].result.goalsHomeTeam - vis.matchDayArray[j][k].result.goalsAwayTeam,
                        totalPoints: vis.displayData[i].matches[j-1].totalPoints +
                                     pointsEarned(vis.matchDayArray[j][k].result.goalsHomeTeam - vis.matchDayArray[j][k].result.goalsAwayTeam),
                        winningOdds: vis.matchDayArray[j][k].odds.homeWin,
                        unique_id: vis.matchDayArray[j][k].unique_id
                    });
                }
            }
        }
    }

    function awayTeams (obj) {
        return {
            teamName: obj.awayTeamName,
            matches: [{
                date: obj.date,
                playingAs: "AWAY",
                opponent: obj.homeTeamName,
                self: obj.awayTeamName,
                matchday: obj.matchday,
                totalGoalsFor: obj.result.goalsAwayTeam,
                totalGoalsAllowed: obj.result.goalsHomeTeam,
                totalGoalsDifferential: obj.result.goalsAwayTeam - obj.result.goalsHomeTeam,
                totalPoints: pointsEarned(obj.result.goalsAwayTeam - obj.result.goalsHomeTeam),
                winningOdds: obj.odds.awayWin,
                unique_id: obj.unique_id
            }]
        };
    }

    function homeTeams (obj) {
        return {
            teamName: obj.homeTeamName,
            matches: [{
                date: obj.date,
                playingAs: "HOME",
                opponent: obj.awayTeamName,
                self: obj.homeTeamName,
                matchday: obj.matchday,
                totalGoalsFor: obj.result.goalsHomeTeam,
                totalGoalsAllowed: obj.result.goalsAwayTeam,
                totalGoalsDifferential: obj.result.goalsHomeTeam - obj.result.goalsAwayTeam,
                totalPoints: pointsEarned(obj.result.goalsHomeTeam - obj.result.goalsAwayTeam),
                winningOdds: obj.odds.homeWin,
                unique_id: obj.unique_id
            }]
        };
    }

    function pointsEarned(diff){
        if(diff < 0){ return 0}
        else if ( diff == 0) { return 1}
        else { return 3}
    }

    vis.updateVis();
}

lineChart.prototype.add_svg_info = function(id) {
    var vis = this;

    function getFixtureById (obj){
        return obj.unique_id == id;
    }

    vis.displayFixture = vis.d.find(getFixtureById);

    var fixtureDate = new Date(vis.displayFixture.date);
    var simpleDateformat = d3.time.format("%B %e, %Y");

    vis.svg_info.style("display","block");
    vis.svg_info.select("#infomatchday").text("Matchday: " + vis.displayFixture.matchday)
        .style("font-size","15px")
        .style("font-weight","bold");
    vis.svg_info.select("#image1").transition().attr("xlink:href", 'data/logos/' + changeName(vis.displayFixture.homeTeamName) + '.png');
    vis.svg_info.select("#image2").transition().attr("xlink:href", 'data/logos/' + changeName(vis.displayFixture.awayTeamName) + '.png');
    vis.svg_info.select("#infodate").transition().text(simpleDateformat(fixtureDate));
    vis.svg_info.select("#hometeam").transition().text(changeName(vis.displayFixture.homeTeamName));
    vis.svg_info.select("#score").text(vis.displayFixture.result.goalsHomeTeam + "-" + vis.displayFixture.result.goalsAwayTeam)
        .style("font-size", "50px");
    vis.svg_info.select("#awayteam").transition().text(changeName(vis.displayFixture.awayTeamName));
    vis.svg_info.select("#infoodds").text("Betting Odds")
        .style("font-size","15px")
        .style("font-weight","bold");
    vis.svg_info.select("#homeOddsLabel").transition().text("Home Win:");
    vis.svg_info.select("#homeOdds").text(vis.displayFixture.odds.homeWin)
        .style("font-size","19px")
        .attr("fill","red");
    vis.svg_info.select("#awayOddsLabel").transition().text("Away Win:");
    vis.svg_info.select("#awayOdds").text(vis.displayFixture.odds.awayWin)
        .style("font-size","19px")
        .attr("fill","red");
    vis.svg_info.select("#drawOddsLabel").transition().text("Draw:");
    vis.svg_info.select("#drawOdds").text(vis.displayFixture.odds.draw)
        .style("font-size","19px")
        .attr("fill", "red");
}

lineChart.prototype.updateVis = function(){
    var vis = this;

    var sel = document.getElementById('attribute');
    vis.selected = sel.options[sel.selectedIndex].value;

    vis.ymax = d3.max(vis.displayData, function(d) {
        return d3.max(d.matches, function (e) {
            return e[vis.selected]
        })
    })

    vis.ymin = d3.min(vis.displayData, function (d) {
        return d3.min(d.matches, function(e) {
            return e[vis.selected]
        })
    })

    vis.y.domain([vis.ymin, vis.ymax]);

    vis.xmin = d3.min(vis.displayData, function (d) {
        return d3.min(d.matches, function (e) {
            return e.matchday
        })
    })

    vis.xmax = d3.max(vis.displayData, function (d) {
        return d3.max(d.matches, function (e) {
            return e.matchday
        })
    });

    vis.x.domain([vis.xmin, vis.xmax]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom")
        .ticks(vis.xmax);

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left");

    vis.line = d3.svg.line()
        .x(function (d) {
            return vis.x(d.matchday);
        })
        .y(function (d) {
            return vis.y(d[vis.selected]);
        });

    vis.lines = vis.svg.select("#lines").selectAll(".firstline").data(vis.displayData);

    vis.lines.transition().duration(1000)
        .attr("d",function (d) { return vis.line(d.matches);})
        .style("stroke", function (d) {
            return maincolor(changeName(d.teamName));
        })
        .attr("id",function(d){
            return (changeName(d.teamName).replace(/\s+/g, ''));
        })
        .style("opacity",.4)
        .style("stroke-width",3);

    vis.lines.enter().append("path").attr("class","firstline").transition().duration(500)
        .attr("d", function(d) {
            return vis.line(d.matches);
        })
        .style("stroke", function(d) {
            return maincolor(changeName(d.teamName));
        })
        .style("stroke-width",3)
        .style("opacity",.4)
        .attr("id", function(d){
            return(changeName(d.teamName).replace(/\s+/g, ''))
        });

    vis.lines
        .on("click", function(d){
            var active   = vis.line.active ? false : true;
            if(active){
                unhighlightTeam2(changeName(d.teamName));
            }
            else{
                highlightTeam2(changeName(d.teamName));
            }
            vis.line.active = active;
        })
        .on("mouseout", function(b){
            unhighlightTeam(changeName(b.teamName));
            vis.tip.classed("hidden", true);
        })
        .on("mouseover", function(d){
            highlightTeam(changeName(d.teamName));
            var mouse = d3.mouse(vis.svg.node()).map(function (d) {
                return parseInt(d);
            });
            vis.tip.classed("hidden", false)
                .attr("style", "left:" + (mouse[0] - 25) + "px;top:" + (mouse[1] + 40) + "px")
                .html("<span style='color:blue'>" + d.teamName + "</span>");
        });

    vis.circlegroup2 = vis.svg.select("#circles").selectAll(".circlegroup").data(vis.displayData);

    vis.circlegroup2.selectAll("circle").data(function(d){return(d.matches)}).transition().duration(1500)
        .attr("fill", function(d) {
            return strokecolor(changeName(d.self));
        })
        .attr("stroke", "black")
        .attr("cx", function(d) {
            return vis.x(d.matchday);
        })
        .attr("cy", function(d) {
            return vis.y(d[vis.selected]);
        })
        .attr("r",4)
        .attr("id", function(d){
            return("game" + d.unique_id)
        })
        .attr("class", function(d){
            return changeName(d.self).replace(/ +/g, '')
        });


    vis.circlegroup2.enter().append("g").attr("class","circlegroup").selectAll("circle").data(function(d){ return d.matches;}).enter()
        .append("circle")
        .attr("visibility","hidden")
        .attr("class","circle")
        .attr("stroke","black")
        .attr("stroke-width",".5px")
        .attr("fill", function(d) {
            return strokecolor(changeName(d.self));
        })
        .attr("cx", function(d){
            return vis.x(d.matchday);
        })
        .attr("cy", function(d){
            return vis.y(d[vis.selected]);
        })
        .attr("r",4)
        .attr("id", function(d){
            return("game" + d.unique_id.toString())
        })
        .attr("class", function(d){
            return changeName(d.self).replace(/ +/g, '')
        });

    vis.circlegroup2.selectAll("circle")
        .on("mouseover", function(d,i){
            var mouse = d3.mouse(vis.svg.node()).map(function (d) {
                return parseInt(d);
            });
            vis.tip.classed("hidden", false)
                .attr("style", "left:" + (mouse[0] + 35) + "px;top:" + (mouse[1] + 40) + "px")
                .html("<span style='color:black'><b>" + d[vis.selected] + "</b></span>");
        })
        .on("mouseout", function(d){
            vis.tip.classed("hidden", true);
        })

    vis.circlegroup2.selectAll("circle")
        .on("click", function(d){
            highlightGame(d.unique_id.toString());
        });

    vis.lines.exit().transition().remove();

    vis.svg.select(".x-axis").transition().duration(500).call(vis.xAxis);
    vis.svg.select(".y-axis").transition().duration(500).call(vis.yAxis);
};
