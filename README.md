# machinegun [![NPM version](https://badge.fury.io/js/machinegun.svg)](https://badge.fury.io/js/machinegun)

`machinegun` runs asynchronous tasks sequentially or in parallel.

## Installation

`npm install machinegun`

## Basic usage example

### Initialisation

```javascript
// Require the class
var Machinegun = require('machinegun');

// Create an instance
var mg = new Machinegun({
  barrels: 1, // Number of parallel tasks, 1 => sequential execution
  giveUpOnError: false, // Cancel all the tasks if one fails?
  fireImmediately: true // Trigger the first task immediately after loading?
});
```

### Loading tasks

```javascript
for (var i = 0; i < 10; ++i)
  // A function passed to .load() should either take a callback or return a promise
  // It will be triggered by machinegun when it's time to fire this task
  mg.load((cb) => {
    // The task function should perform some asynchronous operation
    var foo = somethingAsynchronous((err) => {
      if (err) console.log("I'm errored");
      else console.log("I'm succeeded");
      // When the operation complete, a callback should be called
      cb(err);
    });
    // You'd need to hook to some events in order to support machinegun state changes
    // while the asynchronous operation is still in progress
    mg.on('ceaseFire', foo.pause);
    mg.on('fire', foo.resume);
    mg.on('giveUp', foo.abort);
  });
```

### Flow management

```javascript
// In case the machinegun was set with fireImmediately == false,
// it will need to be started manually
mg.fire()

// Call .ceaseFire() in order to pause the machinegun
someExternalTrigger.on('pause', () => mg.ceaseFire());
// ... and .fire() to start it again
someExternalTrigger.on('resume', () => mg.fire());

// If you want to abort the execution completely, call .giveUp()
someExternalTrigger.on('abort', () => mg.giveUp());
```

### Events

```javascript
// Machinegun will emit 'error' if a task has errored
// This may be emitted multiple times if giveUpOnError == false
mg.on('error', (err) => console.log("Task errored", err));

// Machinegun will emit 'giveUp' if a task has errored and giveUpOnError == true
// or .giveUp() method was invoked explicitly
mg.on('giveUp', () => console.log("White flags up!"));

// Machinegun will emit 'empty' after the last task in the magazine has completed
// This will not be emitted if giveUpOnError == true and there was an error
// But if giveUpOnError == false, it will be emitted despite of the error!
mg.on('empty', () => console.log("Magazine empty!"));

// Machinegun will emit 'fire' and 'ceaseFire' when respective methods are invoked
mg.on('fire', () => console.log("Fire opened"));
mg.on('ceaseFire', () => console.log("Fire ceased"));
```

## LICENSE

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

## Selfie

![Machine gun](https://media.giphy.com/media/f2fVSJWddYb6g/giphy.gif)