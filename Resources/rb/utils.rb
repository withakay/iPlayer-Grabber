# we want the script in editable folder for testing
def get_iplayer_path
    path    =  Titanium.App.home
    go_back =  path.split('/').member?('dist') ? "../" * 4 : ''
    path    =  File.join(path, go_back, 'Resources', 'iplayer-dl', 'bin', 'iplayer-dl')
    File.expand_path(path)
end

def call_iplayerdl pid
	  #cmd = "/Users/jack/Code/appcelerator/iPlayer-Grabber/dist/osx/iPlayer Grabber v2.app/Contents/Resources/iplayer-dl/bin/iplayer-dl b00s9c9g -n"
	  alert get_iplayer_path
		cmd = get_iplayer_path
		cmd = cmd + " " + pid
		alert cmd
		IO.popen cmd do |io|
		  # or, if you have to do something with the output
		  io.each do |line|
		    alert line
		  end
		end
end

def get_path(platform)
    #cmd = "/Users/jack/Code/appcelerator/iPlayer-Grabber/dist/osx/iPlayer Grabber v2.app/Contents/Resources/iplayer-dl/bin/iplayer-dl b00s9c9g -n"
	  if platform == "win32"
	    cmd = "C:\\Windows\\System32\\cmd.exe /C echo %PATH%"
	  else
	    cmd = "echo $PATH"
	  end
	  path = IO.popen cmd
		path.readlines
end

#window.call_to_script = call_to_script