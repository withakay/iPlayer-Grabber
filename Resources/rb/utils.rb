# we want the script in editable folder for testing
def get_iplayer_path
    path    =  Titanium.App.home
    go_back =  path.split('/').member?('dist') ? "../" * 4 : ''
    path    =  File.join(path, go_back, 'Resources', 'iplayer-dl')
    File.expand_path(path)
end

def call_to_script pid
	  script_file = 'bin/iplayer-dl ' + pid
  	script_name  = "'" +  File.join(get_iplayer_path, script_file) + "'"
  	cmd = 'ruby -Ilib ' + script_name.to_s
  	ans = (`#{cmd.to_s}`)
  	alert(cmd)
end

#window.call_to_script = call_to_script