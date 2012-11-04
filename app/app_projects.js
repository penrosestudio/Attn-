/* Attn! Team project graphs

v0.2 - supports multiple projects and the checkpoint dates
v0.1 - assume just one project

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
	updateSummaryTable = function() {
		var projects = settings.projects,
			projectDurations = settings.projectDurations,
			projectHtml = [];
		$.each(projects, function(i, project) {
			var name = project.name;
			projectHtml.push('<h3>'+name+'</h3><ul>');
			$.each(settings.team, function(i, person) {
				var total = projectDurations[name][person];
				projectHtml.push('<li>'+person+': '+prettifyDuration(total)+'</li>');
			});
			projectHtml.push('</ul>');
		});
		$('#summaryTable').append(projectHtml.join('\n'));
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
	makeSunburstJSON = function() {
		/*
		"name": "all",
		"children": [{
			"name": "bpsf",
			"children": [{
				"name": "jnthnlstr",
				"children": [{
					"size": 8
				}, {
					"size": 4
				}]
			},	{
				"name": "jshbrdly", "size": 4
			}, {
				"name": "chrssgden", "size": 6
			}, {
				"name": "dnnystrgss", "size": 2
			}]
		}, {
			"name": "cdla",
			"children": [{
				"name": "jshbrdly", "size": 8
			}, {
				"name": "chrssgden", "size": 20
			}, {
				"name": "dnnystrgss", "size": 12
			}]
		}
		*/
		var json = {
				"name": "all",
				"children": []
			},
			ps = json.children,
			projectDurations = settings.projectDurations,
			timeDivisor = 1000 * 60 * 60; // to convert from ms to hours
		$.each(settings.projectsByName, function(name, project) {
			project = projectDurations[name];
			ps.push({
				"name": name,
				"children": $.map(project, function(personTotal, person) {
					return {
						"name": person,
						"size": total/timeDivisor
					};
				});
			});
		});
		return json;
	},
	drawSunburst = function() {
		var width = 400,
		    height = 400,
		    radius = Math.min(width, height) / 2,
		    p = 5, // label padding
		    duration = 750, // animation duration in ms
		    json = makeSunburstJSON(),
		    x = d3.scale.linear()
			    .range([0, 2 * Math.PI]),
			y = d3.scale.linear()
			    .range([0, radius]),
			color = d3.scale.category20c(),
			vis = d3.select("#sunburst").append("svg")
			    .attr("width", width)
			    .attr("height", height)
					.append("g")
				    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"),
			partition = d3.layout.partition()
			    .value(function(d) { return d.size; }),
			arc = d3.svg.arc()
			    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
			    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
			    .innerRadius(function(d) { return Math.max(0, y(d.y)); })
			    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); }),
			nodes = partition.nodes(json),
			path = vis.selectAll("path").data(nodes)
				.enter().append("path")
				.attr("d", arc)
				.style("fill", function(d) { return d.depth ? color((d.children ? d : d.parent).name) : "#FFF"; })
					.on("click", click),
			text = vis.selectAll("text").data(nodes),
			textEnter = text.enter().append("text")
				.style("fill-opacity", function(d) {
					return 2/(d.depth+1);
				})
				.style("font-size", function(d) {
					return 2/(d.depth+1)+"em";
				})
				.style("fill", function(d) {
					return brightness(color((d.children ? d : d.parent).name)) < 125 ? "#eee" : "#000";
				})
				.attr("text-anchor", function(d) {
					return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
				})
				.attr("dy", ".2em")
				.attr("transform", function(d) {
					var multiline = (d.name || "").split(" ").length > 1,
					angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
					rotate = angle + (multiline ? -.5 : 0);
					return "rotate(" + rotate + ")translate(" + (y(d.y) + p) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
				})
				.on("click", click)
				.append("tspan")
					.attr("x", 0)
					.text(function(d) { return d.depth ? d.name : ""; }),
			click = function(d) {
				path.transition()
				  .duration(duration)
				  .attrTween("d", arcTween(d));
			  
				// Somewhat of a hack as we rely on arcTween updating the scales.
				text.style("visibility", function(e) {
				    return isParentOf(d, e) ? null : d3.select(this).style("visibility");
				})
				.transition().duration(duration)
				.attrTween("text-anchor", function(d) {
					return function() {
						return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
					};
				})
				.attrTween("transform", function(d) {
					var multiline = (d.name || "").split(" ").length > 1;
					return function() {
						var angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
						rotate = angle + (multiline ? -.5 : 0);
						return "rotate(" + rotate + ")translate(" + (y(d.y) + p) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
					};
				})
				.style("fill-opacity", function(e) { return isParentOf(d, e) ? 1 : 1e-6; })
				.each("end", function(e) {
					d3.select(this).style("visibility", isParentOf(d, e) ? null : "hidden");
				});
			},
			arcTween = function(d) {
				// Interpolate the scales!
				var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
				yd = d3.interpolate(y.domain(), [d.y, 1]),
				yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
				return function(d, i) {
					return i
					? function(t) { return arc(d); }
					: function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
				};
			},
			isParentOf = function(p, c) {
				if (p === c) return true;
				if (p.children) {
					return p.children.some(function(d) {
						return isParentOf(d, c);
					});
				}
				return false;
			},
			colour = function(d) {
				if (d.children) {
					// There is a maximum of two children!
					var colours = d.children.map(colour),
					a = d3.hsl(colours[0]),
					b = d3.hsl(colours[1]);
					// L*a*b* might be better here...
					return d3.hsl((a.h + b.h) / 2, a.s * 1.2, a.l / 1.2);
				}
				return d.colour || "#fff";
			},
			brightness = function(rgb) {
				// http://www.w3.org/WAI/ER/WD-AERT/#color-contrast
				return rgb.r * .299 + rgb.g * .587 + rgb.b * .114;
			};
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
		var id = 'project_'+i,
			html = '<div class="project" id="'+id+'"> \
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
		$('#projects').append(html);
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
				createProjectElement(id);
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
		$('#analyse').click(function() {
			var username = attn.settings.username;
			rebuildProjectObjectFromInputs();
			setURLParams();
			getProjects(function() { // TO-DO: allow new sets of projects to be analysed without making another search request (unless the earliestDate has changed)
				console.log('project analysis finished');
				console.log(settings.projectDurations);
				updateGraphs();
				updateSummaryTable();
			});
		});
		$('#add_project').click(function() {
			var i = settings.projects.length;
			console.log(i);
			createProjectElement(i);
		});
	};

$(document).ready(function() {
	readURLParams();
	rebuildProjectObjectFromInputs();
	if(settings.projects.length>1) {
		var $analyseButton = $('#analyse'),
			analyseText = $analyseButton.text();
		$analyseButton.text(analyseText.replace('project', 'projects'));
	}
	// we're waiting for the iframe-comms to catch up
	$(document).bind('crossDomainAjaxLoaded', load);
});