var	chai = require('chai'),
    expect = chai.expect,
	sequencer   = require("chai-sequencer"),
	EventEmitter = require('events'),
    machinegun = require('../index.js');

chai.use(sequencer);

describe('machinegun', function () {
	it("should run tasks sequentially by default", function(done) {
		var mg = machinegun();
		[1,2,3].forEach(function (i) {
			mg.load(function (cb) {
				mg.emit('start-' + i);
				process.nextTick(function () {
					mg.emit('finish-' + i);
					cb();
				});
			});
		});

		mg.on('empty', function () {
			expect(mg).to
				.emit('start-1')
				.next('finish-1')
				.next('start-2')
				.next('finish-2')
				.next('start-3')
				.next('finish-3')
				.last('empty');
			done();
		});
	});

	it("should run tasks in parallel if asked to", function(done) {
		var mg = machinegun({barrels: 2});
		[1,2,3].forEach(function (i) {
			mg.load(function (cb) {
				mg.emit('start-' + i);
				process.nextTick(function () {
					mg.emit('finish-' + i);
					cb();
				});
			});
		});
		mg.on('empty', function () {
			expect(mg).to
				.emit('start-1')
				.next('start-2');
			done();
		});
	});

	it("should fail on error if 'giveUpOnError' is truthy", function(done) {
		var mg = machinegun({giveUpOnError: true});
		mg.load(function (cb) {
			cb('error');
		});
		mg.on('giveUp', (value) => {
			expect(value).to.equal('error');
			done();
		});
	});

	it("should cease fire after emptying if 'ceaseOnEmpty' is truthy", function(done) {
		var mg = machinegun({ceaseOnEmpty: true});
		mg.load(function (cb) {
			cb();
		});
		mg.on('ceaseFire', function () {
			expect(mg).to
				.emit('empty')
				.next('ceaseFire');
			done();
		});
	});

	it("should accept a promise instead of a callback", function(done) {
		var mg = machinegun();
		mg.load(function () {
			return Promise.resolve();
		});
		mg.on('empty', done);
	});

	it("should emit an error if a promise rejects", function(done) {
		var mg = machinegun();
		mg.load(function () {
			return Promise.reject('error');
		});
		mg.on('error', (value) => {
			expect(value).to.equal('error');
			done();
		});
	});

	it("should give up if a promise rejects", function(done) {
		var mg = machinegun({giveupOnError: true});
		mg.load(function () {
			return Promise.reject('error');
		});
		mg.on('giveUp', (value) => {
			expect(value).to.equal('error');
			done();
		});
	});

	it("should not start firing if 'fireImmediately' is set to false", function(done) {
		var mg = machinegun({fireImmediately: false});
		mg.load(function (cb) {
			mg.emit('start');
			process.nextTick(function () {
				mg.emit('finish');
				cb();
			});
		});
		process.nextTick(function () {
			mg.emit('initialised');
			mg.fire();
		});
		mg.on('empty', function () {
			expect(mg).to
				.emit('initialised')
				.next('fire')
				.next('start')
				.next('finish')
				.last('empty');
			done();
		});
	});

	it("should return a promise, which resolves on success", function(done) {
		var mg = machinegun();
		mg.load(function () {
			return Promise.resolve();
		});
		mg.promise('success').then((value) => {
			expect(value).to.equal('success');
			done();
		});
	});

	it("should return a promise, which rejects on failure", function(done) {
		var mg = machinegun({giveupOnError: true});
		mg.load(function () {
			return Promise.reject('error');
		});
		mg.promise().catch((value) => {
			expect(value).to.equal('error');
			done();
		});
	});
});