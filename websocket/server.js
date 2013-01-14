var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.configure(function (){
  io.set('authorization', function (handshakeData, callback) {
  	console.log(handshakeData);
    callback(null, true); // error first callback style 
  });
});

var users = {};

io.sockets.on('connection', function (socket) {
  console.log('connected');
  socket.on('login', function(data, ack){
  	data.socket = socket;
  	
	users[socket.id] || socket.on('send_msg', function(data) {
	  	console.log('send_msg: ' + JSON.stringify(data));
	      for(var i in users) {
	      	if(users[i].room == users[socket.id].room){
	      		users[i].socket.emit('recv_msg', data);
	      	}
	      }
	  });
	users[socket.id] = data;
	ack();
  });

  socket.on('disconnect', function () {
  	console.log('delete user: ' + users[socket.id]);
	delete users[socket.id];
  });
});

server.listen(8989);