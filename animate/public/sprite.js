define(function(){
	var store = Object.create(null)
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

	return {
		loadConfig: function(config){
			if(Array.isArray(config))
				for(var i=0;i<config.length;i++)
					add(config[i])
			else
				add(config)
		},
		animation: function(name, direction, duration) {
			return name + '-' + direction + ' ' + (duration || store[name].duration) + 's step-end infinite'
		},
		all: function(){
			var r = []
			for(var p in store)
				r.push(p)
			return r
		}
	}
})