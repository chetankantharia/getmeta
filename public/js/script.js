var BUSY;
var postBox = document.getElementById('postbox'); 

//Add event to postbox
if (typeof postBox.addEventListener != "undefined") {
    postBox.addEventListener("keyup", function(evt) {
    		var url = getURL(this);
    		if(url && url.length > 0){
        	getMeta(url[0]);
    		}
    }, false);
} else if (typeof postBox.attachEvent != "undefined") {
		//incase you support IE8
    postBox.attachEvent("onkeyup", function(evt) {
        var url = getURL(this);
    		if(url && url.length > 0){
        	getMeta(url[0]);
    		}
    });
}

/* Regex */
function getURL(e){
	var urlRegex = /\b(http|https)?(:\/\/)?(\S*)\.(\w{2,4})(\S*)\b/ig;
	var regexValue = e.value.match(urlRegex);
		if(regexValue === null){
			showMetaInfo(null);
		}
	return regexValue;
}

/* Get Meta */
var previousURL;
function getMeta(url){

	//If BUSY is false and url is not same as previous one
	if(!BUSY && previousURL !== url){
		previousURL = url;
		BUSY = true;
		var apiEndpoint = "http://localhost:3000/v1";
		  
      var XHR = $.post(apiEndpoint, {"url":url});

          XHR.done(function(data){
            showMetaInfo(data);
          })
          .fail(function(xhr){
            console.log("Error while fetching meta info", xhr);
            showMetaInfo(null);
          })
          .always(function(){
            BUSY = false;
          })
		}
}


/* Display meta info in div tag */
function showMetaInfo(meta){
	BUSY = false;
	if(meta !== null){
		var image = meta.image ? "<div class='meta-image-container'><img class='meta-image' src=" + meta.image +"></div>" : "";
		var title = meta.title ? "<b>" + meta.title + "</b>" : "";
		var description = meta.description ? "<div>" + meta.description + "</div>" : "";
    var content = "<div class='meta-content-container'>" + title + description + "</div>";
    var template = image + content;

		$('#metabox')[0].innerHTML = template;
	} else {
		$('#metabox')[0].innerHTML = "";
	}
}