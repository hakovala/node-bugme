"use strict";

var bugme = require('..');
var Person = require('./person');

// instrument static methods in Person
bugme.track(Person);
// instrument prototype methods in Person
bugme.track(Person.prototype);

// create Person instance
var person = new Person('John', 'Doe');
// trigger 'say' method to get call trace
person.say();

// remove instrumentation
bugme.untrack(Person);
bugme.untrack(Person.prototype);

// create Alice and Bob
var alice = new Person('Alice', 'Doe');
var bob = new Person('Bob', 'Doe');

// intrument only Bob
bugme.track(bob);

alice.say();
bob.say();

