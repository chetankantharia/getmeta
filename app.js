var express    = require('express');
var app        = express();
var request    = require('request');
var cheerio    = require('cheerio');
var cors       = require('cors');
var bodyParser = require('body-parser');

/*
	Helper functions
*/
var getMeta = {
	getResponseHeader : function(response, key){
		return response.headers && response.headers[key];
	},

	getContentType : function(response){
		return this.getResponseHeader(response, 'content-type')
	},

	isContentTypeValid : function(response, type){
		/* Hash Map of all the valid patterns */
		var patterns = {
			'html' : 'text\/html'
		}

		var checkContentType = new RegExp(patterns[type]);
		return checkContentType.test(this.getContentType(response))
	},

	getMetaTag : function(body, URL){
		var $ = cheerio.load(body);

		var title = $('title');
		var meta  = $('meta');
		var keys  = Object.keys(meta);

		//Init default title and description
		var defaultTitle = title[0] && title[0].children[0] && title[0].children[0].data;
		var defaultDescription;
		var defaultUrl = defaultTitle && URL;

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
		  		//check http or https prefix for image url
		  		var checkPrefix = new RegExp('http|https');
		  		if(checkPrefix.test(meta[key].attribs.content)){
		  			metaTag.image = meta[key].attribs.content;
		  			console.log('Image', metaTag.image);
		  		} else {
		  			metaTag.image = DOMAIN + meta[key].attribs.content;
		  			console.log('Image', metaTag.image);
		  		}
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
		if(!metaTag.url && defaultUrl){
			metaTag.url = defaultUrl;
		}
		
		return metaTag;
	}

};


app.use(express.static(__dirname + "/public"));

app.options(cors());

//Middleware to handle POST Req.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/v1', function(req, res){
	var URL = req.body && req.body.url;
	var DOMAIN;
	var contentIsHTML = undefined;
	
	if(!URL){ res.status(500).json({"error":"no url present"}); }

	/******************************************
	/ If URL Present
	/*****************************************/

		// Check for http(s) protocol if not then prepend
		if(URL.indexOf("http://") === -1 && URL.indexOf("https://") === -1){
			URL = "http://"+URL;
		}

		//Set DOMAIN - get hostname from url
		var matchDomain = URL.match(/^https?\:\/\/([^\/?#]+)/i);
		DOMAIN = matchDomain && matchDomain[0];


		//Send a HTTP Request to url to fetch html page
		request(URL, function(error, response, body){

			/* Check for error */
			if(error){
				res.status(500).json({
					status : 500,
					error : "Error occured while fetching url",
					url : URL
				});
			} else {

				var contentIsHTML = getMeta.isContentTypeValid(response, 'html');

				if(contentIsHTML && body){
					
					/* Cheerio Starts Here */
					var metaTag = getMeta.getMetaTag(body, URL);

					res.status(200)
						.json(metaTag);
				} else {
					console.log('Content is not HTML');
					res.status(500).json({
						status : 500,
						error : "Error content is not html",
						url : URL
					});
				}
			}
		})
});

app.listen(process.env.PORT || 3000, function(){
	console.log('Dev server running on PORT : 3000');
});
