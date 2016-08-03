"use strict";
let app = angular.module("PyTest",[]);

app.controller("MainController",function($scope,$http) {
    var self = $scope;
    self.scriptContent = (defscript!=null && defscript!="")?defscript:"#Write your python code here...";
    self.scriptResult = "";
    self.scriptRunning = false;
    self.scriptInput = "";

    var socket = io("localhost:8503");

    self.runScript = function(){
        let postdata = {content: self.scriptContent};
        self.scriptResult = "<span class='gray'>["+(new Date()).toLocaleTimeString("es")+"] Script Start</span>\n";
        $http({url: "run-script", method: "post", data:postdata}).success(function(data){
            if(data.status != "ok"){
                console.log("ERROR");
            }
            else{
                self.scriptRunning = true;
            }
        });
    };

    self.receiveMsg = function(msg){
        self.scriptResult += msg + "\n";
        $scope.$apply();
    };

    self.sendInput = function(){
        if(!self.scriptRunning) return;
        let postdata = {msg: self.scriptInput};
        self.scriptResult =  self.scriptResult.substring(0,self.scriptResult.length-1) +
            "<span class='blue'>" + self.scriptInput + "</span>\n";
        self.scriptInput = "";
        $http({url: "send-script-msg", method: "post", data:postdata}).success(function(data){
            if(data.status != "ok"){
                console.log("ERROR");
            }
        });
    };

    socket.on("scriptMsg",function(data){
        self.receiveMsg(data.msg);
    });

    socket.on("scriptEnd",function(data){
        self.scriptRunning = false;
        self.scriptResult += "<span class='gray'>["+(new Date()).toLocaleTimeString("es")+"] Script End</span>";
        $scope.$apply();
    });

    socket.on("scriptErr",function(data){
        console.log(data);
        self.scriptResult += "<span class='red'>"+data.traceback+"</span>";
        $scope.$apply();
    });

});

app.filter("sanitize", ['$sce', function($sce) {
    return function(htmlCode){
        return $sce.trustAsHtml(htmlCode);
    };
}]);

app.directive('ngAllowTab', function () {
    return function (scope, element, attrs) {
        element.bind('keydown', function (event) {
            if (event.which == 9) {
                event.preventDefault();
                var start = this.selectionStart;
                var end = this.selectionEnd;
                element.val(element.val().substring(0, start)
                    + '    ' + element.val().substring(end));
                this.selectionStart = this.selectionEnd = start + 4;
                element.triggerHandler('change');
            }
        });
    };
});