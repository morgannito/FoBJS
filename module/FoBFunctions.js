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
    ClanMemberList.forEach(Member => {
        setTimeout(()=>{
            FoBCore.DoMotivate(Member.key)
            .then( body =>{
                var result = processer.GetMotivateResult(body);
                ConsoleWin.webContents.send('print', `${Member.item["name"]}: ${result}`);
            });
        }, 1500);
    });
}