
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
        : <option key={key}>{key.replace(/-/g, ' ')}</option>)
}

function handler(event, item, index, render) {
    const value = event.target.value
    if (item[index] === value) return
    item[index] = value
    if (index === 'metric') {
        item.active = true
        if (value === 'amount' || value === 'balance' || value === 'date' || value === 'time' || value === 'datetime') item.op = 'between'
        if (value === 'mcc' || value === 'mid') item.op = 'is-in'
        if (value === 'description') item.op = 'contains'
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
    let value = event.target.value
    if (event.type === 'blur' || event.type === 'keyup' && event.key === 'Enter') {
        if (value.match(/^[\-\.\d]*$/)) {
            value = parseFloat(value || '0.00').toFixed(2)
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

function DateRule({rule, type}) {
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
        {rule.metric === 'date'        && <DateRule rule={rule} type="date"/>}
        {rule.metric === 'time'        && <DateRule rule={rule} type="time" />}
        {rule.metric === 'datetime'    && <DateRule rule={rule} type="datetime-local" />}
        {rule.metric === 'mcc'         && <MccRule rule={rule} />}
        {rule.metric === 'mid'         && <MccRule rule={rule} />}
        {rule.metric === 'description' && <DescriptionRule rule={rule} />}
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



const dict = x => x
const len = list => list.length
const float = item => parseFloat(item)
const contains = (text, pattern) => !!text.match(pattern)

const __in__ = (expr, data) => data.includes(expr);
String.prototype.lower = String.prototype.toLowerCase;
String.prototype.py_split = s => s.split(this)

var test_data = [dict ({'datetime': '2024-09-29 15:12:01', 'description': 'McDonalds #4321, Lansing MI', 'amount': '12.54', 'balance': '833.23', 'mcc': '2402'}), dict ({'datetime': '2024-09-30 18:15:42', 'description': 'McDonalds #4321, Lansing MI', 'amount': '15.99', 'balance': '813.23', 'mcc': '2402'}), dict ({'datetime': '2024-09-30 15:12:01', 'description': 'Ronalds #1, Texas MI', 'amount': '1200.00', 'balance': '604.17', 'mcc': '3501'}), dict ({'datetime': '2024-09-30 77:19:25', 'description': 'Southwest / Dallas, TX', 'amount': '237.90', 'balance': '604.17', 'mcc': '5213'}), dict ({'datetime': '2024-10-01 15:12:01', 'description': 'Peets 1744, Ann Arbor MIUS', 'amount': '6.65', 'balance': '907.68', 'mcc': '2403'})];
for (var data of test_data) {
        var __left0__ = data ['datetime'].py_split (' ');
        data ['date'] = __left0__ [0];
        data ['time'] = __left0__ [1];
}
var is_authorized = function (rules, data, all) {
        if (typeof all == 'undefined' || (all != null && all.hasOwnProperty ("__kwargtrans__"))) {;
                var all = true;
        };
        if (!(rules) || !(len (rules))) {
                return all;
        }
        for (var rule of rules) {
                var term = null;
                var metric = rule ['metric'];
                if (!(metric) || metric == 'Choose:') {
                        continue;
                }
                if (!(rule ['active'])) {
                        continue;
                }
                if (metric == 'All') {
                        var term = is_authorized (rule ['rules'], data, true);
                }
                else if (metric == 'Any') {
                        var term = is_authorized (rule ['rules'], data, false);
                }
                else {
                        var op = rule ['op'];
                        var value = data [metric];
                        var expr = rule ['params'] [0];
                        var expr1 = (op == 'between' ? rule ['params'] [1] : null);
                        if (metric == 'amount' || metric == 'balance') {
                                var evaluate = function (expr) {
                                        if (expr == 'balance') {
                                                return float (data ['balance']);
                                        }
                                        return float (expr || '0.00');
                                };
                                var value = evaluate (value);
                                var expr = evaluate (expr);
                                var expr1 = evaluate (expr1);
                        }
                        if (metric == 'amount' || metric == 'balance' || metric == 'datetime' || metric == 'date' || metric == 'time') {
                                if (op == 'between') {
                                        var term = expr <= value && value <= expr1;
                                }
                                else if (op == '<') {
                                        var term = value < expr;
                                }
                                else if (op == '<=') {
                                        var term = value <= expr;
                                }
                                else if (op == '=') {
                                        var term = value == expr;
                                }
                                else if (op == '>=') {
                                        var term = value >= expr;
                                }
                                else if (op == '>') {
                                        var term = value > expr;
                                }
                                else {
                                        return false;
                                }
                        }
                        else if (metric == 'mcc') {
                                var isin = data ['mcc'] == expr;
                                var term = op == 'is-in' && isin || op == 'is-not-in' && !(isin);
                        }
                        else if (metric == 'description') {
                                var cont = __in__ (expr.lower (), data.description.lower ());
                                var term = op == 'contains' && cont || op == 'does-not-contain' && !(cont);
                        }
                        else {
                                return false;
                        }
                }
                if (all == true && term == false) {
                        return false;
                }
                if (all == false && term == true) {
                        return true;
                }
        }
        return all;
};

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
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
        <pre onClick={() => copyToClipboard(JSON.stringify(sanitized_rules, null, 4))} style={{position: 'fixed', fontSize: 'x-small', top: 10, right: 10}}>{JSON.stringify(sanitized_rules, null, 2)}</pre>
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

const container = document.getElementById('root')
const root = createRoot(container)
root.render(<App/>)












