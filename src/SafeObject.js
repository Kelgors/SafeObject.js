export default class SafeObject {

  static debug(instance) {
    const buffer = [];
    buffer.push('----- SafeObject debug -----');
    buffer.push('Constructor: ' + String(instance.constructor.name));
    buffer.push('_isSafeObject: ' + String(instance._isSafeObject));
    if (instance._isSafeObject) {
      const ancestors = instance._getAncestors();
      buffer.push('Ancestors: ' + instance._getAncestors().map(function (d) {return d.name;}).join(' > '));
      const attributeNames = instance._getRegisteredPropertyNames();
      const registeredAttributeNames = instance._getIgnoredPropertyNames().concat(attributeNames);
      const unregisteredAttributeNames = Object.getOwnPropertyNames(instance).filter(function (d)  { return registeredAttributeNames.indexOf(d) === -1; });
      buffer.push('registered attributes: ' + attributeNames.join(', '));
      buffer.push('unregistered attributes: ' + unregisteredAttributeNames.join(', '));
    }
    return buffer.join('\n');
  }

  static include(instance) {
    if (instance._isSafeObject) return instance;

    [ 'destroy', '_getAncestors', '_getRegisteredProperties', '_getRegisteredPropertyNames', '_getIgnoredPropertyNames', '_getUnregisteredPropertyNames', '_clearAllInstanceProperties', '_parsePropertyDescriptor' ].forEach(function (methodName) {
      if (methodName === 'destroy' && typeof instance[methodName] === 'function') {
        const oldMethod = instance[methodName];
        instance[methodName] = function () {
          var returnedValue = oldMethod.apply(this, arguments);
          SafeObject.prototype[methodName].call(this, arguments);
          return returnedValue;
        };
      } else {
        instance[methodName] = SafeObject.prototype[methodName];
      }
    });
    instance._isSafeObject = true;

    const properties = instance.constructor.INSTANCE_PROPERTIES;
    if (properties && properties.length) {
      instance._clearAllInstanceProperties(SafeObject.SAFE_OBJECT_INITIALIZE);
    }
    return instance;
  }

  constructor() {
    this._clearAllInstanceProperties(SafeObject.SAFE_OBJECT_INITIALIZE);
    this._isSafeObject = true;
  }

  destroy() {
    this._clearAllInstanceProperties(SafeObject.SAFE_OBJECT_DESTROY);
  }

  _getAncestors() {
    let current = this.constructor;
    const out = [];
    while (current = Object.getPrototypeOf(current.prototype) ? Object.getPrototypeOf(current.prototype).constructor : null) {
      out.push(current || []);
    }
    return out;
  }

  _getIgnoredPropertyNames() {
    return [ '_isSafeObject', 'destroy', '_getAncestors', '_getRegisteredProperties', '_getRegisteredPropertyNames', '_getUnregisteredPropertyNames', '_getIgnoredPropertyNames', '_clearAllInstanceProperties', '_parsePropertyDescriptor' ];
  }

  _getRegisteredProperties() {
    const ancestors = [ this.constructor ].concat(this._getAncestors());
    const out = [];
    for (let index = 0; index < ancestors.length; index++) {
      out.push.apply(out, ancestors[index].INSTANCE_PROPERTIES);
    }
    return out;
  }

  _getRegisteredPropertyNames() {
    return this._getRegisteredProperties().map(function (d) { return Array.isArray(d) ? d[0] : d; });
  }

  _getUnregisteredPropertyNames() {
    const registeredAttributeNames = this._getRegisteredPropertyNames();
    return Object.getOwnPropertyNames(this).filter(function (propertyName)  { return registeredAttributeNames.indexOf(propertyName) === -1; });
  }

  _clearAllInstanceProperties(state) {
    const Constructor = this.constructor;
    const instanceProperties = this._getRegisteredProperties();
    for (let index = 0; index < instanceProperties.length; index++) {
      try {
        const attributeDescriptor = instanceProperties[index];
        let fieldName, descriptor;
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

  _parsePropertyDescriptor(propertyDescriptor) {
    if (!propertyDescriptor || propertyDescriptor.constructor !== Object) {
      return { writable: true, configurable: true, enumerable: true, value: null };
    }
    const descriptor = propertyDescriptor;
    if (!('value' in descriptor)) descriptor.value = null;
    if (!('enumerable' in descriptor)) descriptor.enumerable = true;
    if (!('configurable' in descriptor)) descriptor.configurable = true;
    if (!('writable' in descriptor)) descriptor.writable = true;
    return descriptor;
  }

}

SafeObject.SAFE_OBJECT_INITIALIZE = 1;
SafeObject.SAFE_OBJECT_DESTROY = 2;