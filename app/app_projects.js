/* Attn! Team project graphs

v0.1 - assume just one project

Main TO-DOs:
- support the last billed field

Jonathan Lister - jonathan@withjandj.com
October 20, 2012

*/

if(!('console' in window)) {
	console = {
		log: function() {}
	};
}

var host = window.location.protocol+"//tiddlyspace.com",
	load = function() {
		attn.checkStatus(function(data) {
			$('#username').text('You are logged in as '+attn.settings.username);
			init();
		}, function() {
			alert('you are not logged in, go login to TiddlySpace and come back');
		});
	},
	colors = ['red', 'blue', 'green', 'yellow', 'black', 'orange'],
	settings = {
		team: [], // for the list of team members
		earliestDate: null, // the earliest we'll go back
		projects: [], // structure: { name: "", checkpoint: Date, target: 0 }
		projectsByName: {}, // projects array indexed by name
		projectDurations: {} // structure: name: { <username>: 0, total: 0 }
	},
	getTeamList = function() { // TO-DO: make not hard-coded
		return ['joshuwar', 'jnthnlstr', 'csugden', 'dannysturgess'];
	},
	getProjects = function(finalCallback) {
		var teamCount = settings.team.length,
			count = 0,
			stripTiddlers = function(tiddlers, username) {
				tiddlers = tiddlers || [];
				var attnTiddlers = $.grep(tiddlers, function(tiddler) {
						return $.inArray('attn',tiddler.tags)!==-1;
					}),
					periods = attn.createPeriods(attnTiddlers);
				attn.attnEvents = attnTiddlers;
				createProjectsFromPeriods(periods, username);
				if(count>=teamCount) {
					finalCallback();
				}
			};
		settings.projectDurations = {};
		$.each(settings.team, function(i, username) {
			// TO-DO: use earliestDate to limit search
			var searchString = "/search?q=bag:attn_"+username+"_*%20_limit:1000&sort=-title", // silly limit since there is no 'return all' and limit defaults to 20; we're using 1000 as we only want to look about two months back
				url = searchString;
			$.ajax({
				url: host+url,
				dataType: 'json',
				success: function(tiddlers) {
					console.log('retrieved tiddlers for '+username);
					count++;
					stripTiddlers(tiddlers, username);
				},
				headers: {
					'X-ControlView': false
				}
			});
		});
	},
	createProjectsFromPeriods = function(periods, username) {
		var projectDurations = settings.projectDurations,
			projectsByName = settings.projectsByName,
			total;
		$.each(periods, function(i, period) {
			var project = period.project.toLowerCase(),
				duration = period.duration,
				startDate = period.startDate,
				projectConfig = projectsByName[project],
				checkpointDate;
			// discard this period if it is not one of the ones we are looking for
			// or if it starts too late
			if(!projectConfig) {
				return true;
			}
			checkpointDate = projectConfig.date;
			if(checkpointDate) {
				checkpointDate = Date.parse(checkpointDate);
				if(startDate < checkpointDate) {
					return true;
				}
			}
			if(!projectDurations[project]) {
				projectDurations[project] = {};
			}
			if(!projectDurations[project][username]) {
				projectDurations[project][username] = 0;
			}
			projectDurations[project][username] += duration;
			if(!projectDurations[project].total) {
				projectDurations[project].total = 0;
			}
			projectDurations[project].total += duration;
		});
	},
	updateGraphs = function() {
		// update each graph with the percentage to the target the team has logged since the cutoff date
		var projects = settings.projects,
			projectDurations = settings.projectDurations;
		$.each(projects, function(i, project) {
			var target = project.target, // milliseconds
				name = project.name,
				durations = projectDurations[name],
				duration = durations.total,
				prettyDuration = prettifyDuration(duration),
				prettyTarget = prettifyDuration(target),
				proportion = duration / target,
				percentage = Math.round(proportion*100),
				$project = $('#project_'+i),
				$graph = $project.find('.project_graph'),
				$bar = $graph.children('span'),
				$graphLabel = $project.find('.graph_label'),
				graphWidth = $graph.width(),
				width = Math.round(proportion*graphWidth)+'px';
			$bar.css('backgroundColor', colors[i])
				.width(width);
			$graphLabel.text(prettyDuration+' / '+prettyTarget+' ('+percentage+'%)');
		});
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
	rebuildProjectObjectFromInputs = function() {
		// refresh the object tracking the project configuration, by looking at the HTML
		var projects = [],
			projectsByName = {};
		$('input').each(function(i, elem) {
			var $elem = $(elem),
				key = $elem.attr('name'),
				value = $elem.val(),
				id = key[key.length-1];
			key = key.split('_')[1]; // e.g. project_name_1 -> name
			if(!key) {
				return;
			}
			if(key==='target') {
				// convert hours to milliseconds
				value = value * 60 * 60 * 1000;
			}
			if(!projects[id]) {
				projects[id] = {};
			}
			projects[id][key] = value;
		});
		settings.projects = projects;
		$.each(projects, function(i, project) {
			var name = project.name;
			if(!projectsByName[name]) {
				projectsByName[name] = project;
			}
		});
		settings.projectsByName = projectsByName;
	},
	createProjectElement = function(i) {
		var id = 'project_'+i;
		return '<div class="project" id="'+id+'"> \
			<label for="project_name_'+i+'">name</label> \
			<input name="project_name_'+i+'" id="project_name_'+i+'"> \
			<label for="project_target_'+i+'">target (hours)</label> \
			<input name="project_target_'+i+'" id="project_target_'+i+'"> \
			<label for="project_date_'+i+'">last billed</label> \
			<input name="project_date_'+i+'" id="project_date_'+i+'"> \
			<span class="project_graph"> \
				<span></span> \
			</span> \
			<span class="graph_label"></span> \
		</div>';
	},
	readURLParams = function() { // TO-DO: include team list
		// read the project configuration from the URL hash, create and populate the HTML for those projects
		var params = window.location.hash.slice(1).split('&');
		if(!params) {
			return;
		}
		$.each(params, function(i, param) {
			var bits = param.split('='),
				key = bits[0],
				value = decodeURIComponent(bits[1]),
				id = key[key.length-1];
			if(!$('#project_'+id).length) {
				var html = createProjectElement(id);
				$('#projects').append(html);
			}
			$('#'+key).val(value);
		});
	},
	setURLParams = function() { // TO-DO: include team list
		var list = [];
		$.each(settings.projects, function(i, project) {
			var target = project.target;
			target = target / 1000 / 60 / 60; // convert from milliseconds to hours
			list.push('project_name_'+i+'='+encodeURIComponent(project.name));
			list.push('project_target_'+i+'='+encodeURIComponent(target));
			list.push('project_date_'+i+'='+encodeURIComponent(project.date));
		});
		window.location.hash = list.join('&');
	},
	init = function() {
		settings.team = getTeamList();
		settings.earliestDate = (2).months().ago(); // TO-DO: make this the earliest of the checkpoint dates
		$('button').click(function() {
			var username = attn.settings.username;
			rebuildProjectObjectFromInputs();
			setURLParams();
			getProjects(function() { // TO-DO: allow new sets of projects to be analysed without making another search request (unless the earliestDate has changed)
				console.log('project analysis finished');
				console.log(settings.projectDurations);
				updateGraphs();
			});
		});
	};

$(document).ready(function() {
	readURLParams();
	rebuildProjectObjectFromInputs();
	if(settings.projects.length>1) {
		$('button').text($('button').text().replace('project', 'projects'));
	}
	// we're waiting for the iframe-comms to catch up
	$(document).bind('crossDomainAjaxLoaded', load);
});