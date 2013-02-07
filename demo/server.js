var express = require('express')
var sockjs  = require('sockjs')
var http = require('http')
var users = {}
var handlers = {}
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

var User = (function(){
	var type = function(conn, x, y) {
		this.id = conn.id
		this.conn = conn
		this.x = x
		this.y = y

		users[this.id] = this
	}

	type.prototype = {
		position: function(pos){
			if(!pos) return {x:this.x, y:this.y}
			this.x = pos.x
			this.y = pos.y
		},
		addUser: function(user){
			client.call(this.conn, 'addUser', user.id, user.x, user.y)
		},
		deleteUser: function(id){
			client.call(this.conn, 'deleteUser', id)	
		},
		instructUser: function(id, instructs){
			client.call(this.conn, 'instructUser', id, instructs)
		}
	}

	return type
}())

function usersJson(except) {
	var r = []
	broadcast(except, function(u){		
		r.push({id:u.id, x:u.x, y:u.y})
	})

	return r
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

server.register('init', function(conn){
	var id = conn.id, 
		x = parseInt(Math.random()*400), y = parseInt(Math.random()*400), 
		newUser = new User(conn, x, y)

	client.call(conn, 'init', id, x, y, usersJson(id))

	users[id] = newUser

	broadcast(id, function(user){
		user.addUser(newUser)
	})
})

server.register('instructUser', function(conn, instructs){
	var id = conn.id, pos = instructs[instructs.length-1]
	users[id].position(pos)

	broadcast(id, function(user){
		user.instructUser(id, instructs)
	})
})

var app = express()
app.use(express.static(__dirname));
var server = http.createServer(app)

endpoint.installHandlers(server, {prefix:'/endpoint'})

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html')
})

server.listen(9999, '0.0.0.0')
