'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SafeObject = function () {
  _createClass(SafeObject, null, [{
    key: 'debug',
    value: function debug(instance) {
      var buffer = [];
      buffer.push('----- SafeObject debug -----');
      buffer.push('Constructor: ' + String(instance.constructor.name));
      buffer.push('_isSafeObject: ' + String(instance._isSafeObject));
      if (instance._isSafeObject) {
        (function () {
          var ancestors = instance._getAncestors();
          buffer.push('Ancestors: ' + instance._getAncestors().map(function (d) {
            return d.name;
          }).join(' > '));
          var attributeNames = instance._getRegisteredPropertyNames();
          var registeredAttributeNames = instance._getIgnoredPropertyNames().concat(attributeNames);
          var unregisteredAttributeNames = Object.getOwnPropertyNames(instance).filter(function (d) {
            return registeredAttributeNames.indexOf(d) === -1;
          });
          buffer.push('registered attributes: ' + attributeNames.join(', '));
          buffer.push('unregistered attributes: ' + unregisteredAttributeNames.join(', '));
        })();
      }
      return buffer.join('\n');
    }
  }, {
    key: 'include',
    value: function include(instance) {
      if (instance._isSafeObject) return instance;

      ['destroy', '_getAncestors', '_getRegisteredProperties', '_getRegisteredPropertyNames', '_getIgnoredPropertyNames', '_getUnregisteredPropertyNames', '_clearAllInstanceProperties', '_parsePropertyDescriptor'].forEach(function (methodName) {
        if (methodName === 'destroy' && typeof instance[methodName] === 'function') {
          (function () {
            var oldMethod = instance[methodName];
            instance[methodName] = function () {
              var returnedValue = oldMethod.apply(this, arguments);
              SafeObject.prototype[methodName].call(this, arguments);
              return returnedValue;
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
    key: '_getIgnoredPropertyNames',
    value: function _getIgnoredPropertyNames() {
      return ['_isSafeObject', 'destroy', '_getAncestors', '_getRegisteredProperties', '_getRegisteredPropertyNames', '_getUnregisteredPropertyNames', '_getIgnoredPropertyNames', '_clearAllInstanceProperties', '_parsePropertyDescriptor'];
    }
  }, {
    key: '_getRegisteredProperties',
    value: function _getRegisteredProperties() {
      var ancestors = [this.constructor].concat(this._getAncestors());
      var out = [];
      for (var index = 0; index < ancestors.length; index++) {
        out.push.apply(out, ancestors[index].INSTANCE_PROPERTIES);
      }
      return out;
    }
  }, {
    key: '_getRegisteredPropertyNames',
    value: function _getRegisteredPropertyNames() {
      return this._getRegisteredProperties().map(function (d) {
        return Array.isArray(d) ? d[0] : d;
      });
    }
  }, {
    key: '_getUnregisteredPropertyNames',
    value: function _getUnregisteredPropertyNames() {
      var registeredAttributeNames = this._getRegisteredPropertyNames();
      return Object.getOwnPropertyNames(this).filter(function (propertyName) {
        return registeredAttributeNames.indexOf(propertyName) === -1;
      });
    }
  }, {
    key: '_clearAllInstanceProperties',
    value: function _clearAllInstanceProperties(state) {
      var Constructor = this.constructor;
      var instanceProperties = this._getRegisteredProperties();
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