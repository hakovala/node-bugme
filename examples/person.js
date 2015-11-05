"use strict";

// Simple example class
function Person(name, surname) {
	this.name = name;
	this.surname = surname;
}
module.exports = Person;

Person.say = function(name) {
	console.log('Hello, ' + name + '!');
};

Person.prototype.fullname = function() {
	return this.name + ' ' + this.surname;
};

Person.prototype.say = function(simple) {
	Person.say(simple ? this.name : this.fullname());
};
