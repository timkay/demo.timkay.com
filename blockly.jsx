
console.clear()

const {createRoot} = ReactDOM
const {createContext, useContext, useEffect, useState, Fragment} = React

const AuthorizationContext = createContext()

const rulemap = {
    amount: 0,
}

function options(options) {
    return options.split(' ').map(key => key.startsWith('-')
        ? <option key={key} disabled>{key}</option>
        : <option key={key}>{key}</option>)
}

function handler(event, item, index, render) {
    const value = event.target.value
    if (item[index] === value) return
    item[index] = value
    if (index === 'metric') {
        if (value === 'amount' || value === 'balance' || value === 'date' || value === 'time' || value === 'datetime') item.op = 'between'
        if (value === 'mcc' || value === 'mid') item.op = 'allow'
        if (value === 'description') item.op = 'matches'
        item.params = []
        const initializer = value === 'amount' || value === 'balance'? '0.00': ''
        item.params[0] = initializer
        item.params[1] = initializer
        if (item.op !== 'between') item.params.pop()
    }
    render()
}

function Text({item, index = 0, type = 'text'}) {
    const {render} = useContext(AuthorizationContext)
    return <input className="text" type={type} value={item[index]}
        onFocus={event => event.target.select()}
        onChange={event => handler(event, item, index, render)}
        onBlur={event => handler(event, item, index, render)}
        onKeyUp={event => handler(event, item, index, render)}
    />
}

function dollarHandler(event, item, index, render) {
    let value = event.target.value || '0.00'
    if (event.type === 'blur' || event.type === 'keyup' && event.key === 'Enter') {
        if (value.match(/^[\-\.\d]+$/)) {
            value = parseFloat(value).toFixed(2)
        }
    }
    item[index] = value
    render()
}

function Expr({item, index = 0}) {
    const {render} = useContext(AuthorizationContext)
    return <input className="number" type="text" value={item[index]}
        onFocus={event => event.target.select()}
        onChange={event => dollarHandler(event, item, index, render)}
        onBlur={event => dollarHandler(event, item, index, render)}
        onKeyUp={event => dollarHandler(event, item, index, render)}
    />
}

function Between({rule}) {
    return <div>
        <Expr item={rule.params} index={0} />
        &nbsp;and&nbsp;
        <Expr item={rule.params} index={1} />
    </div>
}

function Compare({rule, op}) {
    return <div>
        <Expr item={rule.params} index={0} />
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
        is&nbsp;
        <select value={rule.op} onChange={event => handler(event, rule, 'op', render)}>
            {options('allow disallow')}
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
            {options('matches does-not-match')}
        </select>
        <div>
            <Text item={rule.params} index={0} />
        </div>
    </div>
}

function DateRule({rule, type = 'date'}) {
    const {render} = useContext(AuthorizationContext)
    return <div>
        <select value={rule.op} onChange={event => handler(event, rule, 'op', render)}>
            {options('between after before')}
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

function Aggregate({rule}) {
    if (!rule.rules || rule.rules.length === 0) {
        rule.rules = [{}]
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
            {options('Choose: amount balance date time datetime mcc mid description --------------- All Any None')}
        </select>
        {rule.metric === 'amount'      && <AmountRule rule={rule} />}
        {rule.metric === 'balance'     && <AmountRule rule={rule} />}
        {rule.metric === 'date'        && <DateRule rule={rule} />}
        {rule.metric === 'datetime'    && <DateRule rule={rule} type="datetime-local" />}
        {rule.metric === 'description' && <DescriptionRule rule={rule} />}
        {rule.metric === 'mcc'         && <MccRule rule={rule} />}
        {rule.metric === 'mid'         && <MccRule rule={rule} />}
        {rule.metric === 'time'        && <DateRule rule={rule} type="time" />}
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
    rules.forEach((rule, i) => rule.key ||= i)
    return rules.map((rule, i) => <Fragment key={`rule-${rule.key}`}>
        <div className="rule">
            <div title="delete rule" className="plus" onClick={() => remHandler(i)}>－</div>
            <div title="add rule" className="plus" onClick={() => addHandler(i)}>＋</div>
            <div className="drag">⋮⋮&nbsp;</div>
            <Rule rule={rule} />
        </div>
        <br key={`div-${rule.key}`} />
    </Fragment>)
}

const rules_history = [
    [
        {},
    ]
]

const test_data = [
    {
        datetime: '2024-09-29 15:12:01',
        date: '2024-09-29',
        time: '15:12:01',
        description: 'McDonalds #4321, Lansing MI',
        amount: '12.54',
        balance: '833.23',
        mcc: '2402',
    },
    {
        datetime: '2024-09-30 18:15:42',
        date: '2024-09-30',
        time: '15:12:01',
        description: 'McDonalds #4321, Lansing MI',
        amount: '15.99',
        balance: '813.23',
        mcc: '2402',
    },
    {
        datetime: '2024-09-30 15:12:01',
        date: '2024-09-29',
        time: '15:12:01',
        description: 'Ronalds #1, Texas MI',
        amount: '1200.00',
        balance: '604.17',
        mcc: '3501',
    },
    {
        datetime: '2024-09-30 77:19:25',
        date: '2024-09-29',
        time: '15:12:01',
        description: 'Southwest / Dallas, TX',
        amount: '237.90',
        balance: '604.17',
        mcc: '5213',
    },
    {
        datetime: '2024-10-01 15:12:01',
        date: '2024-09-29',
        time: '15:12:01',
        description: 'Peets 1744, Ann Arbor MIUS',
        amount: '6.65',
        balance: '907.68',
        mcc: '2403',
    },
]

const le = (a, b) => parseFloat(a) <= parseFloat(b)
const lt = (a, b) => !ge(a, b)
const eq = (a, b) => !lt(a, b) && !gt(a, b)
const gt = (a, b) => !le(a, b)
const ge = (a, b) => le(b, a)

function is_authorized(rules, data, any = false) {
    if (!rules || !rules.length) return false
    for (const rule of rules) {
        let term
        if (rule.metric === 'amount' || rule.metric === 'balance') {
            const amount = data[rule.metric]
            const expr = rule.params?.[0]?.replace(/\bbalance\b/g, data.balance)
            const expr1 = rule.params?.[1]?.replace(/\bbalance\b/g, data.balance)
            if (rule.op === 'between') term = rule.params?.length >= 2 && le(expr, amount) && le(amount, expr1)
            else if (rule.op === '<' ) term = rule.params?.length >= 1 && lt(amount, expr)
            else if (rule.op === '<=') term = rule.params?.length >= 1 && le(amount, expr)
            else if (rule.op === '=')  term = rule.params?.length >= 1 && eq(amount, expr)
            else if (rule.op === '>=') term = rule.params?.length >= 1 && ge(amount, expr)
            else if (rule.op === '>' ) term = rule.params?.length >= 1 && gt(amount, expr)
            else all = false
        } else if (rule.metric === 'mcc') {
            const matches = data.mcc === rule.params?.[0]
            term = rule.op === 'allow' && matches ||  rule.op === 'disallow' && !matches
        } else if (rule.metric === 'description') {
            const matches = data.description && data.description.toLowerCase().match(rule.params[0])
            term = rule.op === 'matches'? !!matches: !matches
        } else if (rule.metric === 'Any') {
            term = is_authorized(rule.rules, data, true)
        } else {
            return false
        }
        if (any === false && term === false) return false
        if (any === false && term === true ) null
        if (any === true  && term === false) null
        if (any === true  && term === true ) return true
    }
    return !any
}

function Authorization() {
    const [rules, setRules] = useState()
    const [colors, setColors] = useState([])
    const render = () => {
        setRules(rules => {
            if (rules) rules_history.unshift(rules)
            return structuredClone(rules_history[0])
        })
        const new_colors = test_data.map(data => is_authorized(rules, data)? '#dfd': '#fdd')
        if (JSON.stringify(new_colors) !== JSON.stringify(colors)) setColors(new_colors)
    }
    if (!rules) {
        render()
        return 
    }
    return  <>
        <pre style={{position: 'fixed', fontSize: 'x-small', top: 10, right: 10}}>{JSON.stringify(rules, null, 2)}</pre>
        <AuthorizationContext.Provider value={{render}}>
            <Rules rules={rules} />
        </AuthorizationContext.Provider>
        <p></p>
        <table id="samples" width="100%" cellPadding="2" cellSpacing="1">
        <thead>
            <tr><th key={1}>datetime</th><th key={2}>date</th><th>time</th><th>description</th><th>amount</th><th>balance</th><th>mcc</th></tr>
        </thead>
        <tbody>
            {test_data.map((row, i) => <tr key={i} bgcolor={colors[i]}>{Object.values(row).map((item, i) => <td key={i}>{item}</td>)}</tr>)}
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

const container = document.getElementById('root')
const root = createRoot(container)
root.render(<App/>)












