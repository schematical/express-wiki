# express-wiki
This is a simple package designed to allow you to add wiki functionality to your expressJS app.

##Install:
###Step 1:
`npm install -S express-wiki`

###Step 2:

```
var express = require('express');
//YOU WILL NEED SOME TYPE OF 'body-parser'.
var app = express();

var expressWiki = require('express-wiki')

app.use('/wiki', expressWiki({
	datastore: new expressWiki.datastores.FileSystem({
		dir:__dirname + '/.wiki'
	})
}));

```
###Setup 3:
Setup views. See the basic setup below in the [Views](#views) section.


###Views:
With the basic setup of this module you will need to provide your own views.
The simplest way is to copy the contents [./test/views](./test/views) into your views directory then overwrite the files as needed.


##Data Stores:
Data Stores are adapters that allow the wiki to save your information.

###expressWiki.datastores.FileSystem:
This uses your local file system for a data store.

__DO NOT USE THIS IN PRODUCTION__

```
app.use('/wiki', expressWiki({
	datastore: new expressWiki.datastores.FileSystem({
		dir:__dirname + '/.wiki'
	})
}));
```

###express-wiki-s3:
__NOTE: I havent built this yet, also I plan on splitting this out to another repo__

###[express-wiki-mongoose](https://www.npmjs.com/package/express-wiki-mongoose):
For use with MongoDB

```
var ExpressWikiMongoose = require('express-wiki-mongoose');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

app.use('/wiki', expressWiki({
    datastore: new ExpressWikiMongoose({
        mongoose: mongoose,
        modelName:'WikiRecord'//Optional
    })
}));
```



##Build your own:
You can create your own data store as long as you have the following functions:

* save
* load
* index

An example(that wouldn't do much. Is as follows:

```
app.use('/wiki', expressWiki({
	datastore: {
        save:function(wiki_path, record, callback){
            ///Do stuff
            return callback(err);
        },
        load:function(wiki_path, callback){
            //Load your record
           var record = {
                title:"My first Wiki Post",
                markdown:"###YAY!\n It's my first post"
           };

            return callback(
                null,
                record
            );
        },
        index:function(wiki_path, callback){
            var records = [
                {
                    path:'/path/to/my/first/post',
            	    title:"My first post",
            	    type:'dir' || 'post'
                }
            ]
            return callback(null, records);
        }
	}
}));
```

For a more detailed example checkout [./lib/datastores/FileSystem](./lib/datastores/FileSystem)

###Extending Routes:
You can extend the route logic that get run after the wiki entry is loaded and rendered.

```
app.use('/wiki', expressWiki({
    /* other stuff */
    routes:{
        show:function(req, res, next){
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
    }
}));
```


