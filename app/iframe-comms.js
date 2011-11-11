var origHost = window.location.host,
	dotIndex = origHost.lastIndexOf('.'),
	prevDotIndex = origHost.lastIndexOf('.',dotIndex-1),
	domain = origHost.substring(prevDotIndex!==-1 ? prevDotIndex+1 : 0),
	host = window.location.protocol+"//"+domain;
$(document).ready(function() {
	if(window.location.protocol.indexOf('http')!==-1) {
		document.domain = domain;
		window.iframeComms = $('<iframe src="'+host+'/bags/attn_public/tiddlers/iframe-comms"></iframe>')
			.appendTo('body')
			.get(0)
			.contentWindow;
	}
});