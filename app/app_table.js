var host = window.location.protocol+"//tiddlyspace.com",
	load = function() {
		attn.checkStatus(function(data) {
			init();
		}, function() {
			alert('you are not logged in, go login to TiddlySpace and come back');
		});
	},
	projects = [],
	people = {},
	getEvents = function(callback,host,username) {
		var searchString = "/search?q=bag:attn_"+username+"_*%20_limit:999999&sort=-title", // silly limit since there is no 'return all' and limit defaults to 20
			url = searchString,
			stripTiddlers = function(tiddlers) {
				tiddlers = tiddlers || [];
				var attnTiddlers = $.grep(tiddlers, function(tiddler) {
					return $.inArray('attn',tiddler.tags)!==-1;
				});
				attn.attnEvents = attnTiddlers;
				callback(attn.createPeriods(attnTiddlers));
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
	updatePeople = function(periods, username) {
		var person = people[username] = {};
		$.each(periods, function(i, period) {
			var project = period.project.toLowerCase(),
				duration = period.duration;
			if(!person[project]) {
				person[project] = 0;
			}
			person[project] += duration;
			if($.inArray(project,projects)===-1) {
				projects.push(project);
			}
		});
	},
	updateTimeSpan = function(periods, then, now) {
		$.each(periods, function(i, period)) {
			// if project.startTime etc.
		}
	},
	prettifyDuration = function(duration) {
		var durationObj = attn.formatDuration(duration),
			hours = durationObj.hours,
			minutes = durationObj.minutes,
			seconds = durationObj.seconds,
			durBits = [];
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
		return durBits.join(":");
	},
	redrawTable = function() {
		var html = "";
		html += "<tr> \
			<th></th>";
		projects = projects.sort();
		$.each(projects, function(i, name) {
			html += "<th>"+name+"</th>";
		});
		html += "</tr>";
		$.each(people, function(name, theirProjects) {
			html += "<tr> \
				<td>"+name+"</td>";
			$(projects).each(function(i, name) {
				html += "<td>"+prettifyDuration(theirProjects[name])+"</td>";
			});
			html += "</tr>";
		});
		if(!html) {
			html = "<p>nothing to show</p>";
		}
		$('table').html(html);
	},
	init = function() {
		var username = attn.settings.username;
		$('table').html('loading projects for '+username);
		getEvents(function(periods) {
			updatePeople(periods, username);
			redrawTable();
		}, host, username);
	};

$(document).ready(function() {	
	// we're waiting for the iframe-comms to catch up
	$(document).bind('crossDomainAjaxLoaded', load);
	$('button').click(function() {
		if(this.name==="person") {
			var username = $(this).val();
			getEvents(function(periods) {
				updatePeople(periods, username);
				redrawTable();
			}, host, username);
		} else if(this.name==="timeSpan") {
			var then = Date.parse('last Monday'),
				now = then.add(7).days();
			updateTimeSpan(periods,then,now);
			redrawTable();
		}
	});
});