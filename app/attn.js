// BUG: noticed that reverse-tabbing out of the notes box into the attn box doesn't trigger the sync or close the notes box - because it's not being clicked on (bind to blur?)
// TO-DO: add loading gif's!
/* TO-DO: load a week's past attn events on getEvents, rather than everything (for the analysis screen); make it possible to 'show more' */

var debug = false,
	log = function() {
		if(window.console && window.console.log && debug) {
			console.log.apply(this,arguments);
		}
	},
	attn = {
		attnEvents: [],
		attnPeriods: [],
		attnEventPending: "AttnEventPending",
		attnEventCreated: "AttnEventCreated",
		attnEventSaved: "AttnEventSaved",
		attnEventSaveError: "AttnEventSaveError",
		now: null,
		timeModErrorSuffix: " is not a valid time",
		bagPrefix: "attn_",
		settings: {},
		isSyncing: false,
		breakTime: function(time) {
			var minutesRegex = /^(-)?(\d+)(?:m|minutes)?$/,
				timeRegex = /(\d{1,2})(?:(?::(\d\d))|(am|pm))/,
				pieces = minutesRegex.exec(time),
				now = attn.now.clone(),
				hour,
				minute,
				minutes,
				second,
				amOrPm;
			if(pieces) {
				minutes = pieces[1] ? -parseInt(pieces[2],10) : parseInt(pieces[2],10);
				minute = now.add(minutes).minutes().getMinutes();
				hour = now.getHours();
				second = now.getSeconds();
			} else {
				pieces = timeRegex.exec(time);
				if(pieces) {
					hour = parseInt(pieces[1],10);
					minute = pieces[2] ? parseInt(pieces[2],10) : 0;
					second = 0;
					amOrPm = pieces[3];
				}
				if(amOrPm) {
					if(hour===12) {
						if(amOrPm==="pm") {
							amOrPm = "am";
						} else if(amOrPm==="am") {
							amOrPm = "pm";
						}
						if(amOrPm==="pm") {
							hour = hour-12;
						}
					}
				}
			}
			if(!pieces) {
				return;
			}
			log('pieces',pieces,hour,minute,second);
			return {
				hour: hour,
				minute: minute,
				second: second
			};
		},
		parseCommand: function(cmd,now) {
			var parsed,
				cmdRegex = /([^ ]+)(?: ([^\d-]+))?(.+)?/,
				matches = cmdRegex.exec($.trim(cmd)),
				project,
				tags,
				time,
				timeMod,
				timePieces,
				theTime,
				theDate,
				i,
				error;
			if(!now) {
				now = new Date();
			} else {
				now = now.clone();
			}
			attn.now = now;
			log(cmd);
			if(matches) {
				log(matches);
				project = matches[1];
				if(matches[2]) {
					tags = $.trim(matches[2]).split(" ");
				}
				if(matches[3]) {
					timeMod = $.trim(matches[3]);
					i = timeMod.indexOf(" ");
					if(i===-1) {
						timePieces = this.breakTime(timeMod);
						if(timePieces) {
							// e.g. "12:35", "12pm" or "-12m"
							time = now.clone().set(timePieces);
						} else {
							error = "'"+timeMod+"'"+attn.timeModErrorSuffix;
						}
					} else {
						// e.g. "12:36 yesterday" or "12:36 14th May"
						theTime = timeMod.substring(0,i);
						theDate = timeMod.substring(i+1);
						time = Date.parse(theDate);
						timePieces = this.breakTime(theTime);
						if(timePieces) {
							time.set(timePieces);
						} else {
							error = "'"+timeMod+"'"+attn.timeModErrorSuffix;
						}
					}
				}
				time = time || now;
				parsed = {
					project: project,
					time: time,
					command: cmd
				};
				if(tags) {
					parsed.tags = tags;
				}
				if(error) {
					parsed.error = error;
				}
			}
			attn.setCurrent(parsed);
			log(parsed);
			return parsed;
		},
		setCurrent: function(parsed) {
			attn.current = parsed;
		},
		getCurrent: function() {
			return attn.current;
		},
		getHelperText: function(parsed) {
			log('gHT',parsed);
			var aHT = null,
				iHT = null,
				tags,
				error,
				time,
				now = attn.now,
				minDiff;
			if(!parsed) {
				iHT = "Type";
			} else {
				tags = parsed.tags;
				error = parsed.error;
				time = parsed.time;
				if(error) {
					iHT = error;
				} else {
					aHT = "Switch to '"+parsed.project+"' ";
					if(time.equals(now)) {
						aHT += "now";
					} else {
						if(time.isBefore(now.clone().add(-60).minutes())) {
							if(time.isBefore(now.clone().clearTime())) {
								aHT += "at "+time.toString();
							} else {
								aHT += "at "+time.toString("HH:mm");
							}
						} else {
							minDiff = Math.ceil(Math.abs(time-now) / (1000*60));
							if(time.isAfter(now)) {
								aHT += minDiff===1 ? "in "+minDiff+" minute" : "in "+minDiff+" minutes";
							} else {
								aHT += minDiff===1 ? minDiff+" minute ago" : minDiff+" minutes ago";
							}
						}
					}
					if(tags) {
						iHT = "tags: '"+tags.join("', ")+"'";
					}
				}				
			}
			return {
				actionHelperText: aHT,
				infoHelperText: iHT
			};
		},
		addNote: function(parsed, note) {
			parsed.note = note;
		},
		saveEvent: function(parsed,host) {
			var tiddler = new TiddlyWeb.Tiddler(parsed.time.getTime().toString()),
				tagsToAdd = ["attn","project:"+parsed.project],
				day = attn.now.toString("yyyyMMdd"),
				bag = attn.bagPrefix+attn.settings.username+"_"+day,
				success = function() {
					attn.isSyncing = false;
					if(!$('#notes').is(':visible') && parsed.project!=="off") {
						$('#notes').show().focus();
					}
					$(document).trigger(attn.attnEventSaved, [tiddler]);
				},
				error = function(xhr,status,errorThrown) {
					var statusCode = parseInt(xhr.status,10), // because in Safari this was coming up as a string
						destBag;
					if(statusCode===409) { // assume there is no bag
						destBag = new TiddlyWeb.Bag(bag, host);
						destBag.put(function() {
							attn.saveEvent(parsed, host);
						}, function() {
							$(document).trigger(attn.attnEventSaveError, [tiddler]);
						});
					} else {
						$(document).trigger(attn.attnEventSaveError, [tiddler]);
					}
				};
			attn.isSyncing = true;
			tiddler.bag = new TiddlyWeb.Bag(bag, host);
			tiddler.text = parsed.note || "";
			tiddler.tags = parsed.tags ? parsed.tags.concat(tagsToAdd) : tagsToAdd;
			tiddler.put(success, error);
		},
		saveNotes: function(elem,host) {
			var current = attn.getCurrent(),
				$notes = $(elem);
			if(current) {
				attn.addNote(current, $notes.val());
				attn.saveEvent(current,host);
			}			
		},
		checkStatus: function(success,error,host) {
			var statusPath = "/status";
			$.ajax({
				url: host ? host+statusPath : statusPath,
				dataType: 'json',
				success: function(data,status,xhr) {
					var username = data.username;
					attn.settings.username = username;
					if(username!=="GUEST") {
						success(data);
					} else {
						error(xhr && xhr.statusText);
					}
				},
				error: error
			});
		},
		login: function(username,password,success,error,host) {
			var loginPath = "/challenge/tiddlywebplugins.tiddlyspace.cookie_form";
			$.ajax({
				url: host ? host+loginPath : loginPath,
				type: 'POST',
				data: {
					user: username,
					password: password
				},
				success: function(data,status,xhr) {
					if(status!==401) {
						attn.checkStatus(success, error, host);
					} else {
						if(error) {
							error(xhr && xhr.statusText);
						}
					}
				},
				error: function(xhr,status,errorThrown) {
					if(error) {
						error(errorThrown);
					}
				}
			});
		},
		getEvents: function(callback,host) {
			var username = attn.settings.username,
				searchString = "/search?q=bag:attn_"+username+"_*%20_limit:999999&fat=1&sort=-title", // silly limit since there is no 'return all' and limit defaults to 20
				url = searchString,
				stripTiddlers = function(tiddlers) {
					tiddlers = tiddlers || [];
					var attnTiddlers = $.grep(tiddlers, function(tiddler) {
						return $.inArray('attn',tiddler.tags)!==-1;
					});
					attn.attnEvents = attnTiddlers;
					callback(attnTiddlers);
				};
			if(!username) {
				return;
			}
			$.ajax({
				url: host ? host+url : url,
				dataType: 'json',
				success: stripTiddlers,
				headers: {
					'X-ControlView': false
				}
			});
		},
		addEvent: function(event) {
			var epoch = parseInt(event.title,10),
				events = attn.attnEvents,
				currEvent,
				title,
				i;
			for(i=0;i<events.length;i++) {
				currEvent = events[i];
				title = parseInt(currEvent.title,10);
				if(epoch>title) {
					events.splice(i,0,event);
					break;
				} else if(epoch===title) {
					events[i]=event;
					break;
				}
			}
		},
		getProject: function(tiddler) {
			var project,
				projectPrefix = "project:";
			if(!tiddler.tags) {
				return;
			}
			$.each(tiddler.tags, function(i, tag) {
				if(tag.indexOf(projectPrefix)===0) {
					project = tag.substring(projectPrefix.length);
					return false;
				}
			});
			return project;
		},
		createPeriods: function(tiddlers, periodCallback) {
			var periods = [],
				period,
				epoch,
				savePeriod = function(p) {
					if(periodCallback) {
						periodCallback.call(p);
					}
					periods.push(p);
					period = null;
				},
				i,
				tid,
				project,
				notes;
			// we are assuming the tiddlers are sorted by date, earliest last
			for(i=tiddlers.length-1;i>=0;i--) {
				tid = tiddlers[i];
				project = attn.getProject(tid);
				epoch = parseInt(tid.title,10);
				notes = tid.text;
				if(project!=='off') {
					if(period) {
						// end the period here and start a new one
						period.end = epoch;
						period.endDate = new Date(epoch);
						period.duration = period.end - period.start;
						savePeriod(period);
						period = {
							start: epoch,
							startDate: new Date(epoch),
							project: project
						};
						if(notes) {
							period.notes = notes;
						}
					} else {
						// start a new period
						period = {
							start: epoch,
							startDate: new Date(epoch),
							project: project
						};
						if(notes) {
							period.notes = notes;
						}
					}
				} else {
					if(period) {
						// end the period here
						period.end = epoch;
						period.endDate = new Date(epoch);
						period.duration = period.end - period.start;
						savePeriod(period);
					} else {
						// two offs in a row, so a period of zero duration
						savePeriod({
							start: epoch,
							startDate: new Date(epoch),
							end: epoch,
							endDate: new Date(epoch),
							duration: 0,
							project: 'off'
						});
					}
				}
			}
			if(period) { // create an unfinished period
				savePeriod(period);
			}
			attn.attnPeriods = periods;
			return periods;
		},
		epochFormat: function(epoch,format) {
			if(typeof epoch !== "number") {
				epoch = parseInt(epoch,10);
			}
			var d = new Date(epoch);
			return d.toString(format);
		},
		formatDuration: function(duration) {
			var hours,
				minutes,
				seconds;
			if(!duration) {
				return {};
			}
			seconds = duration / 1000;
			minutes = seconds / 60;
			hours = Math.floor(minutes / 60);
			minutes = Math.floor(minutes % 60);
			seconds = Math.floor(seconds % 60);
			return {
				hours: hours,
				minutes: minutes,
				seconds: seconds
			};
		},
		daysFromPeriods: function(periods,format) {
			var days = [],
				day,
				periodDay;
			format = format || "ddMMyyyy";
			if(!periods || periods.length===0) {
				return [];
			}
			$.each(periods, function(i, period) {
				periodDay = period.startDate.toString(format);
				if(!day) {
					day = {
						date: periodDay,
						periods: []
					};
				}
				if(day.date===periodDay) {
					day.periods.push(period);
				} else {
					days.push(day);
					day = {
						date: periodDay,
						periods: [period]
					};
				}
			});
			days.push(day);
			return days;
		}
	};
	
$.fn.attn = function() {
	var $commandLine = $(this);
	$commandLine.click(function(e) {
		var clickState = true;
		if(attn.isSyncing) {
			$(this).blur();
			$(document).one("AttnEventSaved", function() {
				attn.isSyncing = false;
				if(clickState) {
					$commandLine.focus().click();
				}
			}).one("click", function(e) {
				if(!$(e.target).is($commandLine)) {
					clickState = false;
				}
			});
			e.stopPropagation(); // to stop document click handler being triggered immediately
		} else {
			$('#notes').hide()
				.val("");
			$(this).select();
		}
	}).keyup(function(e) {
		var event = attn.parseCommand($commandLine.val());
		if(event && !event.error) {
			event.title = event.time.getTime();
			if(e.keyCode===13) {
				$(document).trigger(attn.attnEventCreated, event);
			} else {
				$(document).trigger(attn.attnEventPending, event);
			}
		} else {
			$(document).trigger(attn.attnEventPending);
		}
	});
	return this;
};

if(document.location.protocol.indexOf("file")!==-1) {
	if(window.Components && window.netscape && window.netscape.security) {
		var tmpAjax = $.ajax;
		$.ajax = function() {
			window.netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
			tmpAjax.apply(this,arguments);
		};
	}
}
