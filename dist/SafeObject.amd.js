define('SafeObject', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var SafeObject = function () {
    _createClass(SafeObject, null, [{
      key: 'debug',
      value: function debug(instance) {
        console.log('----- SafeObject debug -----');
        console.log('Constructor: ', instance.constructor.name);
        console.log('_isSafeObject: ' + String(instance._isSafeObject));
        if (instance._isSafeObject) {
          (function () {
            var ancestors = instance._getAncestors();
            console.log('Ancestors: ' + instance._getAncestors().map(function (d) {
              return d.name;
            }).join(' > '));
            var attributeNames = instance._getAttributes().map(function (d) {
              if (Array.isArray(d)) return d[0];
              return d;
            });
            var registeredAttributeNames = ['_isSafeObject', 'destroy', '_getAncestors', '_getAttributes', '_clearAllInstanceProperties', '_parsePropertyDescriptor'].concat(attributeNames);
            var unregisteredAttributeNames = Object.getOwnPropertyNames(instance).filter(function (d) {
              return registeredAttributeNames.indexOf(d) === -1;
            });
            console.log('registered attributes: ', attributeNames.join(', '));
            console.log('unregistered attributes: ', unregisteredAttributeNames.join(', '));
          })();
        }
      }
    }, {
      key: 'include',
      value: function include(instance) {
        if (instance._isSafeObject) return instance;

        ['destroy', '_getAncestors', '_getAttributes', '_clearAllInstanceProperties', '_parsePropertyDescriptor'].forEach(function (methodName) {
          if (methodName === 'destroy' && typeof instance[methodName] === 'function') {
            (function () {
              var oldMethod = instance[methodName];
              instance[methodName] = function () {
                SafeObject.prototype[methodName].call(this, arguments);
                oldMethod.apply(this, arguments);
              };
            })();
          } else {
            instance[methodName] = SafeObject.prototype[methodName];
          }
        });
        instance._isSafeObject = true;

        var properties = instance.constructor.INSTANCE_PROPERTIES;
        if (properties && properties.length) {
          instance._clearAllInstanceProperties(SafeObject.SAFE_OBJECT_INITIALIZE);
        }
        return instance;
      }
    }]);

    function SafeObject() {
      _classCallCheck(this, SafeObject);

      this._clearAllInstanceProperties(SafeObject.SAFE_OBJECT_INITIALIZE);
      this._isSafeObject = true;
    }

    _createClass(SafeObject, [{
      key: 'destroy',
      value: function destroy() {
        this._clearAllInstanceProperties(SafeObject.SAFE_OBJECT_DESTROY);
      }
    }, {
      key: '_getAncestors',
      value: function _getAncestors() {
        var current = this.constructor;
        var out = [];
        while (current = Object.getPrototypeOf(current.prototype) ? Object.getPrototypeOf(current.prototype).constructor : null) {
          out.push(current || []);
        }
        return out;
      }
    }, {
      key: '_getAttributes',
      value: function _getAttributes() {
        var ancestors = [this.constructor].concat(this._getAncestors());
        var out = [];
        for (var index = 0; index < ancestors.length; index++) {
          out.push.apply(out, ancestors[index].INSTANCE_PROPERTIES);
        }
        return out;
      }
    }, {
      key: '_clearAllInstanceProperties',
      value: function _clearAllInstanceProperties(state) {
        var Constructor = this.constructor;
        var instanceProperties = this._getAttributes();
        for (var index = 0; index < instanceProperties.length; index++) {
          try {
            var attributeDescriptor = instanceProperties[index];
            var fieldName = void 0,
                descriptor = void 0;
            if (typeof attributeDescriptor === 'string') {
              fieldName = attributeDescriptor;
              descriptor = this._parsePropertyDescriptor();
            } else if (Array.isArray(attributeDescriptor)) {
              fieldName = attributeDescriptor[0];
              descriptor = this._parsePropertyDescriptor(attributeDescriptor[1]);
            }
            if (state === SafeObject.SAFE_OBJECT_INITIALIZE && fieldName && descriptor) {
              Object.defineProperty(this, fieldName, descriptor);
            } else if (state === SafeObject.SAFE_OBJECT_DESTROY && fieldName) {
              if (this[fieldName] && typeof this[fieldName].destroy === 'function' && this._isSafeObject) {
                this[fieldName].destroy();
              }
              this[fieldName] = null;
            }
          } catch (err) {
            console.log('SafeObject#_clearAllInstanceProperties: ' + err.toString());
          }
        }
      }
    }, {
      key: '_parsePropertyDescriptor',
      value: function _parsePropertyDescriptor(propertyDescriptor) {
        if (!propertyDescriptor || propertyDescriptor.constructor !== Object) {
          return { writable: true, configurable: true, enumerable: true, value: null };
        }
        var descriptor = propertyDescriptor;
        if (!('value' in descriptor)) descriptor.value = null;
        if (!('enumerable' in descriptor)) descriptor.enumerable = true;
        if (!('configurable' in descriptor)) descriptor.configurable = true;
        if (!('writable' in descriptor)) descriptor.writable = true;
        return descriptor;
      }
    }]);

    return SafeObject;
  }();

  exports.default = SafeObject;


  SafeObject.SAFE_OBJECT_INITIALIZE = 1;
  SafeObject.SAFE_OBJECT_DESTROY = 2;
});