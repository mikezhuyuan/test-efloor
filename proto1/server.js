var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

var users = {};

io.sockets.on('connection', function (socket) {
  console.log('connected');
  users[socket.id] = {socket:socket};
  
  socket.on('update_pos', function(data){
    console.log('update_pos: ' + JSON.stringify(data));
    users[socket.id].pos = data;
  });

  socket.on('send_msg', function(data) {
    console.log('send_msg: ' + JSON.stringify(data));
    for(var i in users) {
      users[i].socket.emit('recv_msg', {id:parseInt(Math.random()*1000000), x:data.x, y:data.y, message:data.message});
    }
  });

  socket.on('disconnect', function () {
    console.log('delete user: ' + users[socket.id]);
    delete users[socket.id];
  });
});

server.listen(8989);