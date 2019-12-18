# redux-nodes

A productive API for Redux and React

## Why?

Redux is a low level implementation. It makes perfect sense to extend and wrap Redux to make you a happier and a more productive developer. There are several parts of Redux where you would want to increase productivity. From reducers, to action creators, dispatching and also typing. There is many parts that we can improve without disregarding the benefits Redux promises.

## Meet the nodes

Even though **redux-nodes** IS redux, you do not write reducers and manage actions. Rather, it all starts with **nodes**. That means instead of creating a reducer, you create a tree of nodes. After all, the reducers are merged into a state tree.

Instead of:

```js
const myReducer = (state = { foo: 'bar' }, action) => {
  switch (action.type) {
    case 'setFoo': {
      return { ...state, foo: action.payload };
    }
  }

  return state;
};

dispatch({
  type: 'setFoo',
  payload: 'bar2',
});
```

You write:

```js
const tree = {
  foo: value('bar'),
};

dispatch.actions.foo.set('bar2');
```

**value** is a type of node. There are other nodes as well. For example **list**, **dictionary**, **toggle** etc. All these nodes has preset actions that becomes available as methods on the dispatcher. This reduces boilerplate and improves the typing experience.

## Extending nodes

**value** in the example above is a **node**, it is implemented as:

```js
const value = (initialValue, extendedActions) =>
  node(initialValue, {
    set: (currentValue, newValue) => newValue,
    ...extendedActions,
  });
```

So **nodes** can easily be extended. For example:

```js
const shoutableValue = initialValue =>
  value(initialValue, {
    shout: currentValue => currentValue.toUpperCase() + '!!!',
  });

const tree = {
  foo: shoutableValue('bar'),
};

dispatch.actions.foo.shout();
```

Or a more realistic usecase:

```ts
const todos = dictionary<Todo>(
  {},
  {
    toggleCompleted: (currentTodos, id: string) => ({
      ...currentTodos,
      [id]: {
        ...currentTodos[id],
        completed: !currentTodos[id].completed,
      },
    }),
  },
);

dispatch.actions.todos.toggleCompleted('123');
```

As with reducers you can use [Immer](https://immerjs.github.io/immer/docs/introduction):

```ts
const todos = dictionary<Todo>(
  {},
  {
    toggleCompleted: (currentTodos, id: string) =>
      produce(currentTodos, draft => {
        draft[id].completed = !draft[index].completed;
      }),
  },
);
```

## Thunks

You do not get very far with Redux without some thunks. **redux-nodes** has thunks integrated with improved API as well. These thunks are also exposed on the dispatcher.

```ts
const myThunk: Thunk = () => ({ dispatch, actions, thunks, getState }) => {};
```

You can type its payload with:

```ts
const myThunk: Thunk<string> = id => ({ dispatch, actions, thunks, getState }) => {};
```

That means you can easily dispatch actions and also run other thunks directly from a thunk.

```ts
const myThunk: Thunk<string> = id => ({ actions, thunks, getState }) => {
  actions.foo.set('bar2');
  thunks.someOtherThunk();
};
```

## Effects

Your thunks also gets one last property, named **effects**. Effects are the tools and APIs you use in your application logic. That means you should never import tools and use them directly in your thunks. The only exception is pure functions. This will make your code far more testable and you separate out generic code from your application logic. An example being:

Instead of:

```ts
const login: Thunk<{ username: string; password: string }> = ({ username, password }) => async ({ actions }) => {
  const user = await fetch('/auth', {
    method: 'post',
    body: JSON.stringify({ username, password }),
  });

  actions.user.set(user);
};
```

You would write:

```ts
const login: Thunk<{ username: string; password: string }> = ({ username, password }) => async ({
  actions,
  effects,
}) => {
  const user = await effects.api.getUser(username, password);

  actions.user.set(user);
};
```

The **api** effect is something you have defined. It is without magical strings and generic code. But most importantly is that you can type your effects to suite your application needs.

## Wiring up components

**redux-nodes** uses [react-redux](https://react-redux.js.org/) under the hood and allows you to easily set up typed hooks. It also does some improvements on the hooks.

```tsx
const MyComponent: React.FC = () => {
  // This is correctly typed
  const foo = useSelector(state => state.foo);
};
```

```tsx
const MyComponent: React.FC = () => {
  // This is correctly typed
  const { foo, bar } = useSelector({
    foo: state => state.foo,
    bar: state => state.bar,
  });
};
```

You can of course also use a [reselect](https://github.com/reduxjs/reselect) with this selector.

The same goes for the dispatcher. Now that you have actions and thunks on the dispatcher, you can simply:

```tsx
const MyComponent: React.FC = () => {
  // This is correctly typed
  const { actions, thunks } = useDispatch();

  // You can still use the dispatcher "as is"
  const dispatch = useDispatch();
};
```

You expose the store to React by using the Provider:

```jsx
import { render } from 'react-dom';
import { Provider } from 'redux-nodes';
import { store } from './store';

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('#app'),
);
```

## Get started

You will typically set up your project with:

```
store | index.ts
      | thunks.ts
      | tree.ts
      | effects.ts
```

**index.ts**

```ts
import { createStore, TState, TDispatch, TThunk, createSelectorHook, createDispatchHook } from 'redux-nodes';
import { tree } from './tree';
import * as thunks from './thunks';
import * as effects from './effects';

type State = TState<typeof tree>;

// We use an interface here due to circular lookups
interface Dispatch extends TDispatch<typeof tree, typeof thunks> {}

// We export the Thunk as we will use it in our "thunks" file(s)
export type Thunk<T = void> = TThunk<T, Dispatch, State, typeof effects>;

export const store = createStore(tree, thunks, effects, {
  enhancers: [],
  middlewares: [],
  preloadedState: {},
});

export const useSelector = createSelectorHook<State>();

export const useDispatch = createDispatchHook<Dispatch>();
```

**thunks.ts**

```ts
// "value" is typed as string, everything else is typed as well
export const doSomething: Thunk<string> = value => ({ dispatch, actions, thunks, getState, effects }) => {};
```

**tree.ts**

```ts
import { node, value, dictionary, list, toggle, num } from 'redux-nodes';

export const tree = {
  // The core "node" has no actions, you will have to define them
  customNode: node('foo', {
    someAction: (currentValue, arg1: string, arg2: number) => currentValue,
  }),

  // Comes with a "set" action, which can be extended like above
  value: value<string>(null),

  // Extends "value" with additional "add" and "remove" actions, can be extended
  dictionary: value<string>({}),

  // Extends "value" with additional "add" and "remove" actions, can be extended
  list: list<string>([]),

  // Extends "value" with additional "increment" and "decrement" actions, can be extended
  num: num(1),

  // Extends "value" with additional "toggle" action, can be extended
  toggle: toggle(true),
};
```

**effects.ts**

```ts
export const api = {
  getUser(): Promise<User> {
    return fetch('/user').then(response => response.json());
  },
};
```

## Scaling up

Scaling up is very straight forward. Instead of having just a **store** folder, you would create namespaces and bring them together in your main store file:

```
store | index.ts
      | effects.ts

      | namespaceA | index.ts
                   | tree.ts

      | namespaceB | index.ts
                   | tree.ts
```

```ts
import { createStore, TState, TDispatch, TThunk, createSelectorHook, createDispatchHook } from 'redux-nodes';
import * as namespaceA from './namespaceA';
import * as namespaceB from './namespaceB';
import * as effects from './effects';

const tree = {
  namespaceA: namespaceA.tree,
  namespaceB: namespaceB.tree,
};

const thunks = {
  namespaceA: namespaceA.thunks,
  namespaceB: namespaceB.thunks,
};

type State = TState<typeof tree>;

// We use an interface here due to circular lookups
interface Dispatch extends TDispatch<typeof tree, typeof thunks> {}

// We export the Thunk as we will use it in our "thunks" file(s)
export type Thunk<T = void> = TThunk<T, Dispatch, State, typeof effects>;

export const store = createStore(tree, thunks, effects, {
  enhancers: [],
  middlewares: [],
  preloadedState: {},
});

export const useSelector = createSelectorHook<State>();

export const useDispatch = createDispatchHook<Dispatch>();
```

## Devtools

When you fire actions on the dispatcher those will appear in the Redux devtools as `some.path.in.tree.@@SET`.
