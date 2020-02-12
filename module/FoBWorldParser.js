var fs = require('fs');
var FoBuilder = require('./FoBuilder');

/** @type {Array} */
var Worlds = undefined;
/** @type {Array} */
var PlayerWorlds = undefined;

function GetWorlds(cb = false) {
    FoBuilder.GetAllWorld().then((res) => {
        var resData = GetResponseData(res);
        FillWorldList(resData, cb);
    });
}
/**
 * 
 * @param {Array} resData 
 * @param {Function} cb 
 * @param {Array} ownWorlds 
 */
function FillWorldList(resData, cb = false, ownWorlds = false) {
    worlds = {}
    PlayerWorlds = {}
    if (resData !== undefined) {
        for (let i = 0; i < resData.length; i++) {
            const world = resData[i];
            if (ownWorlds) {
                _world = ownWorlds[world.id];
                if (_world !== undefined)
                    worlds[world.id] = PlayerWorlds[world.id] = { name: world.name, status: "active", hasCity: true, isCurrentCity: false }
                else
                    worlds[world.id] = { name: world.name, status: "available", hasCity: false, isCurrentCity: false }
            } else
                worlds[world.id] = { name: world.name, status: world.status, hasCity: (world.status == "active" || world.status == "current"), isCurrentCity: (world.status == "current") }
        }
    } else {
        for (let i = 0; i < resData.length; i++) {
            const world = resData[i];
            if (ownWorlds) {
                _world = ownWorlds.find((v) => { return (v.id === world.id); });
                if (_world !== undefined)
                    worlds[world.id] = PlayerWorlds[world.id] = { name: world.name, status: "active", hasCity: true, isCurrentCity: false }
                else
                    worlds[world.id] = { name: world.name, status: "available", hasCity: false, isCurrentCity: false }
            } else
                worlds[world.id] = { name: world.name, status: world.status, hasCity: (world.status == "active" || world.status == "current"), isCurrentCity: (world.status == "current") }
        }
    }
    Worlds = worlds;
    exports.Worlds = Worlds;
    exports.PlayerWorlds = PlayerWorlds;
    WriteWorldJson(Worlds);
    if (cb)
        cb();
}

function GetResponseData(res) {
    for (let i = 0; i < res.length; i++) {
        const resData = res[i];
        if (resData["requestClass"] === "WorldService" && resData["requestMethod"] === "getWorlds") {
            return resData["responseData"];
        }
    }
}

function WriteWorldJson(json) {
    fs.writeFile('worlds.json', JSON.stringify(json), (err) => {
        if (err) throw err
        return true;
    })
}

exports.Worlds = Worlds;
exports.GetWorlds = GetWorlds;
exports.FillWorldList = FillWorldList;