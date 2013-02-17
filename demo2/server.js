var express = require('express')
var sockjs  = require('sockjs')
var http = require('http')
var users = Object.create(null)
var handlers = Object.create(null)
var client = {
	call : function(conn, name) {
		var args = Array.prototype.slice.call(arguments, 2)
		conn.write(JSON.stringify({uid:conn.id, method:name, args:args}))
	}
}

var server = {
	register : function(name, handler) {
		handlers[name] = handler
	}
}

function broadcast(sender, callback) {
	Object.keys(users).forEach(function(id){
		var u = users[id]
		if(u && sender !== id && sender !== u )
			callback(u)
	})
}

var endpoint = sockjs.createServer()
endpoint.on('connection', function(conn) {
	var id = conn.id
	console.log('connected')

    conn.on('data', function(msg) {
        console.log('data: ' + msg)
        dispatch(JSON.parse(msg))
    })

    conn.on('close', function(){
    	broadcast(id, function(user){
			user.deleteUser(id)
		})

    	delete users[id]
    	console.log('disconnected')
    })

    function dispatch(data) {
    	var h = handlers[data.method] 
		if(h) {
			data.args.unshift(conn)
			h.apply(null, data.args)
		}
	}	
})

var User = (function(){
	var type = function(conn, data) {
		this.id = data.id = conn.id
		this.conn = conn
		this.data = data

		users[this.id] = this
	}

	type.prototype = {
		position: function(pos){
			if(!pos) return {x:this.data.x, y:this.data.y}
			this.data.x = pos.x
			this.data.y = pos.y
		},
		addUser: function(user){
			client.call(this.conn, 'addUser', user.data)
		},
		deleteUser: function(id){
			client.call(this.conn, 'deleteUser', id)	
		},
		instructUser: function(id, instructs){
			client.call(this.conn, 'instructUser', id, instructs)
		},
		userSpeak: function(id, txt) {
			client.call(this.conn, 'userSpeak', id, txt)
		}
	}

	return type
}())

function usersJson(except) {
	var r = []
	broadcast(except, function(u){		
		r.push(u.data)
	})

	return r
}

server.register('init', function(conn, data){
	data.x = parseInt(Math.random()*400)
	data.y = parseInt(Math.random()*400)

	var newUser = new User(conn, data),
		id = newUser.id
		
	client.call(conn, 'init', newUser.data, usersJson(id))

	users[id] = newUser

	broadcast(id, function(user){
		user.addUser(newUser)
	})
})

server.register('instructUser', function(conn, pos, instructs){
	var id = conn.id
	users[id].position(pos)

	broadcast(id, function(user){
		user.instructUser(id, instructs)
	})
})

server.register('userSpeak', function(conn, txt){
	var id = conn.id
	
	broadcast(id, function(user){
		user.userSpeak(id, txt)
	})
})

var app = express()
app.use(express.static(__dirname+'/public'));
var server = http.createServer(app)

endpoint.installHandlers(server, {prefix:'/endpoint'})

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html')
})

server.listen(9999, '0.0.0.0')
