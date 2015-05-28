"use strict";

var util = require('util');
var Bugme = module.exports = {};

// create cache name
function cacheName(name) {
	return '___bugme_' + name;
}

/**
 * Create wrapper method for tracking method calls.
 * Prints entry and leave messages and method run time.
 */
function newTrackMethod(obj, name, cached) {
	return function() {
		var time = +new Date();
		console.log(util.format(" * [ENTER] '%s.%s'", obj.constructor.name, name));
		var ret = this[cached].apply(this, arguments);
		var elapsed = +new Date() - time;
		console.log(util.format(" * [LEAVE] '%s.%s' (%d ms)", obj.constructor.name, name, elapsed));
		return ret;
	};
}

/**
 * Wrap all object functions with tracker methods.
 */
Bugme.track = function(obj) {
	if (typeof obj === 'function') {
		obj = obj.prototype;
	}

	for (var prop in obj) {
		var cache = cacheName(prop);

		if (typeof obj[prop] === 'function') {
			obj[cache] = obj[prop];
			obj[prop] = newTrackMethod(obj, prop, cache);
		}
	}
};

/**
 * Remove all tracker methods from object.
 * Restoring orginal methods.
 */
Bugme.untrack = function(obj) {
	if (typeof obj === 'function') {
		obj = obj.prototype;
	}

	for (var prop in obj) {
		var cache = cacheName(prop);

		if (obj[cache] && typeof obj[prop] === 'function') {
			obj[prop] = obj[cache];
			obj[cache] = undefined;
			delete obj[cache];
		}
	}
};

/**
 * Dump object to stdout
 */
Bugme.dump = function(obj, depth) {
	console.log(util.inspect(obj, { showHidden: true, colors: true, depth: depth}));
};
