# machinegun [![NPM version](https://badge.fury.io/js/machinegun.svg)](https://badge.fury.io/js/machinegun)

`machinegun` runs asynchronous tasks sequentially or in parallel.

## Installation

`npm install machinegun`

## Usage

```javascript
var machinegun = require('machinegun');

var mg = machinegun({
	parallel: 1,
	giveupOnError: false,
	fireImmediately: true,
	fireAsynchronously: true
});

for (var i = 0; i < 10; ++i) () => {
	var context = i;
	mg.load((cb, emitter) => {
		var foo = somethingAsynchronous((err) => {
			if (err) console.log("I'm errored");
			else console.log("I'm succeeded");
			cb(err, context);
		});
		emitter.on('ceasefire', foo.pause);
		emitter.on('fire', foo.resume);
		emitter.on('giveup', foo.abort);
	});
}();

// Events

mg.on('error', (err, context) => {
	console.log("Task " + context + " errored", err);
});

mg.on('giveup', (err) => {
	if (err) console.log("Gave up because there was an error", err);
	else console.log("Gave up because was told to");
});

mg.on('empty', () => {
	console.log("Magazine empty!");
});

// Flow management

someExternalTrigger.on('pause', mg.ceasefire.bind(mg));
someExternalTrigger.on('resume', mg.fire.bind(mg));
someExternalTrigger.on('abort', mg.giveup.bind(mg));
```

## LICENSE

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

![Machine gun](https://media.giphy.com/media/f2fVSJWddYb6g/giphy.gif)
