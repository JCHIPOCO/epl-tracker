var fixtureData;

$.ajax({
    headers: { 'X-Auth-Token': 'c53d14d63a5b4a91af3d15d83197f6c8' },
    url: 'https://api.football-data.org/v1/competitions/426/fixtures',
    dataType: 'json',
    type: 'GET',
}).done(function(response) {

    fixtureData = response.fixtures;

    for(var i = 0; i < fixtureData.length; i++){
            fixtureData[i].unique_id = i+1;
    }

    createVis();
});

function createVis(){
    intra_season = new lineChart("chartz", fixtureData);
}

function updateVars(){
    intra_season.wrangleData();
}

function changeName (str){
        if (str == "Manchester City FC"){
            return "Man City";
        }
        else if(str == "Manchester United FC"){
            return "Man United";
        }
        else{
            for(var i = 0; i < nameArray.length; i++){
                if(str.includes(nameArray[i])){
                    return nameArray[i];
                }
            }
        }
}

function highlightTeam(unformatted_team){

    var team = unformatted_team.replace(/ +/g, "");

    intra_season.svg.selectAll("#"+team)
        .style("opacity", 1.0)
}

function unhighlightTeam(unformatted_team){

    var team = unformatted_team.replace(/ +/g, "");

    intra_season.svg.selectAll("#"+team)
        .style("opacity", 0.4);
}

function unhighlightTeam2(unformatted_team){
    var team = unformatted_team.replace(/ +/g, "");

    intra_season.svg.selectAll(".firstline")
        .attr("visibility", "hidden");

    intra_season.svg.selectAll("#"+team)
        .attr("visibility", "visible");

    intra_season.svg.selectAll("."+team)
        .attr("visibility", "visible");
}

function highlightTeam2(unformatted_team){
    var team = unformatted_team.replace(/ +/g, "");

    intra_season.svg.selectAll(".firstline")
        .attr("visibility","visible");

    intra_season.svg.selectAll("circle")
        .attr("visibility","hidden");
}

var old_game_id= -1;

function highlightGame(game_id){

    unhighlightGame(old_game_id);

    old_game_id = game_id;

    intra_season.svg.selectAll("#game"+game_id).transition().duration(1000)
        .attr("stroke","#777")
        .attr("stroke-width","2px")
        .style("opacity",1)
        .attr("r",12);

    intra_season.add_svg_info(game_id);
}

function unhighlightGame(game_id){

    intra_season.svg.selectAll("#game"+game_id).transition().duration(1000)
        .attr("r",4)
        .style("opacity",1)
        .attr("stroke","black")
        .attr("stroke-width",".5px");
}
