
var express = require('express');
var bodyParser = require('body-parser')

var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
var wikiRouter = require('../lib')
app.set('view engine', 'hjs');
app.set('views', __dirname + '/views');
app.use('/wiki', wikiRouter({
	datastore: new wikiRouter.datastores.FileSystem({
		dir:__dirname + '/.wiki'
	})
}));
app.get('/', function (req, res) {
	res.send('Hello World!');
});

app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});