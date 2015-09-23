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
		var args = Array.prototype.slice.call(arguments);
		var time = +new Date();
		console.log(util.format(" => [ENTER] %s.%s %s", obj.constructor.name, name, util.inspect(args)));
		var ret = this[cached].apply(this, arguments);
		var elapsed = +new Date() - time;
		console.log(util.format(" <= [LEAVE] %s.%s (%d ms) => %s", obj.constructor.name, name, elapsed, util.inspect(ret)));
		return ret;
	};
}

/**
 * Wrap all object functions with tracker methods.
 */
Bugme.track = function(obj, opt, parent) {
	function buildFilter(list, def) {
		if (!list) return function() { return def; };

		if (typeof list === 'string') {
					var re = new RegExp(list);
					return re.test.bind(re);
		}

		if (Array.isArray(list)) {
			var regs = list.map(function(i) {
				if (typeof i === 'string')
					var re = new RegExp(i);
					return re.test.bind(re);
				return i;
			});
			return function(v) {
				return regs.some(function(e) {
					return e(v);
				});
			}
		};
		return list;
	}

	opt = opt || {};

	var include = buildFilter(opt.include, true);
	var exclude = buildFilter(opt.exclude, false);
	var recursive = !!opt.recursive;

	for (var prop in obj) {
		var name = (parent ? parent + '.' : '') + prop;
		var cache = cacheName(prop);

		if (typeof obj[prop] === 'function') {
			if (include(prop) && !exclude(prop)) {
				obj[cache] = obj[prop];
				obj[prop] = newTrackMethod(obj, name, cache);

				// clone cache object properties to tracker
				for (var p in obj[cache]) {
					obj[prop][p] = obj[cache][p];
				}
			}
			if (recursive) Bugme.track(obj[prop], opt, name);
		}
		if (typeof obj[prop] === 'object') {
			if (recursive) Bugme.track(obj[prop], opt, name);
		}
	}
};

/**
 * Remove all tracker methods from object.
 * Restoring orginal methods.
 */
Bugme.untrack = function(obj) {
	for (var prop in obj) {
		var cache = cacheName(prop);

		// untrack recursively
		if (typeof obj[prop] === 'function' || typeof obj[prop] === 'object') {
			Bugme.untrack(obj[prop]);
		}

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
