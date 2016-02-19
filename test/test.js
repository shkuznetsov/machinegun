var	chai = require('chai'),
    expect = chai.expect,
    machinegun = require('../index.js');

describe('machinegun', function () {
	it("should run tasks sequentially by default", function(done) {
		var mg = machinegun(), res = [];
		[1,2,3].forEach(function (i) {
			mg.load(function (cb) {
				res.push('start-' + i);
				process.nextTick(function () {
					res.push('finish-' + i);
					cb();
				});
			});
		});
		mg.on('empty', function () {
			expect(res).to.eql(['start-1','finish-1','start-2','finish-2','start-3','finish-3']);
			done();
		});
	});

	it("should run tasks in parallel if asked to", function(done) {
		var mg = machinegun({barrels: 2}), res = [];
		[1,2,3].forEach(function (i) {
			mg.load(function (cb) {
				res.push('start-' + i);
				process.nextTick(function () {
					res.push('finish-' + i);
					cb();
				});
			});
		});
		mg.on('empty', function () {
			expect(res).to.eql(['start-1','start-2','finish-1','finish-2','start-3','finish-3']);
			done();
		});
	});

	it("should accept a promise instead of a callback", function(done) {
		var mg = machinegun(), res = [];
		[1,2,3].forEach(function (i) {
			mg.load(function () {
				res.push('start-' + i);
				return new Promise(function (resolve, reject) {
					process.nextTick(function () {
						res.push('finish-' + i);
						resolve();
					});
				});
			});
		});
		mg.on('empty', function () {
			expect(res).to.eql(['start-1','finish-1','start-2','finish-2','start-3','finish-3']);
			done();
		});
	});
});
