//constructor
function DownloadQueue(){
	this.init();
};

DownloadQueue.prototype.init = function() {
	var that = this;
	this.queue = [];
	this.activeDownloads = [];
	
	this.downloaders = [];
		
	$(document).bind("DOWNLOAD_STARTED", function(e, episode) {
		
	});
	
	
	$(document).bind("DOWNLOAD_COMPLETED", function(e, episode) {
		console.log("DownloadQueue.DOWNLOAD_COMPLETED");
		that.remove(episode);
	});
	
	/*
	$(document).bind("DOWNLOAD_STOPPED", function(e, episode) {
		console.log("DownloadQueue.DOWNLOAD_STOPPED");
		that.remove(episode);
	});
	*/
	
	$(document).bind("DOWNLOAD_REMOVED_FROM_QUEUE", function(e, episode) {
		console.log("DownloadQueue.DOWNLOAD_REMOVED_FROM_QUEUE");
		if(that.activeCount() < Grabber.MaxActiveDownloads && that.count() > 0) {
			that.downloadNext();
		}		
	});
	
	$(document).bind("DOWNLOAD_FAILED", function(e, data) {
		that.remove(data.episode);
		that.isDownloading = false;
	});
};

DownloadQueue.prototype.add = function(episode) {
	console.log("DownloadQueue.add called for " + episode.name);
	// check the item is not already added
	for (var i=0; i < this.queue.length; i++) {
		if(this.queue[i].pid === episode.pid) {
			// all ready in the queue so return false 
			return false;
		}
	}	
	this.queue.push(episode);
	if(this.activeCount() < Grabber.MaxActiveDownloads) {
		this.downloadNext();
	}
	$(document).trigger("DOWNLOAD_ADDED_TO_QUEUE", episode);
	return true;
};

DownloadQueue.prototype.remove = function(episode) {
	console.log("DownloadQueue.remove");
	var ret1 = true;
	for (var i=0; i < this.queue.length; i++) {
		console.log(Titanium.JSON.stringify(this.queue[i]));
		console.log(Titanium.JSON.stringify(episode));
		if(this.queue[i].pid === episode.pid) {
			// remove 
			this.queue.splice(i, 1);
			ret = true;
			break;
		}
	}
	for (i=0; i < this.activeDownloads.length; i++) {
		if(this.activeDownloads[i].pid === episode.pid) {
			// remove 
			this.activeDownloads.splice(i, 1);
			break;
		}
	}
	for (i=0; i < this.downloaders.length; i++) {
		if(this.downloaders[i].episode.pid === episode.pid) {
			// remove 
			this.downloaders[i].stop();
			this.downloaders.splice(i, 1);
			break;
		}
	}
	
	console.log(ret1);
	
	if(ret1) {
		$(document).trigger("DOWNLOAD_REMOVED_FROM_QUEUE", episode);
		return true;
	}
	
	return false;
};

DownloadQueue.prototype.downloadNext = function() {
	
	console.log("this.activeDownloads.length: " + this.activeCount());
	console.log("Grabber.MaxActiveDownloads: "  + Grabber.MaxActiveDownloads);

	var options = {
		DownloadPath: Grabber.DownloadPath, 
		CreateTitleSubDir: Grabber.CreateTitleSubDir, 
		DownloadSubtitles: Grabber.DownloadSubtitles,
		HTTPProxy: Grabber.HTTPProxy
	};
	
	console.log(Titanium.JSON.stringify(this.queue[this.activeDownloads.length]));	
	this.activeDownloads.push(this.queue[this.activeDownloads.length]);
	var episode = this.queue[this.activeDownloads.length-1];
	var d = new Downloader(episode, options);
	this.downloaders.push(d);
	d.start();
};

DownloadQueue.prototype.count = function() {
	return this.queue.length;
};

DownloadQueue.prototype.activeCount = function() {
	return this.activeDownloads.length;
};

DownloadQueue.prototype.inactiveCount = function() {
	return this.queue.length - this.activeDownloads.length;
};