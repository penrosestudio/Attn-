/*
	BUG: there is a failed test in getHelperText module if this is run 1 minute to the hour
	TO-DO: add test for setting policy on new bags (not GUEST-writable!)
*/

var now,
	host,
	attnTestTiddlers; /* defined at bottom because it is long */

$(document).ready(function() {
	
	/* it should understand commands as "<project> <action> <timeMod>", where <project> can be "off" or a project, <action> can be "bill" or a set of tags, and timeMod can be of the form "10", "-10", "10m", "-10m", "14:36", "14:35 yesterday", "12:00 2nd March", "14:00 last Thursday" */
	module("command line", {
		setup: function() {
			now = new Date();
		},
		teardown: function() {}
	});
	
	test("given a command of '', it should return undefined", function() {
		equals(undefined,attn.parseCommand(""));
	});
	
	test("given a command of 'project1', it should understand this as a switch to 'project1'", function() {
		var command = "project1",
			expected = {
				project: "project1",
				time: now,
				command: command
			},
			actual = attn.parseCommand(command,now);
		deepEqual(actual, expected);
	});
	
	test("given a command of 'project1 ', it should understand this as a switch to 'project'1", function() {
		var command = "project1 ",
			expected = {
				project: "project1",
				time: now,
				command: command
			},
			actual = attn.parseCommand(command,now);
		deepEqual(actual, expected);
	});
	
	test("given a command of 'project1 -10', it should understand this as a switch to 'project1' ten minutes ago", function() {
		var command = "project1 -10",
			actual = attn.parseCommand(command,now),
			expected = {
				project: "project1",
				time: now.add(-10).minutes(),
				command: command
			};
		deepEqual(actual, expected);
	});
	
	test("given a command of 'project1 -10m', it should understand this as a switch to 'project1' ten minutes ago", function() {
		var command = "project1 -10m",
			actual = attn.parseCommand(command,now),
			expected = {
				project: "project1",
				time: now.add(-10).minutes(),
				command: command
			};
		deepEqual(actual, expected);
	});

	test("given a command of 'project1 15', it should understand this as a switch to 'project1' in fifteen minutes", function() {
		var command = "project1 15",
			actual = attn.parseCommand(command,now),
			expected = {
				project: "project1",
				time: now.add(15).minutes(),
				command: command
			};
		deepEqual(actual, expected);
	});

	test("given a command of 'project1 15m', it should understand this as a switch to 'project1' in fifteen minutes", function() {
		var command = "project1 15m",
			actual = attn.parseCommand(command,now),
			expected = {
				project: "project1",
				time: now.add(15).minutes(),
				command: command
			};
		deepEqual(actual, expected);
	});

	test("given a command of 'project1 12:30', it should understand this as a switch to 'project1' at 12:30pm today", function() {
		var command = "project1 12:30",
			actual = attn.parseCommand(command,now),
			expected = {
				project: "project1",
				time: now.set({ hour: 12, minute: 30, second: 00 }),
				command: command
			};
		deepEqual(actual, expected);
	});

	test("given a command of 'project1 12pm', it should understand this as a switch to 'project1' at 12pm today", function() {
		var command = "project1 12pm",
			actual = attn.parseCommand(command,now),
			expected = {
				project: "project1",
				time: now.set({ hour: 12, minute: 00, second: 00 }),
				command: command
			};
		deepEqual(actual, expected);
	});

	test("given a command of 'project1 12:00 yesterday', it should understand this as a switch to 'project1' at 12pm yesterday", function() {
		var command = "project1 12:00 yesterday",
			actual = attn.parseCommand(command,now),
			expected = {
				project: "project1",
				time: now.add(-1).days().set({ hour: 12, minute: 00, second: 00 }),
				command: command
			};
		equals(actual.project, expected.project);
		equals(actual.time.toString(), expected.time.toString());
		equals(actual.command, expected.command);
	});

	test("given a command of 'project1 12:00 12th March', it should understand this as a switch to 'project1' at 12pm on 12th March this year", function() {
		var command = "project1 12:00 12th March",
			actual = attn.parseCommand(command,now),
			expected = {
				project: "project1",
				time: now.set({ month: 2, day: 12, hour: 12, minute: 00, second: 00 }),
				command: command
			};
		equals(actual.project, expected.project);
		equals(actual.time.toString(), expected.time.toString());
		equals(actual.command, expected.command);
	});

	test("given a command of 'project1 meeting 12:00 yesterday', it should understand this as a switch to 'project1' at 12pm yesterday, with the tag 'meeting'", function() {
		var command = "project1 meeting 12:00 yesterday",
			actual = attn.parseCommand(command,now),
			expected = {
				project: "project1",
				time: now.add(-1).days().set({ hour: 12, minute: 00, second: 00 }),
				tags: ['meeting'],
				command: command
			};
		equals(actual.project, expected.project);
		equals(actual.time.toString(), expected.time.toString());
		deepEqual(actual.tags, expected.tags);
		equals(actual.command, expected.command);
	});
	
	test("given a command of 'off 12:30 yesterday', it should understand this as a switch to 'off' at 12:30pm yesterday", function() {
		var command = "off 12:30 yesterday",
			actual = attn.parseCommand(command,now),
			expected = {
				project: "off",
				time: now.add(-1).days().set({ hour: 12, minute: 30, second: 00 }),
				command: command
			};
		equals(actual.project, expected.project);
		equals(actual.time.toString(), expected.time.toString());
		equals(actual.command, expected.command);
	});
	
	test("given a command of 'project1 bill 12:30 13th May', it should understand this as a switch to 'project1' at 12pm on 13th May this year, with the tag 'bill'", function() {
		var command = "project1 bill 12:30 13th May",
			actual = attn.parseCommand(command,now),
			expected = {
				project: "project1",
				time: now.set({ month: 4, day: 13, hour: 12, minute: 30, second: 00 }),
				tags: ['bill'],
				command: command
			};
		equals(actual.project, expected.project);
		equals(actual.time.toString(), expected.time.toString());
		deepEqual(actual.tags, expected.tags);
		equals(actual.command, expected.command);
	});
	
	test("given a command of 'project1 bill meeting', it should understand this as a switch to 'project1', now, with the tags 'bill' and 'meeting'", function() {
		var command = "project1 bill meeting",
			actual = attn.parseCommand(command,now),
			expected = {
				project: "project1",
				time: now,
				tags: ['bill', 'meeting'],
				command: command
			};
		equals(actual.project, expected.project);
		equals(actual.time.toString(), expected.time.toString());
		deepEqual(actual.tags, expected.tags);
		equals(actual.command, expected.command);
	});
	
	test("given a command of 'project1 bill meeting 12:30 13th May', it should understand this as a switch to 'project1' at 12pm on 13th May this year, with the tags 'bill' and 'meeting'", function() {
		var command = "project1 bill meeting 12:30 13th May",
			actual = attn.parseCommand(command,now),
			expected = {
				project: "project1",
				time: now.set({ month: 4, day: 13, hour: 12, minute: 30, second: 00 }),
				tags: ['bill', 'meeting'],
				command: command
			};
		equals(actual.project, expected.project);
		equals(actual.time.toString(), expected.time.toString());
		deepEqual(actual.tags, expected.tags);
		equals(actual.command, expected.command);
	});
	
	test("given a command of 'project1 12:ab, it should understand that this is a bad time modification", function() {
		var command = "project1 12:ab",
			actual = attn.parseCommand(command);
		ok(actual.error,"an error was found");
	});
	
	test("it should not focus if clicked on and there is a sync in progress", function() {
		var $attn = $('#attn').attn(),
			tmp = $.ajax,
			e = $.Event("keyup");
		e.keyCode = 13;
		$.ajax = function() {
			// do nothing to mock a sync that never finishes
		};
		$(document).bind("AttnEventCreated", function(e, attnEvent) {
			attn.saveEvent(attnEvent);
		});
		$attn.val("hello").trigger(e);
		$attn.blur().click();
		ok(!$attn.is(":focus"));
		$.ajax = tmp;
		$(document).unbind("AttnEventCreated");
	});
	test("if a sync ends after the attn box has been clicked on and no other click has occurred, the attn box should be focussed", function() {
		var $attn = $('#attn').attn(),
			tmp = $.ajax,
			e = $.Event("keyup");
		e.keyCode = 13;
		$.ajax = function() {
			// do nothing to mock a sync that never finishes
		};
		$(document).bind("AttnEventCreated", function(e, attnEvent) {
			attn.saveEvent(attnEvent);
		});
		$attn.val("hello").trigger(e);
		$attn.blur().click();
		ok(!$attn.is(":focus"), "not focussed");
		$(document).trigger("AttnEventSaved"); // simulate the end of a sync by calling AttnEventSaved
		ok($attn.is(":focus"), "focussed");
		
		$attn.val("hello").trigger(e);
		$attn.blur().click();
		ok(!$attn.is(":focus"), "not focussed");
		$('#notes').click(); // click on something else
		$(document).trigger("AttnEventSaved");
		ok(!$attn.is(":focus"), "not focussed");
		
		$.ajax = tmp;
		$(document).unbind("AttnEventCreated");
	});
	
	test("given a press of the enter key, it should create an attn object and trigger the AttnEventCreated event on the document", function() {
		var project = "project1",
			tags = ["meeting","billable"],
			command = project+" "+tags.join(" "),
			expected,
			e = $.Event("keyup");
		e.keyCode = 13;
		expect(1);
		$(document).bind('AttnEventCreated', function(e, attnEvent) {
			expected = {
				project: project,
				time: attn.now,
				title: attn.now.getTime(),
				tags: tags,
				command: command
			};
			deepEqual(attnEvent,expected);
		});
		$('#attn')
			.val(command)
			.attn()
			.trigger(e);
	});
	
	test("given a press of a key other than 'enter', the 'AttnEventPending' event should be triggered on the document, with the parsed event as the parameter", function() {
		var project = "project1",
			tags = ["meeting","billable"],
			command = project+" "+tags.join(" "),
			expected,
			e = $.Event("keyup");
		e.keyCode = 74;
		expect(1);
		$(document).bind('AttnEventPending', function(e, attnEvent) {
			expected = {
				project: project,
				time: attn.now,
				title: attn.now.getTime(),
				tags: tags,
				command: command
			};
			deepEqual(attnEvent,expected);
			$(document).unbind("AttnEventPending");
		});
		$('#attn')
			.val(command)
			.attn()
			.trigger(e);
	});
	
	test("given a blank command line, the AttnEventPending event should be triggered on the document without a parsed event", function() {
		var e = $.Event("keyup");
		e.keyCode = 8; // backspace
		expect(1);
		$(document).bind('AttnEventPending', function(e,attnEvent) {
			ok(!attnEvent);
		});
		$('#attn')
			.val("")
			.attn()
			.trigger(e);
	});
	
	test("it should save the parsed command as the current attn object", function() {
		equals(attn.getCurrent(),undefined);
		var parsed = attn.parseCommand("project1");
		deepEqual(attn.getCurrent(), parsed);
	});

	module("current attn object - get/setCurrent");
	
	test("it should set the current attn object", function() {
		var parsed = attn.parseCommand("project1");
		attn.setCurrent(parsed);
		deepEqual(attn.getCurrent(), parsed);
	});

	module("getHelperText");

	test("given a command of '', actionHelperText should be null and infoHelperText should be 'Type'", function() {
		var command = "",
			actual = attn.getHelperText(attn.parseCommand(command)),
			expected = {
				actionHelperText: null,
				infoHelperText: "Type"
			};
		deepEqual(actual,expected);
	});
	
	test("given a command of 'proj', aHT should be 'Switch to 'proj' now' and iHT should be null", function() {
		var command = "proj",
			actual = attn.getHelperText(attn.parseCommand(command)),
			expected = {
				actionHelperText: "Switch to 'proj' now",
				infoHelperText: null
			};
		deepEqual(actual,expected);
	});

	test("given a command of 'project w', aHT should be 'Switch to 'project' now' and iHT should be 'tags: 'w''", function() {
		var command = "project w",
			actual = attn.getHelperText(attn.parseCommand(command)),
			expected = {
				actionHelperText: "Switch to 'project' now",
				infoHelperText: "tags: 'w'"
			};
		deepEqual(actual,expected);
	});

	test("given a command of 'project meeting 12:a', aHT should be null and iHT should be ''12:a' is not a valid time'", function() {
		var command = "project meeting 12:a",
			actual = attn.getHelperText(attn.parseCommand(command)),
			expected = {
				actionHelperText: null,
				infoHelperText: "'12:a' is not a valid time"
			};
		deepEqual(actual,expected);
	});
	
	test("given a command of 'project meeting HH:mm', where 'HH:mm' is a time more than an hour in the past, aHT should be 'Switch to 'project' at HH:mm' and iHT should be 'tags: 'meeting''", function() {
		var time = (new Date).add(-1).hours().set({
			minute: 0
		}).toString("HH:mm");
		command = "project meeting "+time,
			actual = attn.getHelperText(attn.parseCommand(command)),
			expected = {
				actionHelperText: "Switch to 'project' at "+time,
				infoHelperText: "tags: 'meeting'"
			};
		deepEqual(actual,expected);
	});
	
	test("given a command of 'project -4', aHT should be 'Switch to 'project' 4 minutes ago' and iHT should be null", function() {
		var command = "project -4",
			actual = attn.getHelperText(attn.parseCommand(command)),
			expected = {
				actionHelperText: "Switch to 'project' 4 minutes ago",
				infoHelperText: null
			};
		deepEqual(actual,expected);
	});
	
	test("given a command of 'project 4', aHT should be 'Switch to 'project' in 4 minutes' and iHT should be null", function() {
		var command = "project 4",
			actual = attn.getHelperText(attn.parseCommand(command)),
			expected = {
				actionHelperText: "Switch to 'project' in 4 minutes",
				infoHelperText: null
			};
		deepEqual(actual,expected);
	});
	
	test("given a command of 'project 12:00 yesterday', aHT should be 'Switch to 'project' at <yesterday's datetime>' and iHT should be null", function() {
		var command = "project 12:00 yesterday",
			actual = attn.getHelperText(attn.parseCommand(command)),
			expected = {
				actionHelperText: "Switch to 'project' at "+(new Date).add(-1).days().set({
					hour: 12,
					minute: 00,
					second: 00
				}).toString(),
				infoHelperText: null
			};
		deepEqual(actual,expected);
	});
	
	test("given a command of 'project HH:mm', where 'HH:mm' is less than a minute in the past, aHT should be 'Switch to 'project' 1 minute ago' and iHT should be null", function() {
		var time = (new Date).toString("HH:mm"),
			command = "project "+time,
			actual = attn.getHelperText(attn.parseCommand(command)),
			expected = {
				actionHelperText: "Switch to 'project' 1 minute ago",
				infoHelperText: null
			};
		deepEqual(actual,expected);
	});
	
	module("notes", {
		
	});
	
	test("given a text note and a parsed object, it should add the note as the note property of the parsed object", function() {
		var note = "I am a note",
			parsed = attn.parseCommand("project1 meeting -10m");
		attn.addNote(parsed, note);
		equals(parsed.note, note);
	});
	
	module("saveCurrent", {
		setup: function() {
			this.notesElem = $("<textarea></textarea>");
		},
		teardown: function() {
			delete this.notesElem;
		}
	});
	
	test("it should cause saveEvent to be called using the current command and any notes", function() {
		var tmpSaveEvent = attn.saveEvent,
			note = "I am a note";
		$(this.notesElem).val(note);
		attn.parseCommand("project1");
		attn.saveEvent = function(parsed, host) {
			equals(parsed.note, note);
			attn.saveEvent = tmpSaveEvent;
		};
		expect(1);
		attn.saveNotes(this.notesElem);
	});
	
	module("saveEvent", {
		setup: function() {
			host = "http://attn-test.tiddlyspace.com";
		}
	});

	test("given an attn event and a remote host, it should PUT to that host, adding 'attn' and 'project:<project>' tags to the tiddler", function() {
		var tmpAjax = $.ajax,
			now = new Date(),
			note = "I am a note",
			parsed = attn.parseCommand("project1 meeting", now);
		attn.addNote(parsed, note);
		$.ajax = function(options) {
			var url = options.url,
				putHost = url.substring(0,url.indexOf("/",url.indexOf("http://")+7)),
				actual = $.parseJSON(options.data);
			url = url.substring(url.lastIndexOf("/")+1);
			equals(putHost,host);
			equals(url, attn.now.getTime().toString());
			equals(actual.text, note);
			deepEqual(actual.tags, ["meeting","attn","project:project1"]);
			$.ajax = tmpAjax;
		};
		expect(4);
		attn.saveEvent(parsed, host);
	});

	test("it should set the destination bag as 'attn_<username>_<date>', where <username> is the logged-in ID and <date> is the current date formatted as YYYYMMDD", function() {
		var tmpAjax = $.ajax,
			now = new Date(),
			parsed = attn.parseCommand("project",now),
			date = now.toString("yyyyMMdd"),
			destBag = "attn_GUEST_"+date;
		attn.settings = {
			username: "GUEST",
			date: date
		};
		$(document).bind("AttnEventSaved", function(e,tiddler) {
			var bag = tiddler.bag.name;
			equals(bag,destBag);
			$(document).unbind("AttnEventSaved");
		});
		$.ajax = function(options) {
			options.success();
			$.ajax = tmpAjax;
		};
		expect(1);
		attn.saveEvent(parsed, host);
	});

	asyncTest("given a successful PUT, it should trigger the 'AttnEventSaved' event on the document", function() {
		var parsed = attn.parseCommand("project1 meeting"),
			tmpAjax = $.ajax;
		$.ajax = function(options) {
			options.success();
		};
		$(document).bind("AttnEventSaved", function() {
			ok(1);
			$.ajax = tmpAjax;
			$(document).unbind("AttnEventSaved");
			start();
		});
		expect(1);
		attn.saveEvent(parsed,host);
	});
	
	test("given an attn event with no tags, it should not break", function() {
		var tmpAjax = $.ajax,
			now = new Date(),
			parsed = attn.parseCommand("project1", now);
		$.ajax = function(options) {
			var actual = $.parseJSON(options.data);
			deepEqual(actual.tags, ["attn","project:project1"]);
			$.ajax = tmpAjax;
		};
		expect(1);
		attn.saveEvent(parsed, host);
	});
	
	test("given a failed PUT, if the error code was 409, it should try to create the intended bag and try again", function() {
		var tmpAjax = $.ajax,
			now = new Date(),
			parsed = attn.parseCommand("project1", now),
			date = now.toString("yyyyMMdd"),
			destBag = "attn_GUEST_"+date;
		attn.settings = {
			username: "GUEST",
			date: date
		};
		$.ajax = function(options) {
			var mockXhr = {
				status: 409
			};
			$.ajax = function(options) {
				equals(options.type,"PUT");
				equals(options.url,host+"/bags/"+destBag);
				$.ajax = tmpAjax;
			};
			options.error(mockXhr);
		};
		expect(2);
		attn.saveEvent(parsed, host);
	});
	
	test("given a failed PUT, if the error code is anything other than 409, it should trigger AttnEventSaveError on the document", function() {
		var tmpAjax = $.ajax,
			now = new Date(),
			parsed = attn.parseCommand("project1", now),
			date = now.toString("yyyyMMdd"),
			destBag = "attn_GUEST_"+date;
		attn.settings = {
			username: "GUEST",
			date: date
		};
		$(document).bind('AttnEventSaveError', function() {
			$(document).unbind("AttnEventSaveError");
			ok(1);
		});
		$.ajax = function(options) {
			var mockXhr = {
				status: 403
			};
			$.ajax = tmpAjax;
			options.error(mockXhr);
		};
		expect(1);
		attn.saveEvent(parsed, host);
	});
	
	test("given a failed bag creation, it should trigger AttnEventSaveError on the document", function() {
		var tmpAjax = $.ajax,
			now = new Date(),
			parsed = attn.parseCommand("project1", now),
			date = now.toString("yyyyMMdd"),
			destBag = "attn_GUEST_"+date;
		attn.settings = {
			username: "GUEST",
			date: date
		};
		$(document).bind('AttnEventSaveError', function() {
			$(document).unbind("AttnEventSaveError");
			ok(1);
		});
		$.ajax = function(options) {
			var mockXhr = {
				status: 409
			};
			$.ajax = function(options) {
				options.error();
				$.ajax = tmpAjax;
			};
			ok(1);
			options.error(mockXhr);
		};
		expect(2);
		attn.saveEvent(parsed, host);
	});
	
	module("login - attn.checkStatus", {
		setup: function() {
			this.statusPath = "/status";
			this.host = "http://attn-test.tiddlyspace.com";
		}
	});
	
	test("it should make a GET to '/status' with dataType 'json' if no host is provided", function() {
		var tmpAjax = $.ajax,
			that = this;
		$.ajax = function(options) {
			if(options.url===that.statusPath) {
				ok(1);
			}
			if(options.dataType==="json") {
				ok(1);
			}
			$.ajax = tmpAjax;
		};
		expect(2);
		attn.checkStatus();
	});
	
	test("it should make a GET to host+'/status' if a host is provided", function() {
		var tmpAjax = $.ajax,
			that = this,
			host = this.host;
		$.ajax = function(options) {
			if(options.url===that.host+that.statusPath) {
				ok(1);
			}
			$.ajax = tmpAjax;
		};
		expect(1);
		attn.checkStatus(null,null,host);
	});
	
	test("it should call a success callback if the username is not GUEST", function() {
		var success = function() {
				ok(1);
				$.ajax = tmpAjax;
			},
			tmpAjax = $.ajax;
		$.ajax = function(options) {
			options.success({
				username: "test"
			});
		};		
		expect(1);
		attn.checkStatus(success);
	});
	
	test("it should set attn.settings.username to the username", function() {
		var username = "test",
			date = (new Date).toString("yyyyMMdd"),
			success = function() {
				equals(attn.settings.username,username);
				$.ajax = tmpAjax;
			},
			tmpAjax = $.ajax;
		$.ajax = function(options) {
			options.success({
				username: username
			});
		};		
		expect(1);
		attn.checkStatus(success);
	});
	
	test("it should call an error callback if the username is GUEST", function() {
		var error = function() {
				ok(1);
				$.ajax = tmpAjax;
			},
			tmpAjax = $.ajax;
		$.ajax = function(options) {
			options.success({
				username: "GUEST"
			});
		};		
		expect(1);
		attn.checkStatus(null,error);
	});
	
	test("it should call an error callback if there is a HTTP error", function() {
		var tmpAjax = $.ajax,
			errorFunc = function() {
				ok(1);
				$.ajax = tmpAjax;
			};
		$.ajax = function(options) {
			options.error();
		};
		expect(1);
		attn.checkStatus(null,errorFunc);
	});
	
	module("login - attn.login", {
		setup: function() {
			this.username = "test";
			this.password = "password";
			this.loginPath = "/challenge/tiddlywebplugins.tiddlyspace.cookie_form";
			this.host = "http://attn-test.tiddlyspace.com";
		}
	});

	test("it should POST to '/challenge/tiddlywebplugins.tiddlyspace.cookie_form' if no host is provided", function() {
		var tmpAjax = $.ajax,
			that = this;
		$.ajax = function(options) {
			if(options.url===that.loginPath) {
				ok(1);
			}
			if(options.type==="POST") {
				ok(1);
			}
			$.ajax = tmpAjax;
		};
		expect(2);
		attn.login(this.username,this.password);
	});
	
	test("it should POST to host+'/challenge/tiddlywebplugins.tiddlyspace.cookie_form' if host is provided", function() {
		var tmpAjax = $.ajax,
			that = this;
			host = this.host;
		$.ajax = function(options) {
			if(options.url===that.host+that.loginPath) {
				ok(1);
			}
			$.ajax = tmpAjax;
		};
		expect(1);
		attn.login(this.username,this.password,null,null,host);
	});
	
	test("it should send the username and password provided along to the server", function() {
		var tmpAjax = $.ajax,
			that = this;
		$.ajax = function(options) {
			equals(options.data.user,that.username);
			equals(options.data.password,that.password);
			$.ajax = tmpAjax;
		};
		expect(2);
		attn.login(this.username,this.password);
	});
	
	test("it should call the provided callback if the login is successful i.e. not a 401 status", function() {
		var tmpAjax = $.ajax,
			success = function() {
				ok(1);
				$.ajax = tmpAjax;
			};
		$.ajax = function(options) {
			options.success("",200);
		};
		expect(1);
		attn.login(this.username,this.password,success);
	});
	
	test("it should call attn.checkStatus if the login is successful", function() {
		var tmpAjax = $.ajax,
			tmpStatus = attn.checkStatus;
		$.ajax = function(options) {
			options.success("",200);
		};
		attn.checkStatus = function() {
			ok(1);
			$.ajax = tmpAjax;
			attn.checkStatus = tmpStatus;
		};
		expect(1);
		attn.login(this.username,this.password);		
	});
	
	test("it should call a provided error function if the login is not successful", function() {
		var tmpAjax = $.ajax,
			errorFunc = function() {
				ok(1);
				$.ajax = tmpAjax;
			};
		$.ajax = function(options) {
			var mockXhr = {
				statusText: "test"
			};
			options.success("","error",mockXhr);
		};
		expect(1);
		attn.login(this.username,this.password,errorFunc);
	});
	
	test("it should call a provided error function is there is a HTTP error", function() {
		var tmpAjax = $.ajax,
			errorFunc = function() {
				ok(1);
				$.ajax = tmpAjax;
			};
		$.ajax = function(options) {
			options.error();
		};
		expect(1);
		attn.login(this.username,this.password,null,errorFunc);
	});
	
	/********
	
	analysis
	
	********/
	
	module("analysing periods - getProject", {
		setup: function() {
			this.testTiddlers = attnTestTiddlers;
		}
	});
	
	test("it should return the project for a tiddler, or null if it has none", function() {
		var testTiddlers = this.testTiddlers,
			actual = attn.getProject(testTiddlers[1]),
			expected = "off";
		equals(actual,expected);
		actual = attn.getProject(testTiddlers[2]);
		expected = "bpsf";
		equals(actual,expected);
	});
	
	test("it should return null for a tiddler with no tags", function() {
		var project = attn.getProject({});
		ok(!project, "return no project for tiddler with no tags");
	});
	
	module("analysing periods - createPeriods", {
		setup: function() {
			this.testTiddlers = attnTestTiddlers
		}
	});
	
	test("it should return an array of periods from an array of tiddlers, using any tiddler with project:off tag as an 'off' marker; each period should have a start (epoch time), a startDate (Date), an end (epoch time), an endDate (Date), a duration (ms), a project parameter (if that exists) and a notes field (if the starting tiddler has any text)", function() {
		var testTiddlers = this.testTiddlers,
			actual = attn.createPeriods(testTiddlers),
			actualProjectCount = $(actual).filter(function(i, period) {
				return period.project;
			}).length;
		equals(actual.length,5);
		equals(actualProjectCount,5);
		$.each(actual, function(i, period) {
			equals(typeof period.start,"number");
			ok(period.startDate instanceof Date);
			equals(typeof period.start,"number");
			ok(period.endDate instanceof Date);
			equals(typeof period.duration,"number");
		});
		equals(actual[0].project,"yo");
		equals(actual[1].project,"yo");
		equals(actual[2].project,"evo");
		equals(actual[3].project,"bpsf");
		equals(actual[4].project,"off");
		equals(actual[3].notes,"I am a note");
	});
	
	test("it should allow for unfinished periods by creating a period without an end, endDate or duration", function() {
		var testTiddlers = [{
				title: new Date(),
				tags: ['attn','project:test']
			}],
			actual = attn.createPeriods(testTiddlers);
			equals(actual.length,1);
	});
	
	test("it should accept a callback and call that for each period, using the period as 'this'", function() {
		var callback = function() {
				ok(1);
			},
			testPeriods = attn.createPeriods(this.testTiddlers, callback),
			actual = testPeriods[2];
		expect(5);
	});
	
	module("analysing periods - epochFormat", {
		setup: function() {
			this.testTiddlers = attnTestTiddlers;
		}
	});
	
	test("it should take an epoch time, convert it to a Date and return it as a formatted string", function() {
		var periods = attn.createPeriods(this.testTiddlers),
			period = periods[0],
			actual = attn.epochFormat(period.start,"h:mmtt dd MM yyyy").toLowerCase(),
			timezoneHoursOffset = parseInt((new Date).getUTCOffset().substring(0,3)),
			hours = 10+timezoneHoursOffset, // fix for timezone in integer-hour difference timezones
			expected = hours+":26pm 19 07 2011";
		equals(actual,expected);
	});
	
	module("analysing periods - formatDuration", {
	
	});
	
	test("it should take a ms duration and return it as an object with hours, minutes and seconds properties", function() {
		var actual = attn.formatDuration(12345678),
			expected = {
				hours: 3,
				minutes: 25,
				seconds: 45
			};
		deepEqual(actual,expected);
	});
	
	test("it should return an empty object if no duration is supplied", function() {
		var actual = attn.formatDuration();
			expected = {};
		deepEqual(actual,expected);
	});
	
	module("analysing periods - daysFromPeriods", {
		setup: function() {
			this.periods = attn.createPeriods(attnTestTiddlers);
		}
	});
	
	test("it should batch periods into an array of objects, one per day, with a 'date' property containing the epoch time at midnight of the day, and an 'events' array containing all the periods for that day", function() {
		var periods = this.periods,
			actual = attn.daysFromPeriods(periods);
		equals(actual.length,3);
	});
	
	test("it should accept a format parameter and use that to create the date string in each day object", function() {
		var periods = this.periods,
			days = attn.daysFromPeriods(periods,"dd.MM.yyyy"),
			actual = days[0];
		equals(actual.date,"19.07.2011");
	});
	
	test("it should return an empty array if no periods are passed in", function() {
		var actual = attn.daysFromPeriods();
		equals(actual.length,0);
		actual = attn.daysFromPeriods([]);
		equals(actual.length,0);
	});
	
	module("analysing periods - getEvents", {
		setup: function() {
			attn.attnEvents = [];
		}
	});
	
	test("it should search the server for tiddlers that are in bags that start with 'attn_<username>_'", function() {
		var tmpAjax = $.ajax;
		attn.settings.username = "GUEST";
		$.ajax = function(options) {
			ok(options.url.indexOf('/search?q=bag:attn_'+attn.settings.username+"_*")!==-1,"making correct wildcard search");
			$.ajax = tmpAjax;
		};
		expect(1);
		attn.getEvents();
	});
	
	test("it should return tiddlers ordered by title", function() {
		var tmpAjax = $.ajax;
		attn.settings.username = "GUEST";
		$.ajax = function(options) {
			ok(options.url.indexOf('sort=-title')!==-1,"ordering by title");
			$.ajax = tmpAjax;
		};
		expect(1);
		attn.getEvents();
	});
	
	test("it should apply a large limit to searches", function() {
		var tmpAjax = $.ajax;
		attn.settings.username = "GUEST";
		$.ajax = function(options) {
			ok(options.url.indexOf("%20_limit:999999")!==-1,"adding large limit");
			$.ajax = tmpAjax;
		}
		expect(1);
		attn.getEvents();
	});
	
	test("it should call a provided callback with the JSON of the returned tiddlers, throwing away any that don't have 'attn' as a tag", function() {
		var tmpAjax = $.ajax,
			callback = function(data) {
				equals(data.length,6);
			};
		attn.settings.username = "GUEST";
		$.ajax = function(options) {
			$.ajax = tmpAjax;
			options.success(attnTestTiddlers);
		};
		expect(1);
		attn.getEvents(callback);
	});
	
	test("it should save the returned events to attn.attnEvents", function() {
		var tmpAjax = $.ajax,
			callback = function(data) {
				equals(attn.attnEvents.length,6);
			};
		attn.settings.username = "GUEST";
		$.ajax = function(options) {
			$.ajax = tmpAjax;
			options.success(attnTestTiddlers);
		};
		expect(2);
		equals(attn.attnEvents.length,0);
		attn.getEvents(callback);
	});
	
	module("analysing periods - addEvent", {
		setup: function() {
			this.attnTestTiddlers = attnTestTiddlers;
		},
		teardown: function() {
			attnTestTiddlers = this.attnTestTiddlers;
		}
	});
	
	test("it should add the provided event to the saved array of events in chronological position", function() {
		var tmpAjax = $.ajax,
			event = {
				title: '1311162745468'
			},
			callback = function(data) {
				equals(attn.attnEvents.length,6);
				attn.addEvent(event);
				equals(attn.attnEvents.length,7);
				equals(attn.attnEvents[4],event);
			};
		attn.settings.username = "GUEST";
		$.ajax = function(options) {
			$.ajax = tmpAjax;
			options.success(attnTestTiddlers);
		};
		expect(3);
		attn.getEvents(callback);
	});
	
	test("it should add the event to the front of the array of events if it is the earliest event", function() {
		var tmpAjax = $.ajax,
			event = {
				title: (new Date).getTime()
			},
			callback = function(data) {
				equals(attn.attnEvents.length,6);
				attn.addEvent(event);
				equals(attn.attnEvents.length,7);
				equals(attn.attnEvents[0],event);
			};
		attn.settings.username = "GUEST";
		$.ajax = function(options) {
			$.ajax = tmpAjax;
			options.success(attnTestTiddlers);
		};
		expect(3);
		attn.getEvents(callback);
	});
	
	test("it should overwrite existing events if the same title is used", function() {
		var event = {
				title: '1311162745468'
			},
			origLength,
			testText = "hi there";
		attn.attnEvents = attnTestTiddlers;
		origLength = attn.attnEvents.length;
		attn.addEvent(event);
		equals(attn.attnEvents.length-origLength,1);
		event.text = testText;
		attn.addEvent(event);
		equals(attn.attnEvents.length-origLength,1);
		equals(attn.attnEvents[4].text,testText);
	});

});

attnTestTiddlers = [
	{"created": "20110721204941", "fields": {"_hash": "da39a3ee5e6b4b0d3255bfef95601890afd80709"}, "creator": "jnthnlstr", "recipe": null, "modified": "20110721204941", "bag": "attn_jnthnlstr_20110721", "title": "1311270577097", "permissions": ["read", "write", "create", "delete"], "modifier": "jnthnlstr", "type": null, "tags": ["attn", "project:off"], "revision": 471551}, // Thu Jul 21 2011 18:49:37 GMT+0100 (BST)
	{"created": "20110721204920", "fields": {"_hash": "da39a3ee5e6b4b0d3255bfef95601890afd80709"}, "creator": "jnthnlstr", "recipe": null, "modified": "20110721204920", "bag": "attn_jnthnlstr_20110721", "title": "1311281356433", "permissions": ["read", "write", "create", "delete"], "modifier": "jnthnlstr", "type": null, "tags": ["attn", "project:off"], "revision": 471550}, // Thu Jul 21 2011 21:49:16 GMT+0100 (BST)
	{"created": "20110721204902", "fields": {"_hash": "da39a3ee5e6b4b0d3255bfef95601890afd80709"}, "creator": "jnthnlstr", "recipe": null, "modified": "20110721204902", "bag": "attn_jnthnlstr_20110721", "title": "1311281337675", "permissions": ["read", "write", "create", "delete"], "modifier": "jnthnlstr", "type": null, "text": ["I am a note"], "tags": ["attn", "project:bpsf"], "revision": 471549}, // Thu Jul 21 2011 21:48:57 GMT+0100 (BST)
	{"created": "20110721153910", "fields": {"_hash": "da39a3ee5e6b4b0d3255bfef95601890afd80709"}, "creator": "jnthnlstr", "recipe": null, "modified": "20110721153910", "bag": "attn_jnthnlstr_20110721", "title": "1311262745468", "permissions": ["read", "write", "create", "delete"], "modifier": "jnthnlstr", "type": null, "tags": ["attn", "project:evo"], "revision": 471267}, // Thu Jul 21 2011 16:39:05 GMT+0100 (BST)
	/*only use this to test out the getEvents function */
	//{"created": "20110719153703", "fields": {"_hash": "da39a3ee5e6b4b0d3255bfef95601890afd80709"}, "creator": "jnthnlstr", "recipe": null, "modified": "20110720155404", "bag": "attn_jnthnlstr_20110719", "title": "1311089774592", "permissions": ["read", "write", "create", "delete"], "modifier": null, "type": null, "tags": [], "revision": 469036},
	{"created": "20110720071005", "fields": {"_hash": "da39a3ee5e6b4b0d3255bfef95601890afd80709"}, "creator": "jnthnlstr", "recipe": null, "modified": "20110720071005", "bag": "attn_jnthnlstr_20110720", "title": "1311145755578", "permissions": ["read", "write", "create", "delete"], "modifier": "jnthnlstr", "type": null, "text": ["I am a note, I am a second note"], "tags": ["attn", "project:yo"], "revision": 468328}, // Wed Jul 20 2011 08:09:15 GMT+0100 (BST)
	{"created": "20110719222746", "fields": {"_hash": "da39a3ee5e6b4b0d3255bfef95601890afd80709"}, "creator": "jnthnlstr", "recipe": null, "modified": "20110719222746", "bag": "attn_jnthnlstr_20110719", "title": "1311114416971", "permissions": ["read", "write", "create", "delete"], "modifier": "jnthnlstr", "type": null, "tags": ["attn", "project:yo"], "revision": 467516}]; // Tue Jul 19 2011 23:26:56 GMT+0100 (BST)

/* these have earliest first instead of most recent
attnTestTiddlers = [
	{ title:"1309282706730", tags: ["attn"] },
	{ title:"1309353942863", tags: ["project:bpsf","attn"] },
	{ title:"1309360508228", tags: ["attn"] },
	{ title:"1309360650338", tags: ["project:homemade","attn"] },
	{ title:"1309362563023", tags: ["attn"] },
	{ title:"1309362568783", tags: ["attn"] },
	{ title:"1309362722359", tags: ["project:woe","attn"] },
	{ title:"1309363200838", tags: ["project:bpsf","attn"] },
	{ title:"1309372194138", tags: ["attn"] },
	{ title:"1309433612219", tags: ["project:woe","attn"] },
	{ title:"1309434636447", tags: ["attn"] },
	{ title:"1309439740220", tags: ["project:bpsf","attn"] },
	{ title:"1309443763215", tags: ["attn"] },
	{ title:"1309446425179", tags: ["project:ambit","attn"] },
	{ title:"1309450375730", tags: ["project:bpsf","attn"] },
	{ title:"1309516836389", tags: ["project:bpsf","attn"] },
	{ title:"1309517905177", tags: ["attn"] },
	{ title:"1309518318527", tags: ["project:bpsf","attn"] },
	{ title:"1309521600000", tags: ["project:homemade","attn"] },
	{ title:"1309524540084", tags: ["project:bpsf","attn"] },
	{ title:"1309527273193", tags: ["attn"] },
	{ title:"1309528248843", tags: ["project:bpsf","attn"] },
	{ title:"1309535169424", tags: ["attn"] },
	{ title:"1309617662760", tags: ["project:j&j","attn"] },
	{ title:"1309626144765", tags: ["attn"] },
	{ title:"1309766998029", tags: ["project:c4change","attn"] },
	{ title:"1309769753998", tags: ["attn"] },
	{ title:"1309781401897", tags: ["project:bpsf","attn"] },
	{ title:"1309791366994", tags: ["attn"] },
	{ title:"1309795934099", tags: ["project:j&j","attn"] },
	{ title:"1309801396887", tags: ["attn"] },
	{ title:"1309805345952", tags: ["project:j&j","attn"] },
	{ title:"1309813368020", tags: ["attn"] },
	{ title:"1309854742783", tags: ["project:bpsf","attn"] },
	{ title:"1309861800000", tags: ["attn"] },
	{ title:"1309868400000", tags: ["project:planetphoto","attn"] },
	{ title:"1309872300000", tags: ["attn"] },
	{ title:"1309879799026", tags: ["project:sweetspot","attn"] },
	{ title:"1309888217522", tags: ["attn"] },
	{ title:"1309888591499", tags: ["project:sweetspot","attn"] },
	{ title:"1309949669261", tags: ["project:j&j","attn"] },
	{ title:"1309959900000", tags: ["attn"] },
	{ title:"1309969078562", tags: ["project:j&j","attn"] },
	{ title:"1309970433747", tags: ["project:homemade","attn"] },
	{ title:"1309973808301", tags: ["project:j&j","attn"] },
	{ title:"1309986404620", tags: ["attn"] },
	{ title:"1310038476213", tags: ["project:planetphoto","attn"] },
	{ title:"1310039775849", tags: ["attn"] },
	{ title:"1310040410049", tags: ["project:ambit","attn"] },
	{ title:"1310042048695", tags: ["attn"] },
	{ title:"1310045762661", tags: ["project:bpsf","attn"] },
	{ title:"1310047413286", tags: ["attn"] },
	{ title:"1310057270709", tags: ["project:avox","attn"] },
	{ title:"1310119800000", tags: ["project:ilga","attn"] },
	{ title:"1310124600000", tags: ["attn"] },
	{ title:"1310128033365", tags: ["project:j&j","attn"] },
	{ title:"1310129001242", tags: ["project:ilga","attn"] },
	{ title:"1310130406477", tags: ["attn"] },
	{ title:"1310133321253", tags: ["project:j&j","attn"] },
	{ title:"1310136564043", tags: ["attn"] },
	{ title:"1310137500000", tags: ["project:j&j","attn"] },
	{ title:"1310147914262", tags: ["attn"] },
	{ title:"1310293628869", tags: ["project:j&j","attn"] },
	{ title:"1310295180390", tags: ["attn"] },
	{ title:"1310316945298", tags: ["project:j&j","attn"] },
	{ title:"1310321141563", tags: ["attn"] },
	{ title:"1310373790398", tags: ["project:j&j","attn"] },
	{ title:"1310377363844", tags: ["project:planetphoto","attn"] },
	{ title:"1310379000000", tags: ["project:j&j","attn"] },
	{ title:"1310386073132", tags: ["attn"] },
	{ title:"1310388496391", tags: ["project:planetphoto","attn"] },
	{ title:"1310389645954", tags: ["attn"] },
	{ title:"1310394290757", tags: ["project:planetphoto","attn"] },
	{ title:"1310395421921", tags: ["attn"] },
	{ title:"1310396030186", tags: ["project:planetphoto","attn"] },
	{ title:"1310404223257", tags: ["project:bpsf","attn"] },
	{ title:"1310404800000", tags: ["attn"] },
	{ title:"1310456185741", tags: ["project:planetphoto","attn"] },
	{ title:"1310471277695", tags: ["project:bpsf","attn"] },
	{ title:"1310479624917", tags: ["attn"] },
	{ title:"1310488254000", tags: ["project:j&j","attn"] },
	{ title:"1310495454000", tags: ["attn"] },
	{ title:"1310538045132", tags: ["project:j&j","attn"] },
	{ title:"1310539500000", tags: ["attn"] },
	{ title:"1310551706843", tags: ["project:bpsf","attn"] },
	{ title:"1310552610614", tags: ["attn"] },
	{ title:"1310640863501", tags: ["project:ilga","attn"] },
	{ title:"1310642738863", tags: ["project:planetphoto","attn"] },
	{ title:"1310645571332", tags: ["project:bpsf","attn"] },
	{ title:"1310647792500", tags: ["attn"] },
	{ title:"1310722528739", tags: ["project:bpsf","attn"] },
	{ title:"1310728289342", tags: ["attn"] },
	{ title:"1310742457533", tags: ["project:attn","attn"] },
	{ title:"1310750460783", tags: ["attn"] },
	{ title:"1310750840143", tags: ["project:planetphoto","attn"] },
	{ title:"1310753390000", tags: ["attn"] },
	{ title:"1311000807549", tags: ["project:attn","attn"] },
	{ title:"1311013170764", tags: ["attn"] },
	{ title:"1311019386428", tags: ["project:attn","attn"] },
	{ title:"1311022861575", tags: ["attn"] },
	{ title:"1311024168987", tags: ["project:attn","attn"] },
	{ title:"1311026533840", tags: ["attn"] },
	{ title:"1311070555978", tags: ["project:planetphotos","attn"] },
	{ title:"1311071861461", tags: ["project:sweetspot","attn"] },
	{ title:"1311072865330", tags: ["project:sos","attn"] },
	{ title:"1311075600000", tags: ["project:homemade","attn"] },
	{ title:"1311076916374", tags: ["project:ilga","attn"] },
	{ title:"1311081920599", tags: ["attn"] },
	{ title:"1311087128991", tags: ["project:kmm","attn"] },
	{ title:"1311087629010", tags: ["attn"] },
	{ title:"1311087723702", tags: ["project:ilga","attn"] },
	{ title:"1311088917766", tags: ["project:attn","attn"] },
	{ title:"1311097025071", tags: ["attn"] },
	{ title:"1311100136573", tags: ["project:attn","attn"] },
	{ title:"1311103496522", tags: ["attn"] },
	{ title:"1311111336756", tags: ["project:attn","attn"] },
	{ title:"1311114673462", tags: ["attn"] },
	{ title:"1311145200000", tags: ["project:attn","attn"] },
	{ title:"1311146700000", tags: ["attn"] },
	{ title:"1311153107141", tags: ["project:sweetspot","attn"] },
	{ title:"1311153876575", tags: ["project:attn","attn"] },
	{ title:"1311167894353", tags: ["attn"] }
];
*/