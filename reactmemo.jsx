
console.clear()

const {Fragment, useState, useEffect, memo} = React

const Component = ({item}) => {
    console.log('Component rendered')
    return <div>{item}</div>
}

const MemoizedComponent = memo(({item}) => {
    console.log('MemoizedComponent rendered')
    return <div>{item}</div>
})

function App() {
    const [dirty, setDirty] = useState(0)
    return  <Fragment>
                <h1>React Memo Demo</h1>
                <Component item={42} />
                <MemoizedComponent item={43} />
                <button onClick={() => setDirty(dirty => dirty + 1)}>Go</button>
            </Fragment>
}

ReactDOM.render(<App />, document.getElementById('root'))
