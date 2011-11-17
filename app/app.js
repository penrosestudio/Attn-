/* TO-DO: don't use the iframe-comms2 thing if it's running off a local file */

var command,
	error,
	updateAction = function(text) {
		$('#actionText').text(text || "");
	},
	updateInfo = function(text) {
		$('#infoText').text(text || "");
	},
	origHost = window.location.host,
	dotIndex = origHost.lastIndexOf('.'),
	prevDotIndex = origHost.lastIndexOf('.',dotIndex-1),
	domain = origHost.substring(prevDotIndex!==-1 ? prevDotIndex+1 : 0),
	host = window.location.protocol+"//tiddlyspace.com",
	hostIfLocal,
	viewportWidth = $(window).width(),
	viewportHeight = $(window).height(),
	toggleButtons = function() {
		var currentLeft = parseInt($('#wrapper').css('left'),10),
			frame = -(currentLeft / viewportWidth);
		$('button').each(function() {
			if($(this).text()==="left") {
				if(frame===0) {
					$(this).hide();
				} else {
					$(this).show();
				}
			} else {
				if(frame===3) {
					$(this).hide();
				} else {
					$(this).show();
				}
			}
		});
	},
	load;
if(document.location.protocol.indexOf("file") === 0) {
	host = "http://tiddlyspace.com";
	hostIfLocal = host;
}
	

$(document).bind("AttnEventPending", function(e, attnEvent) {
	var helperText = attn.getHelperText(attnEvent);
	updateAction(helperText.actionHelperText);
	updateInfo(helperText.infoHelperText);
});

$(document).bind("AttnEventCreated", function(e, attnEvent) {
	updateAction();
	updateInfo("attn event created! saving...");
	attn.saveEvent(attnEvent,host);
});

$(document).bind("AttnEventSaved", function(e, attnEvent) {
	updateAction();
	updateInfo("attn event saved!");
	attn.addEvent(attnEvent);
	updateAnalysis(attn.attnEvents);
});

$(document).bind("AttnEventSaveError", function(e, attnEvent) {
	updateAction();
	updateInfo("oh oh! error saving");
});

function filterPeriods(periodsList,filterString) {
	var $periodsList = $(periodsList),
		$periods = $periodsList.find('ul').children('li').show(),
		selector;
	if(!$periods) {
		return;
	}
	if (!filterString) {
		return;
	}
	filterString = filterString.toLowerCase();
	if (filterString.indexOf("notes:")===0) {
		selector = ".notes";
		filterString = filterString.substring(6);
		if (filterString.indexOf('"')===0 && filterString.lastIndexOf('"')===filterString.length-1) {
			filterString = filterString.substring(1, filterString.length-1);	
		}
	} else {
		selector = ".project";
	}
	
	$.each( $periods, function(i, period) {
		var $period = $(period),
			$toTest = $period.find(selector);
		if (!$toTest.length || $toTest.text().toLowerCase().indexOf(filterString)===-1) {
			$period.hide();
		}
	});
}

function updateTotalDuration() {
	var duration = attn.formatDuration(totalDuration('#attnlist')*1000),
		durationArray = [];
	durationArray.push(duration.hours || "0");
	durationArray.push(duration.minutes || "00");
	$('#totalSeconds span').html(durationArray.join(':'));
}

$('#filterString').keyup(function() {
	window.setTimeout(function() {
		filterPeriods('#attnlist', $('#filterString').val());
		updateTotalDuration();
	}, 500);
});

function clearFilterString() {
	var e = $.Event("keyup");
	e.keyCode = 13;
	$('#filterString').val("")
		.trigger(e);
}

// JB - these click functions don't have tests because they're purely beta, we should animate this just slightly better
function totalDuration(periodsList) {

	var seconds = 0,
		$periodsList = $(periodsList),
		$periods = $periodsList.find('ul').children('li:visible');
	$periods.each(function(i, period) {
		addSeconds = $(period).find('.duration').data('duration');
		seconds += addSeconds;
	});
	return seconds;
}



function updateAnalysis(events) {
	var i,
		attnday_templ = tmpl("attnday_templ"),
		html = "",
		periods = attn.createPeriods(events, function() {
			var duration = attn.formatDuration(this.duration),
				hours = duration.hours,
				minutes = duration.minutes,
				seconds = duration.seconds,
				durBits = [];
			this.starttime = this.startDate.toString("h:mmtt").toLowerCase();
			if(this.endDate) {
				this.endtime = this.endDate.toString("h:mmtt").toLowerCase();
			}
			if(hours) {
				durBits.push(hours);
			} else {
				durBits.push("0");
			}
			if(minutes) {
				if(seconds && seconds>30) {
					minutes += 1;
				}
				durBits.push(minutes);
			} else {
				durBits.push("00");
			}
			/*if(seconds) {
				durBits.push(seconds);
			}*/
			this.durationString = durBits.join(":");
		}),
		days = attn.daysFromPeriods(periods,"dd.MM.yyyy");
	for(i=days.length-1;i>=0;i--) {
		html += attnday_templ(days[i]);
	}
	if(!html) {
		html = "<li>you don't have any events</li>";
	}
	$('#attnlist').html(html);
	clearFilterString();
}

function init() {
	attn.getEvents(function(tiddlers) {
		updateAnalysis(tiddlers);
		
	}, host);
	$('#attn').attn().keyup();
}

$(document).ready(function() {

	var notesTimeout;

	window.load = function() {
		attn.checkStatus(function(data) {
			var username = data.username;
			$('#accountID').text(username);
			//$('#loginForm').submit(function(e) {
			//	return false;
			//});
			$('#wrapper').css('left',-viewportWidth);
			toggleButtons();
			$('.screen').show();
			init();
		}, function() {
			$('#accountID').text('Not logged in');
			$('#loginForm').submit(function(e) {
				var loginID = $('#loginID').val(),
					password = $('#password').val();
				e.preventDefault();
				try {
					attn.login(loginID,password,function() {
						$('#loginError').hide();
						$('#accountID').text(attn.settings.username);
						init();
						$('#wrapper').animate({
							'left': -viewportWidth
						});
					},function() {
						$('#loginError').show();
					}, hostIfLocal);
				} catch(ex) {
					log(ex);
				}
				return false;
			});
			toggleButtons();
			$('.screen').show();
		}, hostIfLocal);
	};
	
	// make all four divs the width of the viewport	
	$('.screen').width(viewportWidth);
	$('#analysis').height(viewportHeight-20);
	$('#teamanalysis').height(viewportHeight-20); // JB - added so the screen appears for testing
	
	$('#attn').val("");
	$('#notes').hide().text("");
	
	$('button').click(function() {
		var direction = $(this).text()==="left" ? "+=" : "-=";
		$('#wrapper:not(animated)').animate({
			'left': direction+viewportWidth
		}, toggleButtons);
		return false;
	});
	
	// trigger a save if notes are typed and there is a pause of two seconds
	$('#notes').live("keyup", function() {
		var noteBox = this;
		this.prevNote = this.note || "";
		this.note = $(this).val();
		if(!notesTimeout) {
			notesTimeout = window.setTimeout(function() {
				attn.saveNotes(noteBox,host);
			}, 2000);
		}		
	}).live("keydown", function() {
		if(notesTimeout) {
			notesTimeout = window.clearTimeout(notesTimeout);
		}
	}).live("blur", function() {
		if(notesTimeout) {
			notesTimeout = window.clearTimeout(notesTimeout);
		}
		if(this.note!==this.prevNote) {
			attn.saveNotes(this, host);
		}
	});
	
	$('a.edit').live("click", function(e) {
		e.preventDefault();
		$(this).parent().addClass('editing');
	});
	
	$('a.cancel').live("click", function(e) {
		e.preventDefault();
		$(this).parent().removeClass('editing');
	});
	
	/* this is only needed with iframe-comms.js, not iframe-comms2.js
	if(!hostIfLocal) {
		document.domain = domain;
	}
	*/
	
	if(!window.testing_mode) {
		// we're waiting for the iframe-comms to catch up
		if(!hostIfLocal) {
			$(document).bind('crossDomainAjaxLoaded', load);
		} else {
			load();
		}
	}
});