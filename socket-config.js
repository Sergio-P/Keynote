module.exports.configSocket = function(io){
    module.exports.scriptMsg = function(msg){
        io.emit("scriptMsg",{msg: msg});
    };
    module.exports.scriptEnd = function(){
        io.emit("scriptEnd",{});
    };
    module.exports.scriptErr = function(err){
        io.emit("scriptErr",err);
    };
};