var Grabber = {};

Grabber.MaxActiveDownloads = 4;
Grabber.DownloadPath = Titanium.Filesystem.getDesktopDirectory().toString(); //--download-path=PATH
Grabber.CreateTitleSubDir = false; //--title-subdir
Grabber.DownloadSubtitles = false; //--subtitles
Grabber.HTTPProxy = ""; //--http-proxy=HOST:PORT
Grabber.DeleteCancelledDownloads = false;
Grabber.EnableNotifications = true;

Grabber.RubyPath;

Grabber.init = function() {	
	
	Grabber.showLoadingDialog();
	
	if(!Grabber.setRubyPath()) {
		$("#main-container").hide();
		alert("Ruby was not found on your system! Ruby is a essential for 'Grabber to work" +
			"\n Most likely you don't have it installed\n Please download and install Ruby." + 
			"\n If you have Ruby installed then plase make sure it is in your path"
		);
	}
	
	this.downloadQueue = new DownloadQueue();
	
	Grabber.initAppUpdates();	
	Grabber.loadPreferences();	
	Grabber.initEventBindings();
		
	var that = this;
	this.iframeLocation = "";		
	this.iframe = document.getElementById("my-iframe");
	this.iframe.src = "http://bbc.co.uk/iplayer";
	
	$("#bottom-panel").width($("#my-iframe").width()-88);
	
	$("#my-iframe").height($(document).height() - ($("#bottom-panel").height() + 10));

	$(that.iframe.contentDocument).ready(function() {
		that.iframeLocation = that.iframe.contentDocument.location.href;
	});
		
	$(window).resize(function () {
		$("#my-iframe").height($(document).height() - ($("#bottom-panel").height() + 10));
		$("#bottom-panel").width($("#my-iframe").width()-88);
	});	
	
	var locationChanged = function() {
		if(that.iframe.contentDocument.location.href !== that.iframeLocation) {
			$("#bottom-panel .download-button").remove();
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
	$(document).bind("EPISODE_DETECTED", function(e, episode) {
		$(document).bind("CHECK_COMPLETED", function(e, data) {
			if(data.result && (data.result.indexOf(".mp3") !== -1 || data.result.indexOf(".mp4") !== -1)) {
				console.log("data.result " + data.result);
				episode.name = data.result;
				Grabber.queueEpisodeDialog(episode);
			} else if (data.result) {
				alert(data.result);			
			} else {
				Grabber.episodeNotAvailableMessage(episode);
			}
		});
		Grabber.checkEpisode(episode);
		
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
		Grabber.updateDownloadSummary();
	});
	
	$(document).bind("DOWNLOAD_FAILED", function(e, data) {
		Grabber.notify(data.episode.name + " has failed to download.");
		alert("sorry, we couldn't grab this programme. " + data.line);	
		// often when a download fails a zero kb file is created, so this will tidy it up
		// we don't want to delete files greater than zero kb as they could possibly be resumed	
		Grabber.deleteEpisodeFileIfZeroKb(data.episode);		
		//handle these with the DOWNLOAD_LIST_ITEM_REMOVED event
		//Grabber.removeFromDownloadList(data.episode);
		//Grabber.updateDownloadSummary();
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
		Grabber.removeFromDownloadList(episode);
		Grabber.updateDownloadSummary();
	});
	
	$(document).bind("DOWNLOAD_LIST_ITEM_REMOVED", function(e, episode) {
		Grabber.hideDownloadListIfEmpty();
	});
};

Grabber.checkEpisode = function(episode) {
	var options = {
		DownloadPath: Grabber.DownloadPath, 
		CreateTitleSubDir: Grabber.CreateTitleSubDir, 
		DownloadSubtitles: Grabber.DownloadSubtitles,
		HTTPProxy: Grabber.HTTPProxy
	};
	var d = new Downloader(episode, options);
	d.check();
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
	$(".download-button").remove();
	var b = $("<a id='download-button-" + episode.pid + "' href='#' class='download-button'>Add '" + episode.name + "' to the download queue?</a>");
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

Grabber.episodeNotAvailableMessage = function(episode) {
	var b = $("<a id='download-button' href='#' class='download-button'>Sorry, '" + episode.name + "' is not available for download.</a>");
	$(b).button({ icons: {primary:'ui-icon-alert'} });
	$("#bottom-panel").append(b);
	$(b).animate({
	    opacity: 'show'
	  }, 1500, 'linear', function() {
	      //  $(this).after('<div>Animation complete.</div>');
	  });
	
	$(b).click(function() {
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
	$(b).width(32);
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
	console.info("downloaded " + progress + "% of " + episode.name);
	$("#pb-" + episode.pid).progressbar({value: progress});
};

Grabber.notify = function(message) {
	if(!Grabber.EnableNotifications) {
		return;
	}
	// notifications break the app on windows
	if(Titanium.platform !== "osx") {
		return;
	}
	
	if(!this.notifier) {
		this.notifier = Titanium.Notification.createNotification($(document));
		var iconPath = Titanium.Filesystem.getResourcesDirectory() + "iplayer-dl/share/pixmaps/iplayer-dl/icon128.png".replace(/\//gi, Titanium.Filesystem.getSeparator());
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
	console.log("updateDownloadSummary");
	console.log(Titanium.JSON.stringify(Grabber.downloadQueue));
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
	if(Grabber.DeleteCancelledDownloads) {
		Grabber.deleteEpisodeFile(episode);
	}
};

Grabber.deleteEpisodeFile = function (episode) {
	var file = Titanium.Filesystem.getFile(Grabber.DownloadPath, episode.name);
	if(file.exists()) {
		var success = file.deleteFile();
		console.log("Deleting file '" + episode.name + "' " + success.toString());
	}
};

Grabber.deleteEpisodeFileIfZeroKb = function (episode) {
	console.log("deleteIfZeroKb called");
	var file = Titanium.Filesystem.getFile(Grabber.DownloadPath, episode.name);
	if(file.exists() && file.size() === 0) {
		var success = file.deleteFile();
		console.log("Deleting file '" + episode.name + "' " + success.toString());
	}
};

Grabber.createPreferencesButton = function () {
	var b = $("<button id='preferences-button'>Preferences</button>");
	$(b).button({text: false, icons: {secondary: "ui-icon-gear"}});
	$(b).click(function () {
		$("#preferences-pane").toggle();
	});
	$("#preferences-box").append(b);
	Grabber.initPreferencesPane();
};

Grabber.initPreferencesPane = function () {
	//max-downloads
	//download-path-button
	//save-button
	//title-subdir-checkbox
	//proxy-text
	//subtitles-checkbox
	console.log(Grabber.DownloadPath);
	$("#download-path-button").button({text: true, icons: {primary: "ui-icon-folder-open"}});
	$("#download-path-button").click(function () {
		var props = {multiple:false,directories:true,files:false};
		Titanium.UI.currentWindow.openFolderChooserDialog(function(f)
		{
			if (f.length)
			{
				console.log(f[0]);
				Grabber.DownloadPath = f[0].toString();
				$("#download-path").html(Grabber.DownloadPath);
			}
		}, props);
	});	
	
	$("#save-preferences-button").button({text: true, icons: {primary: "ui-icon-disk"}}); //ui-icon-disk ui-icon-video
	$("#save-preferences-button").click(function () {
		Grabber.savePreferences();
		$("#preferences-pane").toggle();
	});
	/*
	$("#preferences-pane").filter(":checkbox,:radio").checkbox();
	$("#subtitles-checkbox").checkbox();*/
};

Grabber.loadPreferences = function () {
	
	//max-downloads
	//download-path-button
	//save-button
	//title-subdir-checkbox
	//proxy-text
	//subtitles-checkbox
	
	var prefs = $.jStorage.get("preferences", null);
	console.log(Titanium.JSON.stringify(prefs));
	if(prefs) {
		Grabber.MaxActiveDownloads = prefs.MaxActiveDownloads;
		Grabber.DownloadPath = prefs.DownloadPath;
		Grabber.CreateTitleSubDir = prefs.CreateTitleSubDir;
		Grabber.DownloadSubtitles = prefs.DownloadSubtitles;
		Grabber.HTTPProxy = prefs.HTTPProxy;
		Grabber.DeleteCancelledDownloads = prefs.DeleteCancelledDownloads;
		Grabber.EnableNotifications = prefs.EnableNotifications;
	} else {
	 	//if there are no prefs then assume this is the first run so show the preferences panel
		$("#preferences-pane").toggle();
	}
	
	$("#max-downloads").val(Grabber.MaxActiveDownloads);
	$("#download-path").html(Grabber.DownloadPath);
	$("#title-subdir-checkbox").attr("checked", Grabber.CreateTitleSubDir);
	$("#subtitles-checkbox").attr("checked", Grabber.DownloadSubtitles);
	$("#proxy-text").val(Grabber.HTTPProxy);
	$("#delete-cancelled-checkbox").attr("checked", Grabber.DeleteCancelledDownloads);
	$("#notifications-checkbox").attr("checked", Grabber.EnableNotifications);
	
	if(Grabber.HTTPProxy.length > 0) {		
		Titanium.Network.setHTTPProxy(Grabber.HTTPProxy);
		HTTP_PROXY = Grabber.HTTPProxy;
		console.log("loadPreferences: setting HTTP Proxy");
	}
	
};

Grabber.savePreferences = function () {
	Grabber.MaxActiveDownloads = $("#max-downloads").val();
	Grabber.DownloadPath = $("#download-path").html();
	Grabber.CreateTitleSubDir = $("#title-subdir-checkbox").attr("checked");
	Grabber.DownloadSubtitles = $("#subtitles-checkbox").attr("checked");
	Grabber.HTTPProxy = $("#proxy-text").val();
	Grabber.DeleteCancelledDownloads = $("#delete-cancelled-checkbox").attr("checked");
	Grabber.EnableNotifications = $("#notifications-checkbox").attr("checked");
	
	var prefs = {};
	prefs.MaxActiveDownloads = Grabber.MaxActiveDownloads;
	prefs.DownloadPath = Grabber.DownloadPath;
	prefs.CreateTitleSubDir = Grabber.CreateTitleSubDir;
	prefs.DownloadSubtitles = Grabber.DownloadSubtitles;
	prefs.HTTPProxy = Grabber.HTTPProxy;
	prefs.DeleteCancelledDownloads = Grabber.DeleteCancelledDownloads;
	prefs.EnableNotifications = Grabber.EnableNotifications;
	
	$.jStorage.set("preferences", prefs);
	
	if(Grabber.HTTPProxy.length > 0) {
		Titanium.Network.setHTTPProxy(Grabber.HTTPProxy);
		console.log("savePreferences: setting HTTP Proxy");
	}
	
};

Grabber.setRubyPath = function () {
	var s = Titanium.platform == "win32" ? ";" : ":";
	console.log(s);
	var environment = Titanium.API.getEnvironment();
	//alert(Titanium.JSON.stringify(environment));
	var path = environment['PATH'];
	if(path === undefined ) {
		path = environment['Path'];
	}
	if(path === undefined ) {
		path = environment['[path]'];
	}
    if (path === undefined) {
		alert("no PATH variable defined in environment");
		return false;
    }
	//alert(Titanium.JSON.stringify(environment));
	var p = path.toString().split(s);
	var ruby = Titanium.platform == "win32" ? "ruby.exe" : "ruby";
	for (var i=0; i < p.length; i++) {
		console.log(p[i]);
		var r = Titanium.Filesystem.getFile(p[i], ruby);
		if(r.exists()) {
			Grabber.RubyPath = p[i];
			return true;
		}
		
	}
	return false;
};

Grabber.initAppUpdates = function () {
	
	//
	// Register for Titanium Developer Updates
	//
	/*
	Titanium.UpdateManager.onupdate = function(details)	{
		var conf = confirm('New iPlayer Grabber available (version ' + details.version + '). Do you want to download it?');
		if(conf) {
			Grabber.notify('Installing new version...');
			Titanium.UpdateManager.installAppUpdate(details, function () {
				alert("Update complete, enjoy!");
			});
		}
	};
	*/
	//
	// Register SDK Update listeners
	//
	/*
	Titanium.UpdateManager.startMonitor([Titanium.API.APP_UPDATE], function(details) {
		alert(Titanium.JSON.stringify(details));
	});*/
};


Grabber.updateCheck = function (component,version,callback,limit)
{
	try
	{
		if (!Titanium.Network.online)
		{
			return;
		}
		limit = (limit==undefined) ? 1 : limit;
		var url = Titanium.App.getStreamURL("release-list");
		console.log(url);
		var xhr = Titanium.Network.createHTTPClient();
		xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		var qs = 'version='+Titanium.Network.encodeURIComponent(version)+'&name='+Titanium.Network.encodeURIComponent(component)+'&mid='+Titanium.Network.encodeURIComponent(Titanium.Platform.id)+'&limit='+limit+'&guid='+Titanium.Network.encodeURIComponent(Titanium.App.getGUID());
		console.log(qs);
		xhr.onreadystatechange = function()
		{
			if (this.readyState==4)
			{
				try
				{
					var json = window.Titanium.JSON.parse(this.responseText);
					if (!json.success)
					{
						console.error("Error response from update service: "+json.message);
						callback(false);
						return;
					}
					if (json.releases.length > 0)
					{
						// we might have an update
						// compare our version with the 
						// remote version
						var update = limit == 1 ? json.releases[0] : json.releases;
						callback(true,update);
					}
					else
					{
						callback(false);
					}
				}
				catch(e)
				{
					console.error("Exception communicating to update service: "+e);
					callback(false);
				}
			}
		};
		xhr.open('POST',url,true);
		xhr.send(qs);
	}
	catch(e)
	{
		console.error("Error performing update check = "+e);
		callback(false);
	}
};

Grabber.showLoadingDialog = function () {
	var d = $('<div></div>');	
	d.html("Connecting to iPlayer...");	
	d.dialog({ autoOpen: false, 
			modal: true,
			open: function(event, ui) { 
			setTimeout(function() {
				d.remove();
			}, 3000);
		} });
	d.dialog("open");	
};

$(document).ready(function() {
		// 
		// Grabber.updateCheck("app_update", "0.1.0", function(success,details)
		// {
		// 	alert(success);
		// 	alert(Titanium.JSON.stringify(details));
		// });
	
	Grabber.init();
});