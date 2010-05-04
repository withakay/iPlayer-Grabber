//constructor
function DownloadQueue(){
	this.init();
};

DownloadQueue.prototype.init = function() {
	var that = this;
	this.q = [];
	this.isDownloading = false;
		
	$(document).bind("DOWNLOAD_STARTED", function(e, episode) {
		that.isDownloading = true;
	});
	
	$(document).bind("DOWNLOAD_COMPLETED", function(e, episode) {
		that.isDownloading = false;
		if(that.remove(episode)) {
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
	for (var i=0; i < this.q.length; i++) {
		if(this.q[i].pid === episode.pid) {
			// all ready in the queue so return false 
			return false;
		}
	}	
	this.q.push(episode);
	if(this.isDownloading === false) {
		this.downloadNext();
	}
	$(document).trigger("DOWNLOAD_ADDED_TO_QUEUE", episode);
	return true;
};

DownloadQueue.prototype.remove = function(episode) {
	for (var i=0; i < this.q.length; i++) {
		if(this.q[i].pid === episode.pid) {
			// remove 
			this.q.splice(i, 1);
			return true;
		}
	}
	$(document).trigger("DOWNLOAD_REMOVED_FROM_QUEUE", episode);
	return false;
};

DownloadQueue.prototype.downloadNext = function() {
	var d = new Downloader(this.q[0]);
	d.start();
};
