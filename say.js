
if (typeof JSON.safy !== 'function') {
        JSON.safy = v => {try {return JSON.stringify(JSON.decycle(v))} catch (e) {return `(${e.message.replace(/\n[\s\S]*/, '')})`}};
}

if (typeof String.say !== 'function') {
    String.say = function say(s, ...v) {
        return v.reduce((a, v, i) => a += 
            (Object.keys(v || {}).length === 1? Object.entries(v).map(([k, v]) => k + '=' + JSON.safy(v)).join('='): JSON.safy(v)) + s[i+1], s[0]);
    };
}

if (typeof console.say !== 'function') {
    console.say = function (s, ...v) {console.log(String.say(s, ...v));};
}
