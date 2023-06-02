#
# Regular cron jobs for the pinenote-gnome-extension package.
#
0 4	* * *	root	[ -x /usr/bin/pinenote-gnome-extension_maintenance ] && /usr/bin/pinenote-gnome-extension_maintenance
