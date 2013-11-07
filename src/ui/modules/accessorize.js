/*
 * Helper to give function accessors for Backbone Models
 * 
 * 1. Define your model with a fields property that lists the attributes to be accesorized
 *    For example: fields: ['id','name']
 * 2. Get current value by calling the accessor with no args: myModel.id() or myModel.name()
 * 3. Set value by calling with new value and optional options object: myModel.name('John', {validate: true})
 */
module.exports = function(obj) {
    if (!obj.prototype || !obj.prototype.fields) return;

    _.each(obj.prototype.fields, function(name) {
        if (obj.prototype[name] || name === 'id') return;

        obj.prototype[name] = function(newVal, options) {
            var payload, to_return;

            switch (newVal) {
              case null:
              case void 0:
                to_return = this.get(name);
                break;
              case _:
                to_return = _(this.get(name)).chain();
                break;
              default:
                payload = {};
                payload[name] = newVal;
                to_return = this.set(payload, options);
            }

            return to_return;
        };
        
        obj.prototype[name].accessorized = true;
    });
};