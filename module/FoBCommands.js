function getAllCommands(){
    return [
        'MoppleAll',
        'VisitAll',
        'SearchSnipLG',
        'StartProductionBot',
        'CollectSelf',
        'QueueSelf',
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