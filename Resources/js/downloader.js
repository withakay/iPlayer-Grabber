/*

https://developer.appcelerator.com/apidoc/desktop/1.0/Titanium.Process-module

*/

function Downloader(episode) {
	this.episode = episode;
	this.progress = 0;
	this.line = "";
	this.isDownloading = false;
	this.process;
	
};

Downloader.prototype.start = function() {	
	console.info(Titanium.JSON.stringify(this.episode));
	var that = this;
	var path_to_iplayer = Titanium.Filesystem.getResourcesDirectory() + "/iplayer-dl/bin/iplayer-dl";
	
	var iplayer_script = Titanium.Filesystem.getFile(path_to_iplayer);

    if (iplayer_script.exists()) {
        console.log(iplayer_script + ' exists');
    } else {
		console.error(iplayer_script + ' DOES NOT exist');
        alert("error iplayer-dl script does not exist!");
    }
	
	var my_args = [
		"/usr/bin/ruby", 
		"-I" + Titanium.Filesystem.getResourcesDirectory() + "/iplayer-dl/lib", 
		path_to_iplayer, 
		this.episode.pid, 
		"--download-path=" + Titanium.Filesystem.getDesktopDirectory()
	];
		
	this.process = Titanium.Process.createProcess({
		args: my_args
    });

	console.info(this.process.toString());

	this.process.setOnReadLine(function(data) {
		that.line = data.toString();
		//console.info(Titanium.JSON.stringify(that.episode));
	    //console.info("downloaded " + data.toString() + " of " + that.episode.name);
		that.progress = parseInt(data.toString(), "10");
		if(that.progress) {
			$(document).trigger('DOWNLOAD_PROGRESSED', {episode: that.episode, progress: that.progress});
		}
	});
	/*	
	my_process.setOnRead(function(data) {
	        alert(data.toString());
	    });
	*/
	this.process.setOnExit(function(data) {
        console.log("process exited with " + data.toString());
		that.isDownloading = false;
		if(that.progress === 100) {
			$(document).trigger('DOWNLOAD_COMPLETED', that.episode, that.progress);
		} else {
			$(document).trigger('DOWNLOAD_FAILED', {episode: that.episode, line: that.line});
		}
	});
		
	this.process.launch();	
	that.isDownloading = true;
	
	$(document).trigger('DOWNLOAD_STARTED', that.episode);	
};

Downloader.prototype.stop = function() {
	this.process.kill();
};