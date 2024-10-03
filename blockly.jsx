
console.clear()

const {createRoot} = ReactDOM
const {createContext, useContext, useEffect, useRef, useState, Fragment} = React

const AuthorizationContext = createContext()

const rulemap = {
    amount: 0,
}

function options(options) {
    return options.split(' ').map((key, i) => key.startsWith('-')
        ? <option key={i} disabled>{key}</option>
        : <option key={key}>{key.replace(/-/g, ' ')}</option>)
}

function handler(event, item, index, render, type) {
    let value = event.target.value
    if (type === 'datetime-local') value = value.replace('T', ' ')
    if (item[index] === value) return
    const proto = {
        amount:      {metric: 'amount',      op: 'between',  params: ['0.00', 'balance']},
        balance:     {metric: 'balance',     op: 'between',  params: ['0.00', '0.00']},
        date:        {metric: 'date',        op: 'between',  params: ['', '']},
        time:        {metric: 'time',        op: 'between',  params: ['', '']},
        datetime:    {metric: 'datetime',    op: 'between',  params: ['', '']},
        mcc:         {metric: 'mcc',         op: 'is-in',    params: ['']},
        mid:         {metric: 'mid',         op: 'is-in',    params: ['']},
        description: {metric: 'description', op: 'contains', params: ['']},
        JIT:         {metric: 'JIT',                         url: 'https://example.com'},
        All:         {metric: 'All',                         rules: []},
        Any:         {metric: 'Any',                         rules: []},
        None:        {metric: 'None',                        rules: []},
    }
    if (index === 'metric') {
        if (!['All', 'Any', 'None'].includes(item.metric) || !['All', 'Any', 'None'].includes(value)) {
            for (const key in item) delete item[key]
            Object.assign(item, proto[value])
            item.active = true
        }
    }
    if (index === 'op') {
        if (item.op === 'between' || value === 'between') {
            item.params = proto[item.metric].params
            if (value !== 'between') item.params.splice(1, 1) // delete 2nd param
        }
    }
    item[index] = value
    render()
}

function Text({item, index = 0, type = 'text'}) {
    const {render} = useContext(AuthorizationContext)
    const inputRef = useRef(null);
    useEffect(() => {
        inputRef.current.select();
    }, []);

    return <input ref={inputRef} className="text" type={type} value={item[index]}
        onFocus={event => event.target.select()}
        onChange={event => handler(event, item, index, render, type)}
        onBlur={event => handler(event, item, index, render, type)}
        onKeyUp={event => handler(event, item, index, render, type)}
    />
}

function dollarHandler(event, item, index, render) {
    let value = event.target.value
    if (event.type === 'blur' || event.type === 'keyup' && event.key === 'Enter') {
        if (value.match(/^[\-\.\d]*$/)) {
            value = parseFloat(value || '0.00').toFixed(2)
        }
    }
    item[index] = value
    render()
}

function Dollar({item, index = 0}) {
    const {render} = useContext(AuthorizationContext)
    const inputRef = useRef(null);
    useEffect(() => {
        inputRef.current.select()
    }, []);
    return <input ref={inputRef} className="number" type="text" value={item[index]}
        onFocus={event => event.target.select()}
        onChange={event => dollarHandler(event, item, index, render)}
        onBlur={event => dollarHandler(event, item, index, render)}
        onKeyUp={event => dollarHandler(event, item, index, render)}
    />
}

function Between({rule}) {
    return <div>
        <Dollar item={rule.params} index={0} />
        &nbsp;and&nbsp;
        <Dollar item={rule.params} index={1} />
    </div>
}

function Compare({rule, op}) {
    return <div>
        <Dollar item={rule.params} index={0} />
    </div>
}

function AmountRule({rule}) {
    const {render} = useContext(AuthorizationContext)
    return <div>
        is&nbsp;
        <select value={rule.op} onChange={event => handler(event, rule, 'op', render)}>
            {options('between < <= = >= >')}
        </select>
        {rule.op === 'between' && <Between rule={rule} />}
        {rule.op === '<' && <Compare rule={rule} />}
        {rule.op === '<=' && <Compare rule={rule} />}
        {rule.op === '=' && <Compare rule={rule} />}
        {rule.op === '>=' && <Compare rule={rule} />}
        {rule.op === '>' && <Compare rule={rule} />}
    </div>
}

function MccRule({rule}) {
    const {render} = useContext(AuthorizationContext)
    return <div>
        is&nbsp; {rule.op}
        <select value={rule.op} onChange={event => handler(event, rule, 'op', render)}>
            {options('is-in is-not-in')}
        </select>
        <div>
            <Text item={rule.params} index={0} />
        </div>
    </div>
}

function DescriptionRule({rule}) {
    const {render} = useContext(AuthorizationContext)
    return <div>
        <select value={rule.op} onChange={event => handler(event, rule, 'op', render)}>
            {options('contains does-not-contain')}
        </select>
        <div>
            <Text item={rule.params} index={0} />
        </div>
    </div>
}

function DatetimeRule({rule, type}) {
    const {render} = useContext(AuthorizationContext)
    return <div>
        <select value={rule.op} onChange={event => handler(event, rule, 'op', render)}>
            {options('between < <= = >= >')}
        </select>
        {rule.op === 'between'
        && <div>
            <Text type={type} item={rule.params} index={0} />
            &nbsp;and&nbsp;
            <Text type={type} item={rule.params} index={1} />
        </div>
        || <div>
            <Text type={type} item={rule.params} index={0} />
        </div>
        }
    </div>
}

function JitRule({rule}) {
    const {render} = useContext(AuthorizationContext)
    return <div>
        URL:
        <Text item={rule} index={'url'} focus />
    </div>
}

function Aggregate({rule}) {
    if (!rule.rules || rule.rules.length === 0) {
        rule.rules = [{metric: 'Choose:'}]
    }
    return <>
        <br/>
        <Rules rules={rule.rules} />
    </>
}

function Rule({rule}) {
    const {render} = useContext(AuthorizationContext)
    return <>
        <select value={rule.metric} onChange={event => handler(event, rule, 'metric', render)}>
            {options('Choose: amount balance date time datetime mcc mid description --------------- JIT --------------- All Any None')}
        </select>
        {rule.metric === 'amount'      && <AmountRule rule={rule} />}
        {rule.metric === 'balance'     && <AmountRule rule={rule} />}
        {rule.metric === 'date'        && <DatetimeRule rule={rule} type="date"/>}
        {rule.metric === 'time'        && <DatetimeRule rule={rule} type="time" />}
        {rule.metric === 'datetime'    && <DatetimeRule rule={rule} type="datetime-local" />}
        {rule.metric === 'mcc'         && <MccRule rule={rule} />}
        {rule.metric === 'mid'         && <MccRule rule={rule} />}
        {rule.metric === 'description' && <DescriptionRule rule={rule} />}
        {rule.metric === 'JIT'         && <JitRule rule={rule} />}
        {rule.metric === 'All'         && <Aggregate rule={rule} />}
        {rule.metric === 'Any'         && <Aggregate rule={rule} />}
        {rule.metric === 'None'        && <Aggregate rule={rule} />}
    </>
}

function Rules({rules}) {
    const {render} = useContext(AuthorizationContext)
    const addHandler = i => {
        const add = structuredClone(rules[i])
        add.key = rules.length
        rules.splice(i + 1, 0, add)
        render()
    }
    const remHandler = i => {
        if (rules.length > 1) {
            rules.splice(i, 1)
            render()
        }
    }
    const checkHandler = (event, i) => {
        rules[i].active = event.target.checked
        render()
    }
    rules.forEach((rule, i) => rule.key ||= i)
    return rules.map((rule, i) => <Fragment key={`rule-${rule.key}`}>
        <div className="rule">
            <div title="delete rule" className="plus" onClick={() => remHandler(i)}>－</div>
            <div title="add rule" className="plus" onClick={() => addHandler(i)}>＋</div>
            <div className="drag">⋮⋮&nbsp;</div>
            <input type="checkbox" name="active" title="active rule" checked={rule.active} onChange={event => checkHandler(event, i)} />
            <Rule rule={rule} />
        </div>
        <br key={`div-${rule.key}`} />
    </Fragment>)
}

const rules_history = [
    [
        {active: true, metric: "amount", op: "between", params: ["0.00", "balance"]},
    ]
]


let test_data, is_authorized

function copyToClipboard(text) {
    navigator.clipboard.writeText(text + '\n')
    .catch(err => {
        console.error('Failed to copy table:', err);
    });
}

function Authorization() {
    const [rules, setRules] = useState()
    const [colors, setColors] = useState([])
    useEffect(() => {
        const new_colors = test_data.map(data => is_authorized(rules, data)? '#dfd': '#fdd')
        if (JSON.stringify(new_colors) !== JSON.stringify(colors)) setColors(new_colors)
    }, [rules])
    const render = () => {
        setRules(rules => {
            if (rules) rules_history.unshift(rules)
            return structuredClone(rules_history[0])
        })
    }
    if (!rules) {
        render()
        return 
    }
    const sanitized_rules = structuredClone(rules)
    function clean(data) {
        for (const item of data) {
            delete item.key
            if (item.rules) {
                clean(item.rules)
            }
        }
    }
    clean(sanitized_rules)
    return  <>
        <pre className="copy" onClick={() => copyToClipboard(JSON.stringify(sanitized_rules, null, 4))} style={{position: 'fixed', fontSize: 'x-small', top: 10, right: 10}}>{JSON.stringify(sanitized_rules, null, 2)}</pre>
        <AuthorizationContext.Provider value={{render}}>
            <Rules rules={rules} />
        </AuthorizationContext.Provider>
        <p></p>
        <table id="samples" width="100%" cellPadding="2" cellSpacing="1">
        <thead>
            <tr><th>datetime</th><th>description</th><th align="right">amount</th><th align="right">balance</th><th>mcc</th><th>mid</th></tr>
        </thead>
        <tbody>
            {test_data.map((row, i) =>
            <tr key={i} bgcolor={colors[i]}>
                <td>{row.datetime}</td><td>{row.description}</td><td align="right">{row.amount}</td><td align="right">{row.balance}</td><td align="center">{row.mcc}</td><td align="center">{row.mid}</td>
            </tr>)}
        </tbody>
        </table>
    </>
}

function App() {
    return  <>
        <h1>VCC Authorization Demo</h1>
        <Authorization/>
    </>
}

fetch('is_authorized.js')
.then(res => res.text())
.then(js => {
    [test_data, is_authorized] = eval(`
const dict = x => x
const len = list => list.length
const float = item => parseFloat(item)
const contains = (text, pattern) => !!text.match(pattern)

const __in__ = (expr, data) => data.includes(expr);
String.prototype.lower = String.prototype.toLowerCase;
String.prototype.py_split = function (s) {return this.split(s)}
` + js + '; [test_data, is_authorized]')
})
.then(() => {
    console.log('READY!')
    const container = document.getElementById('root')
    const root = createRoot(container)
    root.render(<App/>)
})












