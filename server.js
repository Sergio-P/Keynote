// CollabHeatMap Server 
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var socket = require("./socket-config.js");
var fs = require('fs');
var PythonShell = require('python-shell');
//var restpg = require("./rest-pg.js");

var app = module.exports = express();
//var conString = require("./passwords.js")("conString");

var port = 8503;

var currentPy;

app.use(express.static(__dirname+'/resources'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(session({secret: 'ssshhh', saveUninitialized: false, resave: false}));

//var ses;

app.get("/shell", function(req,res){
    res.render("shell",{defscript: req.query.script});
});

app.post("/run-script", function(req,res){
    var scriptContent = req.body.content;
    if(scriptContent==null || scriptContent==""){
        res.end('{"status":"err"}');
        return;
    }
    scriptContent = transformContent(scriptContent);
    fs.writeFile("last_script.py",scriptContent,function(err){
        if(err){
            console.log("IO Error. Cannot create last_script.py");
            res.end('{"status":"err"}');
        }
        else{
            fs.chmod("last_script.py","0777");
            currentPy = new PythonShell("last_script.py");
            currentPy.on("message",pyMsg);
            currentPy.on("close",pyEnd);
            currentPy.on("error",pyError);
            res.end('{"status":"ok"}');
        }
    });
});

app.post("/send-script-msg", function(req,res){
    var msg = req.body.msg;
    if(currentPy==null || msg==null || msg==""){
        res.end('{"status":"err"}');
        return;
    }
    currentPy.send(msg);
    res.end('{"status":"ok"}');
});

app.post("/end-script", function(req,res){
    if(currentPy==null){
        res.end('{"status":"err"}');
        return;
    }
    currentPy.end(function(err){
        if(err) console.log(err);
    });
    res.end('{"status":"ok"}');
});

var pyMsg = function(message){
    console.log(message);
    socket.scriptMsg(message);
};

var pyEnd = function(){
    socket.scriptEnd();
};

var pyError = function(err){
    socket.scriptErr(err);
};

var transformContent = function(content){
    content = content.replace("\t","    ");
    //console.log(content);
    var lines = content.split("\n");
    var builder = "import sys\n";
    for(var i=0; i<lines.length; i++){
        var line = lines[i];
        var indent = "";
        for(var k=0; line.length; k++){
            if(line.charAt(k) == " "){
                indent += " ";
            }
            else{
                break;
            }
        }
        if(line.indexOf("print") != -1){
            builder += line +"\n" + indent + "sys.stdout.flush()\n";
        }
        else if(line.indexOf("input(") != -1){
            var r = line.indexOf("input(");
            var inner = line.substring(r+6,line.length-1);
            builder += indent + "print "+inner+"\n"+indent+"sys.stdout.flush()\n"+line.substring(0,r+6)+")\n";
        }
        else{
            builder += line + "\n";
        }
    }
    return builder;
};

if(!module.parent){
    var http = require('http').createServer(app);
    var io = require("socket.io")(http);
    http.listen(port,function(){
        console.log("Listening at port "+port+"\n Ctrl + C to shut down");
    });
    socket.configSocket(io);
}

