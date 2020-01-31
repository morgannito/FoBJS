function getAllCommands(){
    return [
        'MoppleAll',
        'VisitAll',
        'SearchSnipLG',
        'StartProductionBot',
        'CollectSelf',
        'QueueSelf',
        'CollectIncident',
        'CollectTavern',
        'UpdateList',
        'Logout'
    ]
}

function getLoginCommands(){
    return [
        'Login'
    ]
}

exports.getAllCommands = getAllCommands;
exports.getLoginCommands = getLoginCommands;