# machinegun [![NPM version](https://badge.fury.io/js/machinegun.svg)](https://badge.fury.io/js/machinegun)

`machinegun` runs asynchronous tasks sequentially or in parallel.

## Installation

`npm install machinegun`

## Usage

```javascript
var machinegun = require('machinegun');

var mg = machinegun({
	barrels: 1,
	giveUpOnError: false,
	fireImmediately: true,
	fireAsynchronously: true
});

for (var i = 0; i < 10; ++i) {
	mg.load((cb) => {
		var foo = somethingAsynchronous((err) => {
			if (err) console.log("I'm errored");
			else console.log("I'm succeeded");
			cb(err);
		});
		mg.on('ceaseFire', foo.pause);
		mg.on('resumeFire', foo.resume);
		mg.on('giveUp', foo.abort);
	}, i);
}

// Events

mg.on('error', (err, context) => {
	console.log("Task " + context + " errored", err);
});

mg.on('giveUp', () => {
	console.log("White flags up!");
});

mg.on('empty', () => {
	console.log("Magazine empty!");
});

// Flow management

someExternalTrigger.on('pause', mg.ceaseFire.bind(mg));
someExternalTrigger.on('resume', mg.resumeFire.bind(mg));
someExternalTrigger.on('abort', mg.giveUp.bind(mg));
```

## LICENSE

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

![Machine gun](https://media.giphy.com/media/f2fVSJWddYb6g/giphy.gif)
