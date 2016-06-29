# SafeObject.js [![Build Status](https://travis-ci.org/Kelgors/SafeObject.js.svg?branch=master)](https://travis-ci.org/Kelgors/SafeObject.js)

SafeObject is a class to manage your instance properties. When the object is constructed, SafeObject initialize all registered properties to null.

### How-To

```bash
npm install SafeObject.js
bower install SafeObject.js
```

#### Inherit/Include SafeObject

First, you need to include or extend your class/function with SafeObject (Notice the constructor property is __required__)

```javascript
// Inheritance
function View() {
  SafeObject.call(this);
  this.el = document.createElement('div');
}
View.prototype = Object.create(SafeObject.prototype, {
  constructor: {
    value: View,
    enumerable: false
  }
});
```

```javascript
// Inclusion
function View(options) {
  Backbone.View.call(this, options);
  SafeObject.include(this);
}

View.prototype = Object.create(Backbone.View.prototype, {
  constructor: {
    value: View,
    enumerable: false
  }
});

```

#### Define instance properties

In all cases, you can define instance properties with several ways. The SafeObject.PropertyDescriptor is the same as native property descriptor:
```javascript
{
  value: any,
  enumerable: boolean,
  writable: boolean,
  configurable: boolean
}
```

When you write a property descriptor with mutable objects like {} or [] or Date, you should use a function wrapper. If you dont, you'll define the same mutable object in all instances of this object.

The new thing here is the last argument:
```javascript
// by default, this is a factory
new PropertyDescriptor(function () {return [];})
// but if you won't, you must give the last argument (isFactory) explicitly to false
new PropertyDescriptor(function () {return this.data.map(function (id) { return d.id; }); }, true, true, true, false);
```

```javascript
View.INSTANCE_PROPERTIES = [
  // will be initialize to (value: null, enumerable: true, writable: true, configurable: true, factory: false)
  'request',
  // will be initialize to (value: false, enumerable: true, writable: true, configurable: true, factory: false)
  [ 'isRendered', false ],
  // will be initialize to (value: '', enumerable: false, writable: true, configurable: false, factory: false)
  [ 'text', new SafeObject.PropertyDescriptor('', false, true, false) ],
  // will be initialize to (value: function, enumerable: true, writable: true, configurable: true, factory: true)
  [ 'childViews', function () {return [];} ],
  [ '_isRequired', true ],
  // will be initialize to (value: function, enumerable: false, writable: true, configurable: false, factory: false)
  [ 'isRequired', new SafeObject.PropertyDescriptor(function () {return this._isRequired;}, false, true, false, false) ],
  // examples for ES6 users
  [ 'childViews', () => [] ],
  [ 'isRequired', new SafeObject.PropertyDescriptor(() => this._isRequired, true, true, true, false) ]
];
```

Now your instance should look like this:

```javascript
var view = new View();
view.request === null;
view.isRendered === false;
view.text === '';
Array.isArray(view.childViews) && view.childViews.length === 0;
view._isRequired === true;
view.isRequired() === true;
```

And when you dont need it anymore, calling destroy method will set all registered fields to null

```javascript
view.destroy();
// all fields will be equal to null
view.request === null;
view.isRendered === null;
view.text === null;
view.childViews === null;
view._isRequired === null;
view.isRequired === null;
```
