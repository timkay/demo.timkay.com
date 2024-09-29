
console.clear()

const {createRoot} = ReactDOM
const {createContext, useContext, useEffect, useState} = React

const AuthorizationContext = createContext()

const rulemap = {
    amount: 0,
}

function gen_options(options) {
    return options.split(' ').map(key => key.startsWith('-')
        ? <option key={key} disabled>{key}</option>
        : <option key={key}>{key}</option>)
}

function Between({rule}) {
    const {render} = useContext(AuthorizationContext)
    const valueHandler = (event, i, blur) => {
        let value = event.target.value
        if (blur) value = parseFloat(value).toFixed(2)
        rule.params[i] = value
        render()
    }
    rule.params ??= ['0.00', '0.00']
    return <div>
        <input type="number" value={rule.params[0]}
            onChange={event => valueHandler(event, 0)}
            onBlur={event => valueHandler(event, 0, true)}
            onKeyUp={event => valueHandler(event, 0, event.key === 'Enter')}
        />
        &nbsp;and&nbsp;
        <input type="number" value={rule.params[1]}
            onChange={event => valueHandler(event, 1)}
            onBlur={event => valueHandler(event, 1, true)}
            onKeyUp={event => valueHandler(event, 1, event.key === 'Enter')}
        />
    </div>
}

function Comparison({rule, op}) {
    const {render} = useContext(AuthorizationContext)
    const valueHandler = (event, i, blur) => {
        let value = event.target.value
        if (blur) value = parseFloat(value).toFixed(2)
        rule.params[i] = value
        render()
    }
    rule.params ??= ['0.00']
    return <div>
        <input type="number" value={rule.params[0]}
            onChange={event => valueHandler(event, 0)}
            onBlur={event => valueHandler(event, 0, true)}
            onKeyUp={event => valueHandler(event, 0, event.key === 'Enter')}
        />
    </div>
}

function Amount({rule}) {
    const {render} = useContext(AuthorizationContext)
    const valueHandler = event => {
        rule.op = event.target.value
        render()
    }
    return <div>
        is&nbsp;
        <select value={rule.op} onChange={valueHandler}>
            {gen_options('between abc < = >')}
        </select>
        {rule.op === 'between' && <Between rule={rule} />}
        {rule.op === '<' && <Comparison rule={rule} />}
        {rule.op === '=' && <Comparison rule={rule} />}
        {rule.op === '>' && <Comparison rule={rule} />}
    </div>
}

function Mcc({rule}) {
    return ''
}

function Rule({rule}) {
    const op = rule.op
    const {render} = useContext(AuthorizationContext)
    const valueHandler = event => {
        rule.metric = event.target.value
        render()
    }
    return <div>
        <select value={rule.metric} onChange={valueHandler}>
            {gen_options('Choose: amount balance datetime date time mcc description -------------------- Any All None')}
        </select>
        {rule.metric === 'amount' && <Amount rule={rule} />}
        {rule.metric === 'mcc' && <Mcc rule={rule} />}
    </div>
}

function Rules({rules}) {
    const {render} = useContext(AuthorizationContext)
    const plusHandler = i => {
        rules.splice(i + 1, 0, {key: rules.length})
        render()
    }
    rules.forEach((rule, i) => rule.key ||= i)
    return <>
        {rules.map((rule, i) =>
            <div key={`rule-${rule.key}`}>
                <div className="rule">
                    <div className="plus">⋮⋮&nbsp;</div>
                    <Rule rule={rule} />
                    <div className="plus" onClick={() => plusHandler(i)}>&nbsp;+</div>
                </div>
            </div>)}
    </>
}

const rules_history = [
    [
        {metric: 'amount', op: 'between', params: ['', '100.00']},
        {metric: 'mcc',    op: 'in',      params: ['3112', '3114', '4710']},
    ]
]

function Authorization() {
    const [rules, setRules] = useState()
    const render = () => {
        setRules(rules => {
            if (rules) rules_history.unshift(rules)
            return structuredClone(rules_history[0])
        })
    }
    if (!rules) {
        console.log(rules)
        render()
        return ''
    }
    console.log('(rendering) history', rules_history)
    console.log('(rendering) rules', rules)
    return  <>
        <AuthorizationContext.Provider value={{render}}>
            <Rules rules={rules} />
        </AuthorizationContext.Provider>
        <pre style={{position: 'fixed', top: 10, right: 10}}>{JSON.stringify(rules, null, 4)}</pre>
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












