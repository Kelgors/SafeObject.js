(function (exportName) {

  function warn() {
    if (typeof console === 'undefined' || !SafeObject.debugMode) return;
    if (console.warn) console.warn.apply(console, arguments);
    else if (console.log) console.log.apply(console, arguments);
  }

  class PropertyDescriptor {
    constructor(value, enumerable, writable, configurable, valueIsFactory) {
      this.isFactory = typeof value === 'function' && typeof valueIsFactory === 'undefined' ? true : valueIsFactory;
      this.value = value;
      this.enumerable = typeof enumerable === 'undefined' ? true : false;
      this.writable = typeof writable === 'undefined' ? true : false;
      this.configurable = typeof configurable === 'undefined' ? true : false;
    }

    clone() {
      return new PropertyDescriptor(this.value, this.enumerable, this.writable, this.configurable, this.isFactory);
    }

    toObject() {
      return {
        value: this.isFactory ? this.value(this) : this.value,
        enumerable: this.enumerable,
        writable: this.writable,
        configurable: this.configurable
      };
    }
  }

  class SafeObject {

    static debug(instance) {
      const buffer = [];
      buffer.push('----- SafeObject debug -----');
      buffer.push('Constructor: ' + String(instance.constructor.name));
      buffer.push('_isSafeObject: ' + String(!!instance._isSafeObject));
      if (instance._isSafeObject) {
        const ancestors = SafeObject.getAncestors(instance);
        buffer.push('Ancestors: ' + ancestors.map(function (d) {return d.name;}).join(' < '));
        const attributeNames = SafeObject.getRegisteredPropertyNames(instance);
        const registeredAttributeNames = instance._getIgnoredSafeObjectPropertyNames().concat(attributeNames);
        const unregisteredAttributeNames = Object.getOwnPropertyNames(instance).filter(function (d)  { return registeredAttributeNames.indexOf(d) === -1; });
        buffer.push('ignored properties: ' + instance._getIgnoredSafeObjectPropertyNames().join(', '));
        buffer.push('registered properties: ' + attributeNames.join(', '));
        buffer.push('unregistered properties: ' + unregisteredAttributeNames.join(', '));
      }
      return buffer.join('\n');
    }

    static include(instance, options = {}) {
      if (SafeObject.isSafeObject(instance)) return instance;
      if (!Array.isArray(instance.constructor.INSTANCE_PROPERTIES)) {
        instance.constructor.INSTANCE_PROPERTIES = [];
      }
      const instanceProperties = instance.constructor.INSTANCE_PROPERTIES;

      if (instanceProperties.findIndex(function (d) { return d === '_isSafeObject' || (Array.isArray(d) && d[0] === '_isSafeObject'); }) === -1) {
        instanceProperties.push.apply(instanceProperties, SafeObject.INSTANCE_PROPERTIES);
      }

      [
        { methodName: 'destroy', returnsMerge: 'super' },
        { methodName: '_getIgnoredSafeObjectPropertyNames', returnsMerge: 'concat' }
      ].forEach(function ({ methodName, returnsMerge }) {
        // check if property exists and is a method
        const hasProperty = methodName in instance;
        const isFunction = typeof instance[methodName] === 'function';
        const _superMethod = instance[methodName];
        if (options.force && hasProperty) {
          warn('Overriding ' + methodName + ' method');
        }
        // define the method only if it hasnt the property or 'force' is true
        if (hasProperty && options.force || !hasProperty) {
          if (instanceProperties.findIndex(function (d) {
            return (d === methodName) || (Array.isArray(d) && d[0] === methodName);
          }) === -1) {
            instanceProperties.push([ methodName, new PropertyDescriptor(isFunction ? overrideMethod : SafeObject.prototype[methodName], false, true, true, false) ]);
          }
        }

        function overrideMethod() {
          const superOut = _superMethod.apply(this, arguments);
          const safeObjectOut = SafeObject.prototype[methodName].call(this);
          let out;
          switch (returnsMerge) {
            case 'super': out = superOut; break;
            case 'concat': out = (superOut || []).concat(safeObjectOut || []); break;
          }
          return out;
        }
      });

      SafeObject.setProperties(instance, SafeObject.SAFE_OBJECT_INITIALIZE, instanceProperties.concat(SafeObject.INSTANCE_PROPERTIES));

      return instance;
    }

    static isSafeObject(object) {
      return object && object._isSafeObject === true;
    }

    static getAncestors(object) {
      let current = object.constructor;
      const out = [];
      while (current = Object.getPrototypeOf(current.prototype) ? Object.getPrototypeOf(current.prototype).constructor : null) {
        out.push(current || []);
      }
      return out;
    }

    static getRegisteredProperties(safeObject) {
      const ancestors = [ safeObject.constructor ].concat(SafeObject.getAncestors(safeObject));
      const out = [];
      for (let index = 0; index < ancestors.length; index++) {
        out.push.apply(out, ancestors[index].INSTANCE_PROPERTIES);
      }
      return out;
    }

    static getUnregisteredPropertyNames(safeObject) {
      const registeredAttributeNames = SafeObject.getRegisteredPropertyNames(safeObject);
      registeredAttributeNames.push.apply(registeredAttributeNames, safeObject._getIgnoredSafeObjectPropertyNames());
      return Object.getOwnPropertyNames(safeObject).filter(function (propertyName)  {
        return registeredAttributeNames.indexOf(propertyName) === -1;
      });
    }

    static getRegisteredPropertyNames(safeObject) {
      return SafeObject.getRegisteredProperties(safeObject).map(function (d) { return Array.isArray(d) ? d[0] : d; });
    }

    static setInstanceProperties(safeObject, state) {
      SafeObject.setProperties(safeObject, state, SafeObject.getRegisteredProperties(safeObject));
    }

    static setProperties(object, state, propertyDescriptors) {
      for (let index = 0; index < propertyDescriptors.length; index++) {
        try {
          const attributeDescriptor = propertyDescriptors[index];
          let fieldName;
          let descriptor;
          if (typeof attributeDescriptor === 'string') {
            fieldName = attributeDescriptor;
            descriptor = SafeObject.parsePropertyDescriptor(null);
          } else if (Array.isArray(attributeDescriptor)) {
            fieldName = attributeDescriptor[0];
            descriptor = SafeObject.parsePropertyDescriptor(attributeDescriptor[1]);
          }
          SafeObject.setProperty(object, fieldName, descriptor, state);
        } catch (err) {
          warn('SafeObject#setProperties: ' + err.toString());
        }
      }
    }

    static setProperty(object, fieldName, propertyDescriptor, state) {
      if (!propertyDescriptor) {
        warn('Property descriptor isnt well formed for ' + String(fieldName) + '.');
        return;
      }
      Object.defineProperty(object, fieldName, propertyDescriptor.toObject());
    }

    static parsePropertyDescriptor(propertyDescriptor) {
      if (!propertyDescriptor || !(propertyDescriptor instanceof PropertyDescriptor)) {
        return new PropertyDescriptor(propertyDescriptor);
      }
      return propertyDescriptor;
    }


    constructor() {
      SafeObject.setInstanceProperties(this, SafeObject.SAFE_OBJECT_INITIALIZE);
      this._isDestroyed = false;
    }

    destroy() {
      SafeObject.setInstanceProperties(this, SafeObject.SAFE_OBJECT_DESTROY);
      this._isDestroyed = true;
    }

    _getIgnoredSafeObjectPropertyNames() {
      return [ '_isDestroyed' ];
    }

  }

  SafeObject.debugMode = false;
  SafeObject.VERSION = '1.1.5';
  SafeObject.SAFE_OBJECT_INITIALIZE = 1;
  SafeObject.SAFE_OBJECT_DESTROY = 2;

  SafeObject.INSTANCE_PROPERTIES = [
    [ '_isSafeObject', new PropertyDescriptor(true, false, false, false) ]
  ];

  SafeObject.PropertyDescriptor = PropertyDescriptor;

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


