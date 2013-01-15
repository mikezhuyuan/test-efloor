var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

var users = {}, msg_lst = [];

io.sockets.on('connection', function (socket) {
  console.log('connected');
  users[socket.id] = {socket:socket};
  
  socket.on('update_pos', function(data, reply){
    console.log('update_pos: ' + JSON.stringify(data));
    users[socket.id].pos = data;
	
	var result = [];
	for(var i=0;i<msg_lst.length;i++){
		var msg = msg_lst[i];
		if(isPointInArea(msg, data)) {
			result.push(msg);
		}
	}
	
	reply(result);
  });

  socket.on('send_msg', function(data) {
	data.insertDate = new Date();
	data.id = parseInt(Math.random()*1000000);
	msg_lst.push(data);
	
    console.log('send_msg: ' + JSON.stringify(data));	
	
    for(var i in users) {
	  var user = users[i];
	  if(!isPointInArea(data, user.pos))
		continue;
		
      user.socket.emit('recv_msg', data);
    }
  });

  socket.on('disconnect', function () {
    console.log('delete user: ' + users[socket.id]);
    delete users[socket.id];
  });
  
  
});

var clearMsg = function() {
	if(msg_lst.length) {
		console.log('try removing: ' + msg_lst[0].insertDate);
	}
	while(msg_lst.length && (new Date() - msg_lst[0].insertDate > 3000)) {
		var data = msg_lst.shift();
		
		console.log('remove_msg: ' + JSON.stringify(data));
		for(var i in users) {
		  var user = users[i];
		  if(!isPointInArea(data, user.pos))
			continue;
				  
		  user.socket.emit('remove_msg', data);
		}
	}

	setTimeout(clearMsg, 1000);
};   

clearMsg();

server.listen(8989);

function isPointInArea(point, pos) {
	return point.x >= pos.start.x && point.x <= pos.end.x && point.y >= pos.start.y && point.y <= pos.end.y;
}