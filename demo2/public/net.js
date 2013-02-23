define(['sockjs'], function(SockJS){
	var sockjs, 
		obj;

	return {
	  connect: function(callback) {
	  	var _this = this;
	  	sockjs = new SockJS('/endpoint');		
		
		sockjs.onopen = function()  {
		  sockjs.onmessage = function(e) {
		    //console.log('onmessage: ' + e);            
		    var data = JSON.parse(e.data), h;		    
	  		(h = _this.client[data.method]) && h.apply(null, data.args);
		  };

		  callback && callback()
		};

		sockjs.onclose = function()  {
		  //console.log('disconnected');
		  _this.onclose && _this.onclose()
		};
	  },

	  server : function(name) {
	    var args = Array.prototype.slice.call(arguments, 1);
	    sockjs.send(JSON.stringify({method:name, args:args}));
	  },

	  client : Object.create(null)
	};
})