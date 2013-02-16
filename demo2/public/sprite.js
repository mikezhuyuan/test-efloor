define(function(){
	var store = Object.create(null),
		speed = 0.05, 
		maxInstruct = 120

	function add(config) {
		store[config.name] = config
		var clazz = '.' + config.name + '{' +
		'position: absolute;' +
		'width: ' + config.width + 'px;' +
		'height: ' + config.height + 'px;' +
		'background: url(' + config.image + ') no-repeat top left;' +
		'}',
		direction = config.direction

		for(var prop in direction) {
			var kf = '@-webkit-keyframes ' + config.name + '-' + prop + '{',
				d = direction[prop]
			for(var i=0, l=d.length; i<l; i++) {
				 kf += (100*i/l) + '%{' + 
				 'background-position:' + d[i] + ';' +
				 '}'
			}

			document.styleSheets[0].insertRule(kf + '}', 0)
		}

		document.styleSheets[0].insertRule(clazz, 0)
	}

	var animation = function(name, direction, duration) {
		return name + '-' + direction + ' ' + (duration || store[name].duration) + 's step-end infinite'
	}

	var Sprite = function(id, name, charName, x, y){
		var dom = document.createElement('div')
		this.id = id
		this.x = x
		this.y = y
		this.name = name
		this.charName = charName
		this.dom = dom
		this.direction = 'down'		
		this.instructs = []

		var userName = document.createElement('div')
		userName.className = 'userName'	
		userName.innerText = name
		this.dom.appendChild(userName)

		Sprite.prototype.stop.apply(this)
		dom.className = 'sprite ' + charName
		dom.style.webkitAnimation = animation(charName, 'down')
		dom.style.left = x + 'px'
		dom.style.top = y + 'px'
	}

	Sprite.prototype = {
		position: function(){
			return {x:this.x, y:this.y}
		},
		walk: function(direction, duration) {
			var d = speed * duration
			switch(direction){
				case 'left':
				this.move(this.x - d, this.y)
				break;
				case 'up':
				this.move(this.x, this.y - d)
				break;
				case 'right':
				this.move(this.x + d, this.y)
				break;
				case 'down':
				this.move(this.x, this.y + d)
				break;
			}
		},
		stop: function() {
			this.dom.style.webkitAnimationPlayState = this.status = 'paused'			
		},
		animate: function(){
			this.dom.style.webkitAnimationPlayState = 'running'
			this.status = this.direction
		},
		move: function(x,y) {
			x = Math.round(x)
			y = Math.round(y)
			var d	
			if(x < this.x) {
				d = 'left'
			} else if(y < this.y) {			
				d = 'up'
			} else if(x > this.x ) {		
				d = 'right'	
			} else if(y > this.y) {
				d = 'down'
			}

			if (d) {
				if(this.status != d) {
					this.dom.style.webkitAnimation = animation(this.charName, d)

					if(this.status == 'paused')
						this.dom.style.webkitAnimationPlayState = 'running'

					this.direction = this.status = d
				}
				
				this.dom.style.left = (this.x = x) + 'px'
				this.dom.style.top = (this.y = y) + 'px'			
			}
		},
		instruct: function(posArray) {
			if(posArray && posArray.length)
				Array.prototype.push.apply(this.instructs, posArray)

			if(this.instructs.length > maxInstruct) {
				this.instructs.splice(0, this.instructs.length - maxInstruct)
			}
		},
		next: function() {
			var pos = this.instructs.shift()
			if(pos) {			
				this.move(pos.x, pos.y)
			} else {
				this.stop()
			}
		},
		speak: function(txt) {
			if(this._clearDialog)
				clearTimeout(this._clearDialog);

			if(this.dialog) {
				this.dialog.parentNode.removeChild(this.dialog)
				this.dialog = null
			}

			if(!txt)
				return;

			var dialog = document.createElement('div')
			dialog.className = 'dialog'	
			dialog.innerText = txt
			this.dom.appendChild(dialog)
			this.dialog = dialog

			var _this = this
			this._clearDialog = setTimeout(function(){
				_this.speak(null)
				_this._clearDialog = null
			}, 10000);
		},
		destroy: function() {
			this.dom.parentNode.removeChild(this.dom)
			if(this.dialog)
				this.dialog.parentNode.removeChild(this.dialog)

			this._clearDialog && clearTimeout(this._clearDialog);
		}
	}

	return {
		initialize: function(config){			
			if(Array.isArray(config))
				for(var i=0;i<config.length;i++)
					add(config[i])
			else
				add(config)
		},
		
		all: function(){
			var r = []
			for(var p in store)
				r.push(p)
			return r
		},

		create: function(data) {			
			return new Sprite(data.id, data.name, data.charName, data.x, data.y)
		}
	}
})