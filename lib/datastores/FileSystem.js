var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');


module.exports = FileSystem = function(options){
	if(!options ||!options.dir){
		throw new Error("No valid 'dir' option passed in. Where should we save this stuff?");
	}
	this.dir = options.dir;
	return this;
}
FileSystem.prototype.save = function(wiki_path, record, callback){
	record.path = wiki_path;
	var full_path = path.join(this.dir, wiki_path);
	var full_dir = path.dirname(full_path);
	if(!fs.existsSync(full_dir)) {
		mkdirp.sync(full_dir);
	}
	var file_cont = JSON.stringify(record);
	return fs.writeFile(full_path, file_cont, callback);
}
FileSystem.prototype.load = function(wiki_path, callback){
	var full_path = path.join(this.dir, wiki_path);
	var full_dir = path.dirname(full_path);
	if(!fs.existsSync(full_dir)) {
		return callback(null, null, null);
	}
	return fs.readFile(full_path, function(err, file_cont){
		if(err) return callback(null);
		var record = null;
		try{
			record = JSON.parse(file_cont);
		}catch(err){
			return callback(err);
		}
		return callback(
				null,
				record,
				file_cont
		);
	});
}