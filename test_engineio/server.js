var express = require('express');
var app = express(); 
var engine  = require('engine.io');
var server    = require('http').createServer(app);
var io  = engine.attach(server);
var port = 8989;

io.on('connection', function(socket) {
	console.log('connected');
    socket.on('message', function(msg) {
        console.log('data: ' + msg);
        dispatch(JSON.parse(msg));
    });
    socket.on('close', function(){
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
			socket.send(JSON.stringify({method:name, args:args}));
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

app.use(express.static(__dirname));
app.get('/', function(req, res, next){
  res.sendfile('index.html');
});

server.listen(port, '0.0.0.0');

console.log('listening ' + port);
server.listen(port, '0.0.0.0');
