"use strict";

var bugme = require('../index');
var Person = require('./person');

// create Alice and Bob and put them in object
var obj = {
	alice: new Person('Alice', 'Doe'),
	bob: new Person('Bob', 'Doe'),
	say: function() {
		this.alice.say();
		this.bob.say();
	}
};

bugme.track(obj, {
	recursive: true, // instrument methods recursively
	colors: true, // use colors in print
	showArguments: true, // print method arguments
	showReturn: true, // print method return value
});

obj.alice.say(true);
obj.say();
