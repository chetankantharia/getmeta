var express    = require('express');
var app        = express();
var request    = require('request');
var cheerio    = require('cheerio');
var cors       = require('cors');
var bodyParser = require('body-parser');

app.use(express.static(__dirname + "/public"));

app.options(cors());

//Middleware to handle POST Req.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/v1', function(req, res){
	var URL = req.body && req.body.url;
	
	if(!URL){ res.status(500).json({"error":"no url present"}); }

	/******************************************
	/ If URL Present
	/*****************************************/

		// Check for http(s) protocol if not then prepend
		if(URL.indexOf("http://") === -1 && URL.indexOf("https://") === -1){
			URL = "http://"+URL;
		}

		//Send a HTTP Request to url to fetch html page
		request(URL, function(error, response, body){

			console.log('fetching : ', URL);

			//Error on fetching HTML page 
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

				res.status(200)
					 .json(metaTag);
			}
		})
});

app.listen(process.env.PORT || 3000, function(){
	console.log('Dev server running on PORT : 3000');
});
