/*

https://developer.appcelerator.com/apidoc/desktop/1.0/Titanium.Process-module

*/

function Downloader(_episode, _options) {
	this.options = _options;
	this.episode = _episode;
	this.progress = 0;
	this.line = "";
	this.isDownloading = false;
	this.stopRequested = false;
	this.process;
	this.path_to_iplayer = Titanium.Filesystem.getResourcesDirectory() + "/iplayer-dl/bin/iplayer-dl".replace(/\//gi, Titanium.Filesystem.getSeparator());
	
	// check the iplayer-dl script exists where we think it should be...
	var iplayer_script = Titanium.Filesystem.getFile(this.path_to_iplayer);
	    if (iplayer_script.exists()) {
        console.log(iplayer_script + ' exists');
    } else {
		console.error(iplayer_script + ' DOES NOT exist');
        alert("error iplayer-dl script does not exist!");
    }

	// basic arguments that will always be required
	
	//alert(Titanium.Platform.name);
	
	//default ruby path on OS X
	this.rubyPath = Grabber.RubyPath;
	
	this.args = [
		"ruby", 
		"-I" + Titanium.Filesystem.getResourcesDirectory() + "/iplayer-dl/lib".replace(/\//gi, Titanium.Filesystem.getSeparator()), 
		this.path_to_iplayer, 
		this.episode.pid
	];
};

Downloader.prototype.check = function() {
	var that = this;
	
	// push the 'dry run' argument'	
	var args = this.setupArgs();
	args.push("-n");	
		
	var checkProcess = Titanium.Process.createProcess({
		args: args, 
		env: {"PATH": this.rubyPath}
    });

	console.info(checkProcess.toString());
	var out = "";
	checkProcess.setOnReadLine(function(data) {
		console.info(Titanium.JSON.stringify(data));
		if(data) {
	    	out += data.toString();
		}
	});
	checkProcess.setOnExit(function(data) {
        console.log("process exited with " + data.toString());	
		$(document).trigger('CHECK_COMPLETED', {episode: that.episode, result: out});
	});
		
	checkProcess.launch();
};

Downloader.prototype.setupArgs = function () {
	//copy all the items out to a new array so additions in the method don't polute the whole object
	var args = this.args.slice();
	
	args.push("--download-path=" + this.options.DownloadPath);
	
	if(this.options.CreateTitleSubDir) {
		args.push("--title-subdir");
	}
	if(this.options.DownloadSubtitles) {
		args.push("--subtitles");
	}
	if(this.options.HTTPProxy.length > 0) {
		args.push("--http-proxy=" + this.options.HTTPProxy);
	}
	
	return args;
};

Downloader.prototype.start = function() {
	var that = this;		
	var args = this.setupArgs();	
		
	this.process = Titanium.Process.createProcess({
		args: args
    });

	console.info(this.process.toString());

	this.process.setOnReadLine(function(data) {
		that.line = data.toString();
		// console.log(Titanium.JSON.stringify(data));
		if(data.toString().indexOf("%") !== -1) {
			var p = parseInt(data.toString(), "10");
			// console.log(Titanium.JSON.stringify(p));
			that.progress = p;
			// console.log(Titanium.JSON.stringify(that.progress));
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
		if(that.stopRequested === true) {
			$(document).trigger('DOWNLOAD_STOPPED', {episode: this.episode});
		} else if(that.progress === 100) {
			$(document).trigger('DOWNLOAD_COMPLETED', that.episode, that.progress);
		} else {
			console.log("DOWNLOAD_FAILED: progress==" + that.progress);
			$(document).trigger('DOWNLOAD_FAILED', {episode: that.episode, line: that.line});
		}
	});
		
	this.process.launch();	
	that.isDownloading = true;
	
	$(document).trigger('DOWNLOAD_STARTED', that.episode);	
};

Downloader.prototype.stop = function() {
	this.stopRequested = true;
	
	this.process.kill();
};

// Downloader.getEnvPath = function() { 
// 	//var p = Titanium.Platform.name;
// 	var args = ["/bin/ls"];
// 	/*
// 	if(Titanium.Platform == "win32") {
// 		args = ["C:\\Windows\\System32\\cmd.exe", "echo %PATH%"];
// 	}*/
// 	
// 	//args.push("echo_me_please");
// 	var process = Titanium.Process.createProcess({
// 		args: args
//     });
// 
// 	alert(process.toString());
// 	var out = "";
// 	process.setOnReadLine(function(data) {
// 		console.info(Titanium.JSON.stringify(data));
// 	    out += data.toString();
// 	});
// 	
// 	process.setOnRead(function(data) {
//     });
// 	
// 	process.setOnExit(function(data) {
//         console.log("process exited with " + data.toString());	
// 		alert("out: " + out);
// 		$(document).trigger('GET_PATH_COMPLETED', out);
// 	});
// 		
// 	process.launch();
// 	
// };
