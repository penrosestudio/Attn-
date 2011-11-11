// TO-DO: add tests for loading indicator when syncing, with success or fail indicator
// TO-DO: fix test "it should attempt a sync if the notes box is blurred"
// TO-DO: make sure that the storing of the note for comparison when box is blurred is working, as it doesn't look to be (despite tests passing)
// TO-DO: add tests for not clearing notes box until the attn is changed; and don't save a new attn event if the attn doesn't change but you hit enter in the attn box (this is so you can go back to editing the same event)

window.testing_mode = true;
jQuery.fx.off = true;

$(document).ready(function() {

	/*******
	
	Setup
	
	*******/
	module("setup");
	
	test("it should check status on load", function() {
		var tmp = attn.checkStatus;
		attn.checkStatus = function() {
			attn.checkStatus = tmp;
			ok(1);
		};
		expect(1);
		load();
	});
	
	/*******
	
	Attn box
	
	*******/
	module("attn box", {
		setup: function() {
			$('#attn').attn();
		}
	});
	
	test("it should sync if the enter key is pressed while in the attn box", function() {
		var e = $.Event("keyup"),
			tmp = attn.saveEvent;
		e.keyCode = 13;
		attn.saveEvent = function() {
			attn.saveEvent = tmp;
			ok(1);
		};
		expect(1);
		$('#attn').val("hello")
			.trigger(e);
	});
	test("it should not sync if there is no text in the attn box", function() {
		var e = $.Event("keyup"),
			tmp = attn.saveEvent;
		e.keyCode = 13;
		attn.saveEvent = function() {
			attn.saveEvent = tmp; // in case it does sync
			ok(1);
		};
		$(document).bind("AttnEventPending", function() {
			$(document).unbind("AttnEventPending");
			attn.saveEvent = tmp;
		});
		expect(0);
		$('#attn').val("")
			.trigger(e);
	});
	test("it should select all the text when you focus on the attn box", function() {
		var $attn = $('#attn'),
			selectedText,
			active;
		$attn.val('hello').focus().click();
		active = document.activeElement;
		if('selectionStart' in active) {
			selectedText = $(active).val().substring(active.selectionStart,active.selectionEnd);
		} else { // IE < 9
			selectedText = active.createRange().text;	
		}
		equals(selectedText, "hello");
	});
	
	/*******
	
	Notes
	
	*******/
	module("notes", {
		setup: function() {
			$('#attn').attn();
		}
	});
	
	test("the notes box should open and be focussed if a successful sync is triggered from the attn box", function() {
		var tmp = $.ajax,
			e = $.Event("keyup");
		e.keyCode = 13;
		$.ajax = function(options) {
			options.success();
		};
		ok(!$('#notes').is(":visible"));
		$('#attn').val("hello")
			.trigger(e);
		ok($('#notes').is(":visible"));
		ok($('#notes').is(":focus"));
		$.ajax = tmp;
	});
	test("the notes box should not open when someone switches 'off'", function() {
		var tmp = $.ajax,
			e = $.Event("keyup");
		e.keyCode = 13;
		$.ajax = function(options) {
			options.success();
		};
		ok(!$('#notes').is(":visible"));
		$('#attn').val("off")
			.trigger(e);
		ok(!$('#notes').is(":visible"));
		$.ajax = tmp;		
	});
	test("the notes box should be hidden and cleared if the attn field is clicked on", function() {
		var tmp = $.ajax,
			e = $.Event("keyup");
		e.keyCode = 13;
		$.ajax = function(options) {
			options.success();
		};
		ok(!$('#notes').is(":visible"));
		$('#attn').val("hello")
			.trigger(e);
		ok($('#notes').is(":visible"));
		// from here is relevant to this test
		$('#notes').focus()
			.text("notes")
			.blur();
		$('#attn').focus().click();
		ok(!$('#notes').is(":visible"));
		ok(!$('#notes').val());
		$.ajax = tmp;
	});
	asyncTest("it should attempt a sync if the notes box is blurred and the note has changed", function() {
		var tmp = attn.saveNotes,
			e = $.Event("keyup");
		e.keyCode = 65; // a
		attn.saveNotes = function() {
			ok(1);
			attn.saveNotes = tmp;
			start();
		};
		$('#notes').show().val("a").trigger(e).blur();
		expect(1);
	});
	asyncTest("it should trigger a sync if there is a pause of two seconds after typing in the notes box", function() {
		var e = $.Event("keyup"),
			tmp = attn.saveNotes;
		e.keyCode = 65; // a
		attn.saveNotes = function() {
			ok(1);
			attn.saveNotes = tmp;
			start();
		};
		$('#notes').show()
			.val('a')
			.trigger(e);
		expect(1);
	});
});
