var express = require('express');
var sockjs  = require('sockjs');
var http    = require('http');
var handlers = {};
var sockjs_echo = sockjs.createServer();
sockjs_echo.on('connection', function(conn) {
	console.log('connected');
    conn.on('data', function(msg) {
        console.log('data: ' + msg);
        dispatch(JSON.parse(msg));
    });
    conn.on('close', function(){
    	console.log('disconnected');
    });

    var handlers = {};

    function dispatch(data) {
    	var h;
    	(h = handlers[data.method]) && h.apply(null, data.args);          
	}

	var remote = {
		call : function(name) {
			var args = Array.prototype.slice.call(arguments, 1);
			conn.write(JSON.stringify({method:name, args:args}));
		},

		register : function(name, handler) {
			handlers[name] = handler;
		}
	};

	remote.register('getAccount', function(id){
		console.log('getAccount: ' + id);
		if(id % 2 == 1)
			remote.call('showAccount', 'mike');
		else
			remote.call('showAccount', 'jane');
	});
});

var app = express();
var server = http.createServer(app);

sockjs_echo.installHandlers(server, {prefix:'/endpoint'});

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

server.listen(9999, '0.0.0.0');
