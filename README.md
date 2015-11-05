# Bugme

Helper module for tracing object method calls.

## Install

```
npm install bugme
```

## Usage

With `bugme` you can trace method calls inside an object. Debugging what methods were called,
how long method execution took, see arguments passed to the method and what method returned.

Bugme caches original methods in same object with `___bugme_` prefix.
If same object is instrumented multiple times, also those methods are isntrumented.

NOTE: Instrumented methods signature is `function()`, because of that callers that check
`Function.length` won't work corretly.

Example module used in following examples, `examples/person.js`:

```javascript
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
```

### Simple example

`examples/simple.js`:
```javascript
var bugme = require('bugme');
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
```

Output:
```
--> Person.say
 --> Person.fullname
 <-- Person.fullname(1 ms)
 --> Function.say
Hello, John Doe!
 <-- Function.say(0 ms)
 <-- Person.say(3 ms)
Hello, Alice Doe!
 --> Person.say
 --> Person.fullname
 <-- Person.fullname(0 ms)
Hello, Bob Doe!
 <-- Person.say(0 ms)
```

## Using tracking options

`examples/advanced.js`:
```javascript
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
```

Output:
```
 --> Person.alice.say([ true ])                                                                                                                                              
Hello, Alice!                                                                                                                                                                
 <-- Person.alice.say(3 ms) => undefined                                                                                                                                     
 --> Object.say([])                                                                                                                                                          
 --> Person.alice.say([])
 --> Person.alice.fullname([])
 <-- Person.alice.fullname(0 ms) => 'Alice Doe'
Hello, Alice Doe!
 <-- Person.alice.say(1 ms) => undefined
 --> Person.bob.say([])
 --> Person.bob.fullname([])
 <-- Person.bob.fullname(0 ms) => 'Bob Doe'
Hello, Bob Doe!
 <-- Person.bob.say(0 ms) => undefined
 <-- Object.say(1 ms) => undefined
```

## Methods

### Bugme.track(obj, options, parent)

Instrument objects methods.

 * `obj`: object to instrument
 * `options`: instrumentation options
   - `recursive`: instrument methods recursively (default: `false`)
   - `colors`: use colors when printing to terminal (default: `false`)
   - `showArguments`: print method arguments (default: `false`)
   - `showReturn`: print method return values (default: `false`)
   - `include`: only include matching methods, can be string, regexp or array of those two
   - `exclude`: exclude matching methods, can be string, regexp or array of those two
 * `parent`: parent objects name to include in method call name

### Bugme.untrack(obj)

Remove instrumentation from object.

### Bugme.dump(obj, depth)

Alias for:
```javascript
console.log(util.inspect(obj, { showHidden: true, colors: true, depth: depth }));
```

## Global options

### Bugme.inspectArgument(args, options)

Method to use for formatting method arguments.
Defaults to `util.inspect`

### Bugme.inspectReturn(ret, options)

Method to use for formatting method return value.
Defaults to `util.inspect`

### Bugme.print(str)

Method used to print method traces.
Defaults to `console.log`
