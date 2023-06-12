const assert = require('node:assert/strict');
const { getLogFilter } = require('../../dist/getLogFilter');

describe.only('getLogFilter', () => {
	it('does not filter when there are no filters', () => {
		const filter = getLogFilter([]);
		assert.equal(filter({ code: 'FIRST' }), true);
	});

	it('filters for string matches', () => {
		const filter = getLogFilter(['code:FIRST']);
		assert.equal(filter({ code: 'FIRST' }), true);
		assert.equal(filter({ code: 'SECOND' }), false);
		assert.equal(filter({ message: 'no code' }), false);
	});

	it('combines multiple filters with "or"', () => {
		const filter = getLogFilter(['code:FIRST', 'message:second']);
		assert.equal(filter({ code: 'FIRST', message: 'first' }), true);
		assert.equal(filter({ code: 'SECOND', message: 'first' }), false);
		assert.equal(filter({ code: 'FIRST', message: 'second' }), true);
		assert.equal(filter({ code: 'SECOND', message: 'second' }), true);
	});

	it('supports placeholders', () => {
		const filter = getLogFilter(['code:*A', 'code:B*', 'code:*C*', 'code:D*E*F']);
		assert.equal(filter({ code: 'xxA' }), true, 'xxA');
		assert.equal(filter({ code: 'xxB' }), false, 'xxB');
		assert.equal(filter({ code: 'Axx' }), false, 'Axx');
		assert.equal(filter({ code: 'Bxx' }), true, 'Bxx');
		assert.equal(filter({ code: 'C' }), true, 'C');
		assert.equal(filter({ code: 'xxCxx' }), true, 'xxCxx');
		assert.equal(filter({ code: 'DxxExxF' }), true, 'DxxExxF');
	});

	it('supports inverted filters', () => {
		const filter = getLogFilter(['!code:FIRST']);
		assert.equal(filter({ code: 'FIRST' }), false);
		assert.equal(filter({ code: 'SECOND' }), true);
	});

	it('supports AND conditions', () => {
		const filter = getLogFilter(['code:FIRST&plugin:my-plugin']);
		assert.equal(filter({ code: 'FIRST', plugin: 'my-plugin' }), true);
		assert.equal(filter({ code: 'FIRST', plugin: 'other-plugin' }), false);
		assert.equal(filter({ code: 'SECOND', plugin: 'my-plugin' }), false);
	});

	it('handles numbers and objects', () => {
		const filter = getLogFilter(['foo:1', 'bar:*2*', 'baz:{"a":1}', 'baz:{"b":1,*}']);
		assert.equal(filter({ foo: 1 }), true, 'foo:1');
		assert.equal(filter({ foo: 10 }), false, 'foo:10');
		assert.equal(filter({ bar: 123 }), true, 'bar:123');
		assert.equal(filter({ bar: 13 }), false, 'bar:13');
		assert.equal(filter({ baz: { a: 1 } }), true, 'baz:{"a":1}');
		assert.equal(filter({ baz: { a: 1, b: 2 } }), false, 'baz:{"a":1,"b":2}');
		assert.equal(filter({ baz: { b: 1, c: 2 } }), true, 'baz:{"b":1,"c":2}');
	});

	// it('handles edge case filters', () => {
	// 	const filter = getLogFilter([
	// 		':A', // property is "empty string"
	// 		'a:', // value is "empty string"
	// 		'', // property and value are "empty string"
	// 		'code:A&', // property and value are "empty string",
	// 		'foo:bar:baz' // second colon is treated literally
	// 	]);
	// });

	// TODO Lukas filter in watch mode, nested properties, handle edge cases: empty string, no colon, extra colon on right side, unexpected &
});
