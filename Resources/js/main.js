var Grabber = {};

Grabber.MAX_ACTIVE_DOWNLOADS = 4;
Grabber.DownloadPath = Titanium.Filesystem.getDesktopDirectory();

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
	
	var intervalId = setInterval(locationChanged, 1000);
	
	Grabber.createDownloadSummaryButton();
	Grabber.createPreferencesButton();
	
};

Grabber.initEventBindings = function() {
	$(document).bind("EPISODE_DETECTED", function(e, data) {
		Grabber.queueEpisodeDialog(data);
	});
	
	$(document).bind("ADD_EPISODE_TO_DOWNLOAD_QUEUE", function(e, episode) {
		Grabber.queueEpisode(episode);
		Grabber.notify(episode.name + " has been queued for download.");
	});	
	
	$(document).bind("DOWNLOAD_STARTED", function(e, episode) {
		Grabber.notify(episode.name + " has started downloading.");
	});
	
	$(document).bind("DOWNLOAD_PROGRESSED", function(e, data) {
		Grabber.updateProgress(data.episode, data.progress);
	});
	
	$(document).bind("DOWNLOAD_COMPLETED", function(e, episode) {
		Grabber.notify(episode.name + " has downloaded.");
		Grabber.setItemCompletedInDownloadList(episode);
	});
	
	$(document).bind("DOWNLOAD_FAILED", function(e, data) {
		alert("sorry, we couldn't grab this programme. " + data.line);
		Grabber.notify(data.episode.name + " has failed to download.");
		Grabber.removeFromDownloadList(data.episode);
	});
	
	$(document).bind("DOWNLOAD_STOPPED", function(e, data) {
		console.log("DOWNLOAD_STOPPED");
	});
	
	$(document).bind("DOWNLOAD_ADDED_TO_QUEUE", function(e, episode) {
		Grabber.createDownloadWidget(episode);
		Grabber.updateDownloadSummary();
		Grabber.flashDownloadSummary();
	});
	
	$(document).bind("DOWNLOAD_REMOVED_FROM_QUEUE", function(e, episode) {
		//Grabber.notify(episode.name + " has downloaded.");
		Grabber.updateDownloadSummary();
	});
	
	$(document).bind("DOWNLOAD_LIST_ITEM_REMOVED", function(e, episode) {
		Grabber.hideDownloadListIfEmpty();
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
	console.log("createDownloadWidget: " + episode.name);

	//var b = $("<button>Add '" + data.name + "' to the download queue?</button>");
	var w = $("<div id=\"dlw-" + episode.pid + "\" class=\"download-widget\"></div>");
	var t = $("<span id=\"dlt-" + episode.pid + "\" class=\"download-title\">" + episode.name + "</span>");
	var p = $("<div id=\"pb-" + episode.pid + "\" class=\"download-progressbar\"></div>");
	var b = $("<div id=\"dlc-" + episode.pid + "\ class=\"download-cancel-button\"></div>");
	//var b = $("<a href=\"#\" class=\"ui-state-default ui-corner-all\"><span class=\"ui-icon ui-icon-close-thick\" id=\"dlb-"+ episode.pid + "\"></span></a>");
	$(t).ellipsis();
	$(p).append(t);
	$(p).progressbar({value: 0});	
	$(b).button({ text: false, icons: {primary:'ui-icon-circle-close'} });
	$(b).height(32);
	$(p).height(32);
	$(w).append(p);
	$(w).append(b);
	//$(w).append(b);
	$("#download-list").append(w);
	$(w).animate({
	    opacity: 'show'
	  }, 1500, 'linear', function() {
	      //  $(this).after('<div>Animation complete.</div>');
	  });
	$(b).click(function () {
		console.log("download cancel button clicked: " + episode.name);
		Grabber.cancelDownload(episode);
		Grabber.removeFromDownloadList(episode);
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
	// only show the list if it contains any elements
	if($("#download-list .download-widget").size() > 0)
	{
		$("#download-list").toggle();
	} else {
		$("#download-list").hide();
	}
};

Grabber.hideDownloadListIfEmpty = function() {
	// only show the list if it contains any elements
	if($("#download-list .download-widget").size() === 0)
	{
		$("#download-list").hide();
	}
};

Grabber.updateDownloadSummary = function() {
	var message = this.downloadQueue.count() === 1 ? 
		this.downloadQueue.count() + " queued download" : 
		this.downloadQueue.count() + " queued downloads";
	$("#download-summary-button").button({label: message});
	
};

Grabber.flashDownloadSummary = function () {
	$("#download-list").show("fast", function() {
		setTimeout('$("#download-list").fadeOut("slow")', 4000);
	});
};

Grabber.setItemCompletedInDownloadList = function(episode) {
	$("#dlt-" + episode.pid).remove();
	$("#pb-" + episode.pid).remove();
	var b = $("<a id='dcb-" + episode.pid + "' href='#' class='download-completed-button'>Add '" + episode.name + "' to the download queue?</a>");
	b.button({label: episode.name + " completed", icons: {secondary: "ui-icon-check"}});
	b.width(190);
	$("#dlw-" + episode.pid).prepend(b);
	$("#dcb-" + episode.pid).click(function () {
		var notepad = Titanium.Process.createProcess({
		        args : ["open", Grabber.DownloadPath]
		    });
		    notepad.launch(); // open the program
	});
};

Grabber.createDownloadSummaryButton = function () {
	var b = $("<a id='download-summary-button' href='#'>active downloads: 0</a>");
	$("#download-summary").append(b);
	$(b).button();
	$(b).width(240);
	$(b).ellipsis();
	$("#download-summary").click(function () {
		Grabber.toggleDownloadList();
	});
};

Grabber.removeFromDownloadList = function (episode) {
	console.log("removeFromDownloadList: " + episode.name);
	$("#dlw-" + episode.pid).remove();
	$(document).trigger('DOWNLOAD_LIST_ITEM_REMOVED', {episode: episode});
};

Grabber.cancelDownload = function (episode) {
	this.downloadQueue.remove(episode);	
};

Grabber.createPreferencesButton = function () {
	var b = $("<button id='preferences-button'>Preferences</button>");
	$(b).button({text: false, icons: {secondary: "ui-icon-gear"}});
	$(b).click(function () {
		$("#preferences-pane").toggle();
	});
	$("#preferences-box").append(b);
};

$(document).ready(function() {
	Grabber.init();
});