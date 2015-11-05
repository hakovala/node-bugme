"use strict";

var util = require('util');
var Bugme = module.exports = {};

// create cache name
function cacheName(name) {
	return '___bugme_' + name;
}

Bugme.inspectArgument = util.inspect;
Bugme.inspectReturn = util.inspect;

/**
 * Create wrapper method for tracking method calls.
 * Prints entry and leave messages and method run time.
 */
function newTrackMethod(obj, name, cached, opt) {
	return function() {
		var args = Array.prototype.slice.call(arguments);
		var time = +new Date();

		// format method call
		var msg = ' --> ';
		msg += obj.constructor.name + '.' + name;
		if (opt.showArguments) msg += '(' + Bugme.inspectArgument(args).slice(1, -1) + ')';
		console.log(msg);

		// call tracked method
		var ret = obj[cached].apply(this, arguments);
		var elapsed = +new Date() - time;

		// format method return
		var msg = ' <-- ';
		msg += obj.constructor.name + '.' + name;
		msg += '(' + elapsed + ' ms)';
		if (opt.showReturn) msg += ' => ' + Bugme.inspectReturn(args).slice(1, -1);
		console.log(msg);

		return ret;
	};
}

/**
 * Build filter test function.
 * String or array of strings is evaluated as regexps test.
 * If filter is false then `def` value is always returned.
 * If filter is function then it's used as is.
 */
function buildFilter(filter, def) {
	if (!filter) return function() { return def; };

	if (typeof filter === 'string') {
				var re = new RegExp(filter);
				return re.test.bind(re);
	}

	if (Array.isArray(filter)) {
		var regs = filter.map(function(i) {
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
	return filter;
}

/**
 * Wrap all object functions with tracker methods.
 */
Bugme.track = function(obj, opt, parent) {
	opt = opt || {};

	var include = buildFilter(opt.include, true);
	var exclude = buildFilter(opt.exclude, false);
	var recursive = !!opt.recursive;

	var trackOpt = {
		showArguments: !!opt.showArguments,
		showReturn: !!opt.showReturn,
	};

	for (var prop in obj) {
		var name = (parent ? parent + '.' : '') + prop;
		var cache = cacheName(prop);

		if (include(prop) && !exclude(prop)) {
			if (typeof obj[prop] === 'function') {
				obj[cache] = obj[prop];
				obj[prop] = newTrackMethod(obj, name, cache, trackOpt);

				// clone cache object properties to tracker
				for (var p in obj[cache]) {
					obj[prop][p] = obj[cache][p];
				}
				if (recursive) Bugme.track(obj[prop], opt, name);
			}
			if (typeof obj[prop] === 'object') {
				if (recursive) Bugme.track(obj[prop], opt, name);
			}
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
