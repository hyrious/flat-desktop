## React 状态管理 —— 为什么，以及常见解决方案

React 状态管理，其实就是变着花样 `setState` 。我们知道 React 的刷新 (render) 单位是**组件**，而组件刷新这件事只由 `setState` 触发，因此各类状态管理库其实就是封装 `setState`。

#### TL;DR

> 魔法 = Proxy。

- 啥都不用
    - Context
    - useReducer（可选）
- 不用魔法
    - Redux：useReducer 的替代库，带上类型声明会让代码量加三倍
    - Immer.js：仅仅是一种改善写法的方式
- 用魔法
    - MobX：国内用户最多
    - react-tracked：除了 Proxy，还做了性能优化
- 自己封
    - 可以把 Immer.js 再封装一次，使其成为完整的状态管理工具  
      [final-state](https://github.com/final-state/final-state) 这库不更新了，要用最好手动抄一遍
    - 可以把 Vue3 的 ref/reactive/watchEffect 拿出来封成 react 的状态管理工具，省得自己研究 proxy  
      [@hyrious/use-reactive](https://www.npmjs.com/package/@hyrious/use-reactive)
    - 可以在组件内部用 [useReactive](https://ahooks.js.org/zh-CN/hooks/advanced/use-reactive/) 代替 useState，和上面的状态管理工具结合使用，对于不需要提到上层管理的状态可以用这个小 Hooks 简化写法。

### 什么时候使用 state

不是所有组件内的变量都是 state，只有满足以下条件的值需要放在 state 里：

1. 作用域在当前组件下
2. 会因为用户操作而改变

如果作用域在更上层 —— 例如他可能影响到另一个组件，那么他应当是 props；

除此以外的应当考虑作为普通变量/常量，或者 `useRef`（也就是 Class Component 里的 `this`）。

### 为什么需要状态管理

当应用规模扩大，我们不可能只维护一个 `todo: string[]` ，通常是各种子状态互相影响，此时就需要一些操作来帮助我们保证状态的正确性，通常有以下一些方式：

#### [状态提升](https://reactjs.org/docs/lifting-state-up.html)

如果有两个组件呈平级关系，现在需要一个组件内的状态影响到另一个组件。官方给出的解决方案是把这些相关的状态以及改变状态的操作都提升到父组件，并通过 props 传下去。

```tsx
function Parent() {
    const [name, setName] = useState("");
    return <>
        <Input value={name} onChange={e => setName(e.target.value)} />
        Length: <Text value={name.length} />
    </>;
}
```

这么一来，一旦有一些状态耦合得非常复杂，那么他们全都要提到某个 `<Parent>` 上，并且还要写大量的 props 来传递状态。这无疑让代码看起来更 :shit:。

官方：那我给你封装一下这个 Parent 不就好了嘛 —— 于是有了 Context。

```tsx
const nameContext = createContext(["", (_) => {}]);
function Parent() {
    const nameState = useState("");
    return <nameContext.Provider value={nameState}>
        <Input />
    </nameContext.Provider>;
}
function Input() {
    const [name, setName] = useContext(nameContext);
    return <input value={name} onChange={e => setName(e.target.value)} />;
}
```

省了一些 props，增加了几行 Provider，以及声明了两遍 state（createContext，Parent useState）。

如果使用 TypeScript，你还要多声明一遍 state —— 类型。

下面列出一些具体的库，以及他解决了原生的什么痛点

#### Redux 以及一类 \*x

Redux 添加了一系列语法盐来大声呵斥开发者，要如何严谨地考虑状态维护。为什么我说呵斥呢，因为他可以直接把代码量增加三倍（）具体来说，把状态管理抽象出一套 Reducer 模型，你需要通过 dispatch(action) 去修改他。

```tsx
function reducer(prevState, action) {
    if (action.type === Actions.Search) {
        return { ...prevState, query: action.query };
    }
}
function App() {
    ...
    return <input onChange={(e) => dispatch({ type: Actions.Search, query: e.target.value })} />;
}
```

这个 reducer 就是 js 里面那个 `Array.prototype.reduce` 的参数，没什么特别的。接着 Redux 通过 HOC 或者 Context 将 dispatch 函数注入到组件内即可。

个人看法，他并没有解决原生的任何痛点 —— 只是略微提升了可维护性，代价是需要写三倍代码。

#### Immer.js —— 一次写法上的尝试

Immer.js 和 Redux 都属于不用魔法（Proxy）的那种，这里单独提出来，主要是夸一下他的写法。

```tsx
setState(produce(draft => {
    draft.user.age += 1
}))
```

从原来的 `{ ...prev, new: xxx }` 变成了 `draft.new = xxx`，仅此而已。

个人看法，他让原生的状态变更更加容易编写了，代价仅仅是引入了一个 produce 函数。

#### MobX 以及一类依赖魔法的库

我们知道 Proxy 是可以给 get/set 以及其他属性访问加钩子，那么是否可以把 state 封装成一个 proxy 对象，在他改变的时候通知组件刷新呢？当然可以，MobX 就是此类。具体原理可以看 Vue3 的 Reactivity 文档，这里就不赘述了。

为了接入 React，MobX 给了两个函数 `observe(object)` 和 `observer(Component)`，前者“观察”一个普通对象，返回一个魔法对象，并在每次对象变化时通知所有 observer；后者仅仅是一个 HOC，把刷新通知给 Component。

他其实解决了 Hooks 的一大痛点：名字要写两遍……

```tsx
const [name, setName] = useState("");
setName(e.target.value);
// 对比
const user = observe({ name: "" });
user.name = e.target.name;
```

除了 MobX，还有很多人尝试写过基于 Proxy 的响应式状态管理库，其中一个我要提的是 [react-tracked](https://github.com/dai-shi/react-tracked)，它相比 MobX，对 reducer（熟练使用 react-redux 的人）也非常友好，而且据他的[文档](https://github.com/dai-shi/react-tracked/issues/1#issuecomment-519509857)所说性能也比以上各位都强。

## 状态管理以外 —— 性能问题

诚然，vdom 大部分情况下很快，不过 React 里很容易暴露性能问题，这里单独提一下。

React 刷新的基本单位是组件，具体来说，是该组件里的 setState 触发了他的刷新。由于使用了状态管理，很多状态会被集中到某个上层组件，结果就是每次更新状态都会导致这个上层组件和所有子组件都刷新一次。为了更直观地感受组件被刷新这件事，可以使用 [我编写的这段 Hooks](https://github.com/hyrious/snippets/blob/main/src/useFlasher.ts)。那么如何解决呢，`React.memo`（就是 hooks 版的 PureComponent），默认实现下会根据 props 是否改变（`===`）决定是否刷新，也可以提供第二个参数手动校对更新时机。

```tsx
const PureInput = memo(({ name }) => <input value={name} />)
```

原生条件下我们必须经常使用 useCallback 和 useMemo 和 memo 来优化性能，而使用上面提到的一些库则不需要添加 memo（添加了反而可能会出错），如 MobX 和 react-tracked。
