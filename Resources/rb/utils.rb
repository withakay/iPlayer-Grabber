# we want the script in editable folder for testing
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