//constructor
function DownloadQueue(){
	this.init();
};

DownloadQueue.prototype.init = function() {
	var that = this;
	this.queue = [];
	this.activeDownloads = [];
	this.isDownloading = false;
		
	$(document).bind("DOWNLOAD_STARTED", function(e, episode) {
		that.isDownloading = true;
	});
	
	$(document).bind("DOWNLOAD_COMPLETED", function(e, episode) {
		that.isDownloading = false;
		if(that.remove(episode) && this.count() < Grabber.MAX_ACTIVE_DOWNLOADS) {
			that.downloadNext();
		}		
	});
	
	$(document).bind("DOWNLOAD_FAILED", function(e, episode, line) {
		that.remove(episode);
		that.isDownloading = false;
	});
};

DownloadQueue.prototype.add = function(episode) {
	// check the item is not already added
	for (var i=0; i < this.queue.length; i++) {
		if(this.queue[i].pid === episode.pid) {
			// all ready in the queue so return false 
			return false;
		}
	}	
	this.queue.push(episode);
	if(this.isDownloading === false || this.count() < Grabber.MAX_ACTIVE_DOWNLOADS) {
		this.downloadNext();
	}
	$(document).trigger("DOWNLOAD_ADDED_TO_QUEUE", episode);
	return true;
};

DownloadQueue.prototype.remove = function(episode) {
	var ret1 = false;
	for (var i=0; i < this.queue.length; i++) {
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
	
	if(ret1) {
		return true;
	}
	
	$(document).trigger("DOWNLOAD_REMOVED_FROM_QUEUE", episode);
	return false;
};

DownloadQueue.prototype.downloadNext = function() {
	console.log(Titanium.JSON.stringify(this.queue[this.activeDownloads.length]));	
	this.activeDownloads.push(this.queue[this.activeDownloads.length]);
	var episode = this.queue[this.activeDownloads.length-1];
	var d = new Downloader(episode);
	d.start();
};

DownloadQueue.prototype.count = function() {
	return this.queue.length;
};
