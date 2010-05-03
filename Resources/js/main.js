var Grabber = {};
var Ti = {fs: Titanium.Filesystem};

Grabber.init = function()
{
	var that = this;
	this.resourceDir = Ti.fs.getResourcesDirectory();
	this.iframeLocation = "";		
	this.iframe = document.getElementById("my-iframe");

	$(that.iframe.contentDocument).ready(function() {
		that.iframeLocation = that.iframe.contentDocument.location.href;
	});
	
	$('#button').click(function() {
		alert(that.iframe.contentDocument.location.href);
	});
		
	var locationChanged = function() {
		if(that.iframe.contentDocument.location.href !== that.iframeLocation) {
			that.iframeLocation = that.iframe.contentDocument.location.href;
			if(that.iframeLocation.indexOf("episode") > -1) {
				alert("displaying an episode: " + that.iframeLocation);
				var parts = that.iframeLocation.split("/");
				for (var i=0; i < parts.length; i++) {
					if(parts[i] === "episode") {
						//window.call_to_script(parts[i+1]);
						alert("episode: " + parts[i+1] );
						break;
					}
				}
			}
		}
	};
	
	var intervalId = setInterval(locationChanged, 2000);
};

var execProcess = function() {
	// Reading the output of a process using the read event.
	// Win32 needs to run echo and more via cmd.exe
	var path_to_iplayer = Titanium.Filesystem.getResourcesDirectory() + "/iplayer-dl/bin/iplayer-dl";
	
	var iplayer_script = Titanium.Filesystem.getFile(path_to_iplayer);

    if (iplayer_script.exists()) {
        //alert('exists');
    } else {
        iplayer_script.write("does not exist");
    }
	
	
	var pid = "b008h368";
	//"cd '" + Titanium.Filesystem.getResourcesDirectory() + "/iplayer-dl'", 
	var my_args = ["/usr/bin/ruby", "-I"+Titanium.Filesystem.getResourcesDirectory()+"/iplayer-dl/lib", path_to_iplayer, pid, "--download-path=" + Titanium.Filesystem.getDesktopDirectory()];
	//var my_args = ["ruby -Ilib ", "'" + path_to_iplayer + "'", pid];
	//var my_args = ["/bin/ls", "-la"];
	//var my_args = ["/usr/bin/ruby", "-v"];
	
	alert(my_args.join(" "));

	//alert(Titanium.Filesystem.getResourcesDirectory());
	
	
	var my_process = Titanium.Process.createProcess({
	        args: my_args
	    });

	alert(my_process.toString());
	alert(my_process.getEnvironment());

	my_process.setOnReadLine(function(data) {
	        alert(data.toString());
	    });
	/*	
	my_process.setOnRead(function(data) {
	        alert(data.toString());
	    });
	*/
	my_process.setOnExit(function(data) {
	        alert("exited");
	    });
	/*
	my_process.addEventListener(Titanium.READ, function(event)
	{
	    // event.data will be a Bytes object with the output data.
	    alert(event.data.toString());
	});*/
		
	my_process.launch();
	
};

$(document).ready(function()
{
	Grabber.init();
	execProcess();
});