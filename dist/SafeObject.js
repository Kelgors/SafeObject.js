'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (exportName) {

  function warn() {
    if (typeof console === 'undefined' || !SafeObject.debugMode) return;
    if (console.warn) console.warn.apply(console, arguments);else if (console.log) console.log.apply(console, arguments);
  }

  var _registered_constructors = [];

  var PropertyDescriptor = function () {
    function PropertyDescriptor(value, enumerable, writable, configurable, valueIsFactory) {
      _classCallCheck(this, PropertyDescriptor);

      this.enumerable = typeof enumerable === 'undefined' ? true : enumerable;
      this.writable = typeof writable === 'undefined' ? true : writable;
      this.configurable = typeof configurable === 'undefined' ? true : configurable;
      var registeredConstructor = SafeObject.getRegisteredConstructor(value);
      if (registeredConstructor) {
        this.value = registeredConstructor.construct.bind(registeredConstructor);
        this.isFactory = true;
      } else {
        this.isFactory = typeof value === 'function' && typeof valueIsFactory === 'undefined' ? true : valueIsFactory || false;
        this.value = value;
      }
    }

    _createClass(PropertyDescriptor, [{
      key: 'clone',
      value: function clone() {
        return new PropertyDescriptor(this.value, this.enumerable, this.writable, this.configurable, this.isFactory);
      }
    }, {
      key: 'toObject',
      value: function toObject() {
        return {
          value: this.isFactory ? this.value(this) : this.value,
          enumerable: this.enumerable,
          writable: this.writable,
          configurable: this.configurable
        };
      }
    }]);

    return PropertyDescriptor;
  }();

  var RegisteredConstructor = function () {
    function RegisteredConstructor(ConstructorFunction) {
      _classCallCheck(this, RegisteredConstructor);

      this.ConstructorFunction = ConstructorFunction;
    }

    _createClass(RegisteredConstructor, [{
      key: 'construct',
      value: function construct() {
        return new this.ConstructorFunction();
      }
    }]);

    return RegisteredConstructor;
  }();

  var SafeObject = function () {
    _createClass(SafeObject, null, [{
      key: 'debug',
      value: function debug(instance) {
        var buffer = [];
        buffer.push('----- SafeObject debug -----');
        buffer.push('Constructor: ' + String(instance.constructor.name));
        buffer.push('_isSafeObject: ' + String(!!instance._isSafeObject));
        if (instance._isSafeObject) {
          (function () {
            var ancestors = SafeObject.getAncestors(instance);
            buffer.push('Ancestors: ' + ancestors.map(function (d) {
              return d.name;
            }).join(' < '));
            var attributeNames = SafeObject.getRegisteredPropertyNames(instance);
            var registeredAttributeNames = instance._getIgnoredSafeObjectPropertyNames().concat(attributeNames);
            var unregisteredAttributeNames = Object.getOwnPropertyNames(instance).filter(function (d) {
              return registeredAttributeNames.indexOf(d) === -1;
            });
            buffer.push('ignored properties: ' + instance._getIgnoredSafeObjectPropertyNames().join(', '));
            buffer.push('registered properties: ' + attributeNames.join(', '));
            buffer.push('unregistered properties: ' + unregisteredAttributeNames.join(', '));
          })();
        }
        return buffer.join('\n');
      }
    }, {
      key: 'include',
      value: function include(instance) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        if (SafeObject.isSafeObject(instance)) return instance;
        if (!instance.constructor.INSTANCE_PROPERTIES) {
          instance.constructor.INSTANCE_PROPERTIES = {};
        }
        var instanceProperties = instance.constructor.INSTANCE_PROPERTIES;

        if (!('_isSafeObject' in instanceProperties)) {
          instanceProperties._isSafeObject = new PropertyDescriptor(true, false, false, false);
        }

        [{ methodName: 'destroy', returnsMerge: 'super' }, { methodName: '_getIgnoredSafeObjectPropertyNames', returnsMerge: 'concat' }].forEach(function (_ref) {
          var methodName = _ref.methodName;
          var returnsMerge = _ref.returnsMerge;

          // check if property exists and is a method
          var hasProperty = methodName in instance;
          var isFunction = typeof instance[methodName] === 'function';
          var _superMethod = instance[methodName];
          if (options.force && hasProperty) {
            warn('Overriding ' + methodName + ' method');
          }
          // define the method only if it hasnt the property or 'force' is true
          if (hasProperty && options.force || !hasProperty) {
            if (!(methodName in instanceProperties)) {
              instanceProperties[methodName] = new PropertyDescriptor(isFunction ? overrideMethod : SafeObject.prototype[methodName], false, true, true, false);
            }
          }

          function overrideMethod() {
            var superOut = _superMethod.apply(this, arguments);
            var safeObjectOut = SafeObject.prototype[methodName].call(this);
            var out = void 0;
            switch (returnsMerge) {
              case 'super':
                out = superOut;break;
              case 'concat':
                out = (superOut || []).concat(safeObjectOut || []);break;
            }
            return out;
          }
        });

        SafeObject.setProperties(instance, SafeObject.SAFE_OBJECT_INITIALIZE, Object.assign(instanceProperties, SafeObject.INSTANCE_PROPERTIES));

        return instance;
      }
    }, {
      key: 'getRegisteredConstructor',
      value: function getRegisteredConstructor(ConstructorFunction) {
        return _registered_constructors.find(function (d) {
          return d.ConstructorFunction === ConstructorFunction;
        });
      }
    }, {
      key: 'registerConstructor',
      value: function registerConstructor(ConstructorFunction) {
        _registered_constructors.push(new RegisteredConstructor(ConstructorFunction));
      }
    }, {
      key: 'unregisterConstructor',
      value: function unregisterConstructor(ConstructorFunction) {
        var index = _registered_constructors.findIndex(function (d) {
          return d.ConstructorFunction === ConstructorFunction;
        });
        return _registered_constructors.splice(index, 1)[0];
      }
    }, {
      key: 'isSafeObject',
      value: function isSafeObject(object) {
        return object && object._isSafeObject === true;
      }
    }, {
      key: 'getAncestors',
      value: function getAncestors(object) {
        var current = object.constructor;
        var out = [];
        while (current = Object.getPrototypeOf(current.prototype) ? Object.getPrototypeOf(current.prototype).constructor : null) {
          out.push(current || []);
        }
        return out;
      }
    }, {
      key: 'getRegisteredProperties',
      value: function getRegisteredProperties(safeObject) {
        var instanceProperties = [safeObject.constructor].concat(SafeObject.getAncestors(safeObject)).map(function (Constructor) {
          return Constructor.INSTANCE_PROPERTIES;
        }).reverse();
        instanceProperties.unshift({});
        return Object.assign.apply(Object, _toConsumableArray(instanceProperties));
      }
    }, {
      key: 'getUnregisteredPropertyNames',
      value: function getUnregisteredPropertyNames(safeObject) {
        var registeredAttributeNames = SafeObject.getRegisteredPropertyNames(safeObject);
        registeredAttributeNames.push.apply(registeredAttributeNames, safeObject._getIgnoredSafeObjectPropertyNames());
        return Object.getOwnPropertyNames(safeObject).filter(function (propertyName) {
          return registeredAttributeNames.indexOf(propertyName) === -1;
        });
      }
    }, {
      key: 'getRegisteredPropertyNames',
      value: function getRegisteredPropertyNames(safeObject) {
        return Object.getOwnPropertyNames(SafeObject.getRegisteredProperties(safeObject));
      }
    }, {
      key: 'setInstanceProperties',
      value: function setInstanceProperties(safeObject, state) {
        SafeObject.setProperties(safeObject, state, SafeObject.getRegisteredProperties(safeObject));
      }
    }, {
      key: 'setProperties',
      value: function setProperties(object, state, propertyDescriptors) {
        for (var propertyName in propertyDescriptors) {
          try {
            var propertyDescriptor = SafeObject.parsePropertyDescriptor(propertyDescriptors[propertyName]);
            SafeObject.setProperty(object, propertyName, propertyDescriptor, state);
          } catch (err) {
            warn('SafeObject#setProperties: ' + err.toString());
          }
        }
      }
    }, {
      key: 'setProperty',
      value: function setProperty(object, fieldName, propertyDescriptor, state) {
        if (!propertyDescriptor) {
          warn('Property descriptor isnt well formed for ' + String(fieldName) + '.');
          return;
        }
        Object.defineProperty(object, fieldName, propertyDescriptor.toObject());
      }
    }, {
      key: 'parsePropertyDescriptor',
      value: function parsePropertyDescriptor(propertyDescriptor) {
        if (!propertyDescriptor || !(propertyDescriptor instanceof PropertyDescriptor)) {
          return new PropertyDescriptor(propertyDescriptor);
        }
        return propertyDescriptor;
      }
    }]);

    function SafeObject() {
      _classCallCheck(this, SafeObject);

      SafeObject.setInstanceProperties(this, SafeObject.SAFE_OBJECT_INITIALIZE);
      this._isDestroyed = false;
    }

    _createClass(SafeObject, [{
      key: 'destroy',
      value: function destroy() {
        SafeObject.setInstanceProperties(this, SafeObject.SAFE_OBJECT_DESTROY);
        this._isDestroyed = true;
      }
    }, {
      key: '_getIgnoredSafeObjectPropertyNames',
      value: function _getIgnoredSafeObjectPropertyNames() {
        return ['_isDestroyed'];
      }
    }]);

    return SafeObject;
  }();

  SafeObject.debugMode = false;
  SafeObject.VERSION = '1.2.0';
  SafeObject.SAFE_OBJECT_INITIALIZE = 1;
  SafeObject.SAFE_OBJECT_DESTROY = 2;

  SafeObject.INSTANCE_PROPERTIES = {
    _isSafeObject: new PropertyDescriptor(true, false, false, false)
  };

  SafeObject.PropertyDescriptor = PropertyDescriptor;

  SafeObject.registerConstructor(Object);
  SafeObject.registerConstructor(Array);
  SafeObject.registerConstructor(Date);
  SafeObject.registerConstructor(Map);
  SafeObject.registerConstructor(Set);

  if (typeof define === 'function' && define.amd) {
    define(function () {
      return SafeObject;
    });
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = SafeObject;
  } else {
    this[exportName] = SafeObject;
  }
})('SafeObject');