var express = require('express')
var app = express()
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index2.html')
})

app.listen(3000, '0.0.0.0')