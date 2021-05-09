/* eslint-disable max-len */

// class Foo{}

// https://github.com/jonschlinkert/isobject/blob/master/test.js

// it('should be true when the value is an object.', function() {
//   assert(isObject({}));
//   assert(isObject(Object.create({})));
//   assert(isObject(Object.create(Object.prototype)));
//   assert(isObject(Object.create(null)));
//   assert(isObject(/foo/)); // <<< WTF?

//   function Foo() {}
//   assert(isObject(new Foo));
//   assert(isObject(new Foo()));
// });

// it('should be false when the value is not an object.', function() {
//   assert(!isObject('whatever'));
//   assert(!isObject(1));
//   assert(!isObject(function() {}));
//   assert(!isObject([]));
//   assert(!isObject(['foo', 'bar']));
//   assert(!isObject());
//   assert(!isObject(undefined));
//   assert(!isObject(null));
// });

// https://github.com/jonschlinkert/is-plain-object/blob/master/test/server.js

// it('should return `true` if the object is created by the `Object` constructor.', function() {
//   assert(isPlainObject(Object.create({})));
//   assert(isPlainObject(Object.create(Object.prototype)));
//   assert(isPlainObject({foo: 'bar'}));
//   assert(isPlainObject({}));
//   assert(isPlainObject(Object.create(null)));
// });

// it('should return `false` if the object is not created by the `Object` constructor.', function() {
//   function Foo() {this.abc = {};};

//   assert(!isPlainObject(/foo/));
//   assert(!isPlainObject(function() {}));
//   assert(!isPlainObject(1));
//   assert(!isPlainObject(['foo', 'bar']));
//   assert(!isPlainObject([]));
//   assert(!isPlainObject(new Foo));
//   assert(!isPlainObject(null));
// });

export {};
