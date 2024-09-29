
console.clear()

const {createRoot} = ReactDOM
const {createContext, useContext, useEffect, useState} = React

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
    if (index === 'metric') {
        item.op = ''
        item.params = []
    }
    item[index] = event.target.value
    render()
}

function dollarHandler(event, item, index, render) {
    let value = event.target.value
    if (event.type === 'blur' || event.type === 'keyup' && event.key === 'Enter') {
        if (value.match(/^[\-\.\d]+$/)) {
            value = parseFloat(value).toFixed(2)
        }
    }
    item[index] = value
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
    rule.params ??= ['0.00', '0.00']
    return <div>
        <Expr item={rule.params} index={0} />
        &nbsp;and&nbsp;
        <Expr item={rule.params} index={1} />
    </div>
}

function Compare({rule, op}) {
    rule.params ??= ['0.00']
    return <div>
        <Expr item={rule.params} index={0} />
    </div>
}

function AmountRule({rule}) {
    const {render} = useContext(AuthorizationContext)
    if (!rule.op || ! rule.params) {
        rule.op = 'between'
        rule.params = ['0.00', '0.00']
    }
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
    if (!rule.op || !rule.params) {
        rule.op ??= 'allow'
        rule.params ??= ['']
        // render()
    }
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
    if (!rule.op || !rule.params) {
        rule.op ??= 'contains'
        rule.params ??= ['']
        // render()
    }
    return <div>
        <select value={rule.op} onChange={event => handler(event, rule, 'op', render)}>
            {options('contains does-not-contain')}
        </select>
        <div>
            <Text item={rule.params} index={0} />
        </div>
    </div>
}

function DateRule({rule, type = 'date'}) {
    const {render} = useContext(AuthorizationContext)
    if (!rule.op) {
        rule.op ||= 'between'
        // render()
    }
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
    console.log('rules', rules)
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
    return <>
        {rules.map((rule, i) => <>
            <div className="rule" key={`rule-${rule.key}`}>
                <div title="delete rule" className="plus" onClick={() => remHandler(i)}>－</div>
                <div title="add rule" className="plus" onClick={() => addHandler(i)}>＋</div>
                <div className="drag">⋮⋮&nbsp;</div>
                <Rule rule={rule} />
            </div>
            <br/>
        </>)}
    </>
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
        amount: 12.54,
        mcc: 2402,
    },
    {
        datetime: '2024-09-30 15:12:01',
        date: '2024-09-30',
        time: '15:12:01',
        description: 'McDonalds #4321, Lansing MI',
        amount: 12.54,
        mcc: 2402,
    },
    {
        datetime: '2024-09-29 15:12:01',
        date: '2024-09-29',
        time: '15:12:01',
        description: 'Ronalds #1, Texas MI',
        amount: 1200,
        mcc: 3501,
    },
]

const test_balance = 833.23

function Authorization() {
    const [rules, setRules] = useState()
    const [colors, setColors] = useState('')
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
    return  <>
        <pre style={{position: 'fixed', fontSize: 'x-small', top: 10, right: 10}}>{JSON.stringify(rules.map(x => (delete x.key, x)), null, 4)}</pre>
        <AuthorizationContext.Provider value={{render}}>
            <Rules rules={rules} />
        </AuthorizationContext.Provider>
        <p></p>
        <table width="100%" cellpadding="2" cellspacing="1" bgcolor="black">
        <thead>
            <tr bgcolor="white"><th>datetime</th><th>date</th><th>time</th><th>description</th><th>amount</th><th>mcc</th></tr>
        </thead>
        <tbody>
            {test_data.map(row => <tr bgcolor="white">{Object.values(row).map(item => <td>{item}</td>)}</tr>)}
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












