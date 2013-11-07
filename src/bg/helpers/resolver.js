// Eliminates the need to do data && data.prop && data.prop.subprop testing
function resolver(prop_string, data) {
    // Handles null, undefined, and top-layer props (data.prop)
    if (data == null || prop_string.indexOf('.') === -1) {
        return data ? data[prop_string] : undefined;
    }
    var props = prop_string.split('.'),
        p = props.length,
        result = data,
        i, prop;
    for (i = 0; i < p;  i++) {
        prop = props[i];
        result = result[prop];
        if (result === undefined) {
            return undefined;
        }
    }
    return result;
}

module.exports = resolver;