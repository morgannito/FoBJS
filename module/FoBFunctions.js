const FoBCore = require("./FoBuilder");
const processer = require("./FoBProccess");

exports.ExecuteMoppelAll = ExecuteMoppelAll;
exports.ConsoleWin = ConsoleWin;

var FriendsList, NeighborList, ClanMemberList = [];
var ConsoleWin= null;

function ExecuteMoppelAll(fList, nList, cmList){
    FriendsList = fList;
    NeighborList = nList;
    ClanMemberList = cmList;

    ConsoleWin.webContents.send('print', "Do: Motivate all Clanmember (Count: "+ClanMemberList.length+")");
    var done = 0;
    
    var i = 0;
	var interval = setInterval(function(){
	    var Member = ClanMemberList[i];
		FoBCore.DoMotivate(Member.key)
            .then( body =>{
                var result = processer.GetMotivateResult(body);
                ConsoleWin.webContents.send('print', `${Member.item["name"]}: ${result}`);
            });
	    i++;
		if(i === ClanMemberList.length)
			clearInterval(interval);
	}, 2000);
}