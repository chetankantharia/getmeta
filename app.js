var express   = require('express');
var app       = express();
var request   = require('request');
var cheerio   = require('cheerio');
var apicache  = require('apicache').options({ debug: true }).middleware;
var cors      = require('cors');


app.options(cors());

app.get('/', apicache('5 minutes'), function(req, res){

	if(req.query.url) {
		request(req.query.url, function(error, response, body){

			//On Error 
			if(error){
				res.status(500).json(error);
			}

			// On Response Body
			if(body){
				var $ = cheerio.load(body);

				var title = $('title');
				var meta  = $('meta');
				var keys  = Object.keys(meta);

				//Init default title and description
				var defaultTitle = title[0].children[0].data;
				var defaultDescription;

				var metaTag = {};

				keys.forEach(function(key){

					//extract description
					if(meta[key].attribs && meta[key].attribs.name === 'description'){
						defaultDescription = meta[key].attribs.content;
					}

				  if (meta[key].attribs && meta[key].attribs.property) {

				  	if(meta[key].attribs.property === 'og:title'){
				  		metaTag.title = meta[key].attribs.content;
				  	}

				  	if(meta[key].attribs.property === 'og:url'){
				  		metaTag.url = meta[key].attribs.content;
				  	}

				  	if(meta[key].attribs.property === 'og:description'){
				  		metaTag.description = meta[key].attribs.content;
				  	}

				  	if(meta[key].attribs.property === 'og:image'){
				  		metaTag.image = meta[key].attribs.content;
				  	}
				  }
				});

					//Set default title and desc
					if(!metaTag.title && defaultTitle){
						metaTag.title = defaultTitle;
					}
					if(!metaTag.description && defaultDescription){
						metaTag.description = defaultDescription;
					}

				res.status(200).json(metaTag);
			}
		});
	} else {
		res.sendFile(__dirname +'public/index.html');
	}

});

app.listen(process.env.PORT || 3000);
