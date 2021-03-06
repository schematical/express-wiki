var express = require('express');
var marked = require('marked');
var _ = require('lodash');

module.exports = Router = function(options){
	var datastore = options.datastore;
	if(!datastore){
		throw new Error("Invalid 'datastore' option passed in");
	}
	var renderer = options.renderer || new marked.Renderer();
	this.authorize = function(req, res, next){
		(options.authorize || function(req, res, next){ return next(); })(
				req,
				res,
				next,
				req.wiki.method,
				req.wiki.curr_path
		)
	}
	marked.setOptions({
		renderer: renderer
	});
	var router = express.Router();

	// middleware that is specific to this router
	router.use(function timeLog(req, res, next) {
		req.wiki = {
			renderer:renderer,
			datastore:datastore
		}
		return next();
	});
	// define the home page route
		var routes = options.routes || {};

		router.get(
			['/new', '/*/edit'],
			[
				Router.middleware.initWikiRouter('edit'),
				this.authorize,
				Router.middleware.loadFromDataStore,
				routes.edit || Router.routes.edit
			]
	);
	router.get(
			['/*/index', '/index'],
			[
				Router.middleware.initWikiRouter('index'),
				this.authorize,
				Router.middleware.indexFromDataStore,
				routes.index || Router.routes.index
			]
	);
	router.get(
			'/*',
			[
				Router.middleware.initWikiRouter('show'),
				this.authorize,
				Router.middleware.loadFromDataStore,
				Router.middleware.renderMarkdown,
				routes.show || Router.routes.show
			]
	);
	// define the about route
	router.post(
			'/*',
			[
				Router.middleware.initWikiRouter('update'),
				this.authorize,
				Router.middleware.saveToDataStore,
				Router.middleware.renderMarkdown,
				routes.create || routes.show || Router.routes.show
			]
	);

	return router;
}
Router.routes = {};
Router.routes.edit = function(req, res) {

	return res.render('wiki/edit', {
		markdown:(req.wiki.record && req.wiki.record.markdown) || '',
		title: (req.wiki.record && req.wiki.record.title) || "New Post",
		is_new: (req.wiki.curr_path && req.wiki.curr_path.length > 0)?false:true
	});
}
Router.routes.index = function(req, res) {
	for(var i in req.wiki.records){
		switch(req.wiki.records[i].type){
			case('dir'):
				req.wiki.records[i].full_path = req.baseUrl + req.wiki.records[i].path + '/index';
				break;
			default:
				req.wiki.records[i].full_path = req.baseUrl + req.wiki.records[i].path;
			break;
		}

	}
	return res.render('wiki/index', {
		records: req.wiki.records,
		title: req.wiki.curr_path
	});
}
Router.routes.show = function(req, res) {
	if(!req.wiki.html){
		return res.status(404).render('wiki/show', {
			title: 'Page not found'
		});
	}
	return res.render('wiki/show', {
		html:req.wiki.html,
		title: req.wiki.record.title
	});
}
Router.routes.delete = function(req, res) {
	//res.send('EDITING birds: req.baseUrl' + req.baseUrl + ' -  req.originalUrl: ' + req.originalUrl + ' - req.url:' + req.url + ' - req.params: ' + JSON.stringify(req.params));

}
Router.middleware = {}
Router.middleware.initWikiRouter = function(method){
		return function(req, res, next) {
			req.wiki.method = method;
			req.wiki.curr_path = (req.params[0] && '/' + req.params[0]) || '';
			res.locals.wiki = res.locals.wiki || {};
			res.locals.wiki.method = req.wiki.method;
			res.locals.wiki.curr_path = req.wiki.curr_path;
			res.locals.wiki.curr_url = req.baseUrl + req.wiki.curr_path;
			res.locals.wiki.edit_url = res.locals.wiki.curr_url + '/edit';
			res.locals.wiki.new_url = req.baseUrl + '/new';
			return next();
		}
}
Router.middleware.loadFromDataStore = function(req, res, next){
	return req.wiki.datastore.load(req.wiki.curr_path, function(err, record){
		if(err) return next(err);
		req.wiki.record = record;
		return next();
	});
}
Router.middleware.indexFromDataStore = function(req, res, next){
	return req.wiki.datastore.index(req.wiki.curr_path, function(err, records){
		if(err) return next(err);
		req.wiki.records = records;
		return next();
	});
}
Router.middleware.saveToDataStore = function(req, res, next){
	if(!req.body){
		return next(new Error("No req.body posted in"));
	}
	if(!req.body.title){
		return next(new Error("No req.body.title posted in"));
	}
	if(!req.body.markdown){
		return next(new Error("No req.body.markdown posted in"));
	}
	//TODO: Validate this
	req.wiki.record = {
		title: req.body.title,
		markdown: req.body.markdown
		//TODO: Add user here
	}
	var curr_path = req.body.path || req.wiki.curr_path;

	return req.wiki.datastore.save(curr_path, req.wiki.record, function(err){
		if(err) return next(err);
		return next();
	});
}
Router.middleware.renderMarkdown = function(req, res, next){
	if(!req.wiki.record || !req.wiki.record.markdown){
		return next();
		//return next(new Error("No 'req.wiki.markdown' to render from. Make sure you are running the 'loadFromDataStore' middleware"))
	}
	req.wiki.html = marked(req.wiki.record.markdown);

	return next();
}

Router.datastores = {};
Router.datastores.FileSystem = require('./datastores/FileSystem');