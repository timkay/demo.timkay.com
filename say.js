
// JSON.safy is a throw-safe version of JSON.stringify:
// 1. Returns the same result as JSON.stringify,
// 2. Catches errors and returns them as the result, such as
//    `(Converting circular structure to JSON)`, and
// 3. Calls JSON.decycle first if it is loaded, to replace circular references
//    with $ref references. See
//    See https://github.com/douglascrockford/JSON-js/blob/master/cycle.js


if (typeof JSON.safy !== 'function') {
    JSON.safy = function safy(v) {
        try {
            if (false && typeof JSON.decycle === 'function') {
                return JSON.stringify(JSON.decycle(v));
            }
            return JSON.stringify(v);
        } catch (e) {
            // Return the first line of the error message, in parentheses
            return `(${e.message.replace(/\n[\s\S]*/, '')})`;
        }
    };
}

// JSON.say is a template literal function that formats debugging output nicely.
// For example:
//    JSON.say `Then answer is ${a}`;
//    JSON.say `a=${a} can also be done ${{a}}`;
// Typical use is to write a function `say` that calls JSON.say and then
// displays the output somewhere, such as in a `<pre>...</pre>` element.

if (typeof JSON.say !== 'function') {
    JSON.say = function say(s, ...v) {
        return v.reduce((a, v, i) => {
            // An object with a single entry will display as key=value.
            // This way, a scalar variable can be displayed like ${{pi}},
            // resulting in pi=3.141592653589793
            const u = Object.entries(v || {});
            if (u.length === 1) {
                return a + u[0][0] + '=' + JSON.safy(u[0][1]) + s[i+1];
            }
            return a + JSON.safy(v) + s[i+1];
        }, s[0]);
    };
}


// console.say displays the output of JSON.say on the console.

if (typeof console.say !== 'function') {
    console.say = function (s, ...v) {console.log(JSON.say(s, ...v));};
}
