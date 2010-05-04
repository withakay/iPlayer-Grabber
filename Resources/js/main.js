var Grabber = {};

Grabber.MAX_ACTIVE_DOWNLOADS = 4;

Grabber.init = function() {	
	
	this.downloadQueue = new DownloadQueue();
	this.initEventBindings();
	
	var that = this;
	this.iframeLocation = "";		
	this.iframe = document.getElementById("my-iframe");
	
	$("#my-iframe").height($(document).height() - $("#bottom-panel").height());

	$(that.iframe.contentDocument).ready(function() {
		that.iframeLocation = that.iframe.contentDocument.location.href;
	});
		
	$(window).resize(function () {
		$("#my-iframe").height($(document).height() - $("#bottom-panel").height());
	});	
	
	var locationChanged = function() {
		if(that.iframe.contentDocument.location.href !== that.iframeLocation) {
			$("#bottom-panel #download-button").remove();
			that.iframeLocation = that.iframe.contentDocument.location.href;
			if(that.iframeLocation.indexOf("episode") > -1) {
				//alert("displaying an episode: " + that.iframeLocation);
				var parts = that.iframeLocation.split("/");
				for (var i=0; i < parts.length; i++) {
					if(parts[i] === "episode") {
						$(document).trigger('EPISODE_DETECTED', {pid: parts[i+1], name: parts[i+2].replace(/_/gi, " ")});						
						break;
					}
				}
			}
		}
	};
	
	var intervalId = setInterval(locationChanged, 2000);
	
	$("#download-summary").click(function () {
		Grabber.toggleDownloadList();
	});
	
};

Grabber.initEventBindings = function() {
	$(document).bind("EPISODE_DETECTED", function(e, data) {
		Grabber.queueEpisodeDialog(data);
	});
	
	$(document).bind("ADD_EPISODE_TO_DOWNLOAD_QUEUE", function(e, episode) {
		Grabber.queueEpisode(episode);
		Grabber.notify(episode.name + "has been queued for download.");
	});	
	
	$(document).bind("DOWNLOAD_STARTED", function(e, episode) {
		Grabber.notify(episode.name + "has started downloading.");
	});
	
	$(document).bind("DOWNLOAD_PROGRESSED", function(e, data) {
		Grabber.updateProgress(data.episode, data.progress);
	});
	
	$(document).bind("DOWNLOAD_COMPLETED", function(e, episode) {
		Grabber.notify(episode.name + "has downloaded.");
	});
	
	$(document).bind("DOWNLOAD_FAILED", function(e, data) {
		alert("sorry, we couldn't grab this programme. " + data.line);
		Grabber.notify(episode.name + "has failed to download.");
	});
	
	$(document).bind("DOWNLOAD_ADDED_TO_QUEUE", function(e, episode) {
		Grabber.createDownloadWidget(episode);
		Grabber.updateDownloadSummary();
	});
	
	$(document).bind("DOWNLOAD_REMOVED_FROM_QUEUE", function(e, episode) {
		Grabber.notify(episode.name + "has downloaded.");
		Grabber.updateDownloadSummary();
	});
};


Grabber.queueEpisode = function(episode) {
	if(Grabber.downloadQueue.add(episode)) {
		console.log("added " + episode.name);
	} else {
		console.log("could not add " + episode.name);
	}
	
};

// show a dialog asking the user if they want to download the detected episode
Grabber.queueEpisodeDialog = function(episode) {
	//var b = $("<button>Add '" + data.name + "' to the download queue?</button>");
	var b = $("<a id='download-button' href='#'>Add '" + episode.name + "' to the download queue?</a>");
	$(b).button({ icons: {primary:'ui-icon-triangle-1-s'} });
	$("#bottom-panel").append(b);
	$(b).animate({
	    opacity: 'show'
	  }, 1500, 'linear', function() {
	      //  $(this).after('<div>Animation complete.</div>');
	  });
	
	$(b).click(function() {
		Grabber.queueEpisode(episode);
		b.remove();
	});
};

Grabber.createDownloadWidget = function(episode) {
	
	//var b = $("<button>Add '" + data.name + "' to the download queue?</button>");
	var w = $("<div id=\"dlw-" + episode.pid + "\" class=\"download-widget\"></div>");
	var t = $("<span id=\"dlt-" + episode.pid + "\" class=\"download-title\">" + episode.name + "</span>");
	var p = $("<div id=\"pb-" + episode.pid + "\"></div>");
	//var b = $("<a href=\"#\" class=\"ui-state-default ui-corner-all\"><span class=\"ui-icon ui-icon-close-thick\" id=\"dlb-"+ episode.pid + "\"></span></a>");
	$(p).append(t);
	$(p).progressbar({value: 0});
	$(w).append(p);
	//$(w).append(b);
	$("#download-list").append(w);
	$(w).animate({
	    opacity: 'show'
	  }, 1500, 'linear', function() {
	      //  $(this).after('<div>Animation complete.</div>');
	  });
	
};

Grabber.updateProgress = function(episode, progress) {
	//console.info("downloaded " + progress + "% of " + episode.name);
	$("#pb-" + episode.pid).progressbar({value: progress});
};

Grabber.notify = function(message) {
	if(!this.notifier) {
		this.notifier = Titanium.Notification.createNotification($(document));
		//var s = Titanium.Filesystem.getSeparator();
		var iconPath = Titanium.Filesystem.getResourcesDirectory() + "iplayer-dl/share/pixmaps/iplayer-dl/icon128.png";
		this.notifier.setIcon(iconPath);
	}
	this.notifier.setMessage(message);
	this.notifier.show();
};

Grabber.toggleDownloadList = function() {
	$("#download-list").toggle();
};

Grabber.updateDownloadSummary = function() {
	var message = this.downloadQueue.count() > 1 ? 
		this.downloadQueue.count() + " queued downloads" : 
		this.downloadQueue.count() + " queued download";
	$("#download-summary").text(message);
};

$(document).ready(function() {
	Grabber.init();
});