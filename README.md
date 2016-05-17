# machinegun [![NPM version](https://badge.fury.io/js/machinegun.svg)](https://badge.fury.io/js/machinegun)

Async task runner with controlled parallelism and an angry cat.

## Installation

`npm install machinegun`

## Basic usage example

### Initialization

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
  // Hook to machinegun events in order to react to state changes
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

## Reference

### Initialization

Module exports a function returning an object. Hence all the below invocation patterns are valid and would produce the same result:

```javascript
var mg = require('machinegun')(opt);
```
```javascript
var Machinegun = require('machinegun');
var mg = new Machinegun(opt);
```
```javascript
var machinegun = require('machinegun');
var mg = machinegun(opt);
```

Machinegun object implements [EventEmitter](https://nodejs.org/api/events.html) interface. Please refer to the [events](#events) section below for the full list of emitted events.

### Options

#### `barrels` (int)
Number of parallel task execution conveyors. Defaults to `1` which ensures sequential execution. `0`, or any other falsy value would set unlimited parallelism.

#### `giveUpOnError` (bool)
Whether to cancel all running and scheduled tasks in case of an error. Defaults to `false`, which means all the tasks will be triggered despite of the errors.

#### `fireImmediately` (bool)
Whether to trigger first task execution immediately after it has been loaded. Defaults to `true`. If set to `false` the machinegun would not start untill `.fire()` is called.

### Methods

#### `.load()`

Accepts a function, which should either accept a callback parameter or return a promise:

```javascript
mg.load((cb) => process.nextTick(cb));
```
```javascript
mg.load(() => new Promise((resolve, reject) => process.nextTick(resolve)));
```

#### `.fire()`

Starts tasks execution in case `fireImmediately` was set to `false` or if the execution was previously paused with `.ceaseFire()`. Causes the machinegun to emit `fire` event.

#### `.ceaseFire()`

Pauses tasks execution until `.fire()` is called.

#### `.giveUp()`

Aborts execution. No tasks may be added to the machinegun after it has given up. Nor can it be re-started with `.fire()`.

### Events

#### `error`

Machinegun will emit `error` event if a task has errored. This may be emitted multiple times in case `giveUpOnError` was set to `false`.
```javascript
mg.on('error', (err) => console.log("Task errored", err));
```

#### `giveUp`

Machinegun will emit `giveUp` event if a task has errored and `giveUpOnError` was set to `true`, or when `.giveUp()` method was invoked explicitly.
It is not possible to load more tasks after the machinegun has given up.
```javascript
mg.on('giveUp', () => console.log("White flags up!"));
```

#### `empty`

Machinegun will emit `empty` after the last task in the magazine has completed.
This will not be emitted if `giveUpOnError` was set to `true` and there was an error.
However, if `giveUpOnError` was set to `false`, it will be emitted even if some tasks have errored.
Please note that it is possible to load in more tasks after the magazine has emptied, hence this event may be emitted multiple times.
```javascript
mg.on('empty', () => console.log("Magazine empty!"));
```

#### `fire` and `ceaseFire`

Machinegun will emit `fire` and `ceaseFire` events when respective methods are invoked
```javascript
mg.on('fire', () => console.log("Fire opened"));
mg.on('ceaseFire', () => console.log("Fire ceased"));
```

#### Tasks synchronisation

Since one task may error while the other one is still running, as well as to support `.ceaseFire()`/`.fire()` methods, it is advisable to subscribe to some events within the task function:
```javascript
mg.load((cb) => {
  var foo = somethingAsynchronous((err) => cb(err));
  mg.on('ceaseFire', foo.pause);
  mg.on('fire', foo.resume);
  mg.on('giveUp', foo.abort);
});
```

## LICENSE

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

## The angry cat

![Machine gun](https://media.giphy.com/media/f2fVSJWddYb6g/giphy.gif)