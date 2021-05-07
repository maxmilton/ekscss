// class Foo{}

// SHOULD BE TRUE
// console.log(isObject({}));
// console.log(isObject(Object.create({})));
// console.log(isObject(Object.create(Object.prototype)));
// console.log(isObject(Object.create(null)));
// console.log(isObject({}));
// console.log(isObject(new Foo));

// SHOULD BE FALSE
// console.log(isObject(/foo/)); // why ref had in true?
// console.log(isObject());
// console.log(isObject(function () {}));
// console.log(isObject(1));
// console.log(isObject([]));
// console.log(isObject(undefined));
// console.log(isObject(null));
