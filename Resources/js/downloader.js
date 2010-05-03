Downloader {};

Downloader.prototype.download = function(pid) {
	// Reading the output of a process using the read event.
	// Win32 needs to run echo and more via cmd.exe
	var path_to_iplayer = Titanium.Filesystem.getResourcesDirectory() + "/iplayer-dl/bin/iplayer-dl";
	
	var iplayer_script = Titanium.Filesystem.getFile(path_to_iplayer);

    if (iplayer_script.exists()) {
        //alert('exists');
    } else {
        alert("error iplayer-dl script does not exist!");
    }
	
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