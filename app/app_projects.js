/* Attn! Team project graphs

v0.1 - assume just one project

Jonathan Lister - jonathan@withjandj.com
October 20, 2012

*/

var host = window.location.protocol+"//tiddlyspace.com",
	load = function() {
		attn.checkStatus(function(data) {
			init();
		}, function() {
			alert('you are not logged in, go login to TiddlySpace and come back');
		});
	},
	settings = {
		team: [], // for the list of team members
		earliestDate: null, // the earliest we'll go back
		projects: [] // structure: { id: 0, name: "", checkpoint: Date, target: 0 }
	},
	getTeamList = function() { // TO-DO: make not hard-coded
		return ['joshuwar', 'jnthnlstr', 'csugden', 'dannysturgess'];
	},
	getProjects = function(callback,host,username) {
		// TO-DO
		return true;
		var searchString = "/search?q=bag:attn_"+username+"_*%20_limit:999999&sort=-title", // silly limit since there is no 'return all' and limit defaults to 20
			url = searchString,
			stripTiddlers = function(tiddlers) {
				tiddlers = tiddlers || [];
				var attnTiddlers = $.grep(tiddlers, function(tiddler) {
						return $.inArray('attn',tiddler.tags)!==-1;
					}),
					periods = attn.createPeriods(attnTiddlers);
				settings.projects = createProjectsFromPeriods();
				attn.attnEvents = attnTiddlers;
				callback();
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
	updateGraphs = function() {
		// update each graph with the percentage to the target the team has logged since the cutoff date
		var projects = settings.projects;
		$.each(projects, function(i, project) {
			var id = project.id,
				target = project.target, // seconds
				duration = project.duration,
				prettyDuration = prettifyDuration(duration),
				prettyTarget = prettifyTarget(target),
				proportion = duration / target,
				percentage = Math.round(proportion*100),
				$project = $('#project_'+id),
				$graph = $project.find('.project_graph'),
				$bar = $graph.children('span'),
				$graphLabel = $project.find('.grap_label'),
				graphWidth = $graph.width(),
				width = Math.round(proportion*graphWidth)+'px';
			$bar.width(width);
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
		var projects = [];
		$('input').each(function(i, elem) {
			var $elem = $(elem),
				key = $elem.attr('name'),
				value = $elem.val(),
				id = key[key.length-1];
			if(!key) {
				return;
			}
			if(!projects[id]) {
				projects[id] = {};
			}
			projects[id][key] = value;
		});
		settings.projects = projects;
	},
	readURLParams = function() { // TO-DO: include team list
		var params = window.location.hash.split('&');
		if(!params) {
			return;
		}
		$.each(params, function(i, param) {
			var bits = param.split('='),
				key = bits[0],
				value = decodeURIComponent(bits[1]);
			$('#'+key).val(value);
		});
		rebuildProjectObjectFromInputs();
	},
	setURLParams = function() { // TO-DO: include team list
		var list = [];
		$.each(settings.projects, function(i, project) {
			var id = project.id;
			list.push('project_name_'+id+'='+encodeURIComponent(project.name));
			list.push('project_target_'+id+'='+encodeURIComponent(project.target));
			list.push('project_date_'+id+'='+encodeURIComponent(project.date));
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
				updateGraphs();
			}, host, username);
		});
	};

$(document).ready(function() {
	readURLParams();
	// we're waiting for the iframe-comms to catch up
	$(document).bind('crossDomainAjaxLoaded', load);
});