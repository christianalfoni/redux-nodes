# redux-nodes

Simply typed state, actions and selectors

## Why?

Even though reducers are a great low level concept for defining and changing state, we can benefit from creating an abstraction over these reducers to make us more productive and happier. **redux-nodes** allows you to define a state tree of nodes that results in fully typed state, actions (action creators) and selectors.

### Introduction clip

[![INTRODUCTION](https://img.youtube.com/vi/jDa8N5-tmlo/0.jpg)](https://www.youtube.com/watch?v=jDa8N5-tmlo)

## Examples

**simple example**

[![Edit redux-nodes](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/focused-cache-ed22i?fontsize=14&hidenavigation=1&theme=dark)

**todomvc**

[![Edit redux-nodes todomvc](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/rough-dawn-wdce2?fontsize=14&hidenavigation=1&theme=dark)

## Defining state

```ts
import { buildNodes, node } from 'redux-nodes';
import { createStore } from 'redux';

// Lets start defining a single node
const countNode = node({
  count: 0,
});

// We build the nodes and get back a "reducer"
const { reducer } = buildNodes(countNode);

// We create our store passing in our reducer
const store = createStore(reducer);

store.getState(); // { "count": 0 }
```

## Selectors

```ts
import { buildNodes, node } from 'redux-nodes';
import { createStore } from 'redux';

const countNode = node({
  count: 0,
});

const { reducer, selectors } = buildNodes(countNode);

const store = createStore(reducer);

selectors.count(store.getState()); // 0
```

Selectors are used with libraries like [reselect](https://github.com/reduxjs/reselect) and [react-redux](https://react-redux.js.org/). This feature basically removes any need for typing.

```ts
import { createSelector } from 'reselect';
import { buildNodes, node } from 'redux-nodes';
import { createStore } from 'redux';

const app = node({
  items: [] as string[],
  filterUpperCase: true,
});

// We use the "selectors" and name them "stateSelectors", as we are going
// to add an additional custom selector using "reselect"
const { reducer, selectors: stateSelectors } = buildNodes(app);

export const store = createStore(reducer);

// We create our custom selector and can safely just use existing selectors
// created for us, as they are typed. That means "items" and "filterUpperCase" is
// correctly typed
const filteredItems = createSelector(stateSelectors.items, stateSelectors.filterUpperCase, (items, filterUpperCase) => {
  if (filterUpperCase) {
    return items.filter(item => item.toUpperCase() !== item);
  }
  return items;
});

// Now we create our complete selectors object where we bring
// in the custom selector as well
export const selectors = {
  ...stateSelectors,
  filteredItems,
};
```

In a component you would do something like:

```tsx
import * as React from 'react'
import { useSelector } from 'react-redux'
import { selectors } from '../store'

export const MyComponent: React.FC = () => {
  // When using the "useSelector" for React you combine it with
  // your existing selectors, which results in typed values. No
  // need to type "react-redux" itself
  const filteredItems = useSelector(selectors.filteredItems)

  return <div>{...}</div>
}
```

## Defining actions

```ts
import { buildNodes, node } from 'redux-nodes';
import { createStore } from 'redux';

const countNode = node(
  {
    count: 0,
  },
  // The second argument is the actions to be managed and
  // what state should change related to that action. "Immer"
  // is running under the hood and allows us to express changes
  // with the mutable API of JavaScript, though with an immutable
  // result
  {
    increment: state => state.count++,
  },
);

// The "buildNodes" also returns our "actions" (action creators)
const { reducer, actions = buildNodes(countNode);
const store = createStore(reducer);

// We dispatch by calling our action creator, which
// returns the action
store.dispatch(actions.increment());

store.getState(); // { "count": 1 }
```

## Passing a payload

```ts
import { buildNodes, node } from 'redux-nodes';
import { createStore } from 'redux';

const countNode = node(
  {
    count: 0,
  },
  {
    // You can define as many arguments as you want and type them
    increment: (state, amount: number = 1) => state.count + amount,
  },
);

const { reducer, actions } = buildNodes(countNode);
const store = createStore(reducer);

// The typing will be reflected when calling the
// action creator
store.dispatch(actions.increment(2));

store.getState(); // { "count": 2 }
```

## Other actions

```ts
import { buildNodes, node } from 'redux-nodes';
import { createStore } from 'redux';

const countNode = node(
  {
    count: 0,
  },
  {
    increment: (state, amount: number = 1) => state.count + amount,
  },
  // The third argument is a plain reducer, which can handle any action
  (state, action) => {
    switch (action.type) {
      case 'custom-action':
        state.count = action.payload;
    }
  },
);

const { reducer } = buildNodes(countNode);
const store = createStore(reducer);

store.dispatch({
  type: 'custom-action',
  payload: 5,
});

store.getState(); // { "count": 5 }
```

## Thunk

```ts
import { buildNodes, node } from 'redux-nodes';
import { createStore, applyMiddleware } from 'redux';

const countNode = node(
  {
    count: 0,
  },
  {
    increment: (state, amount: number = 1) => state.count + amount,
  },
);

// The "createThunk" factory creates a typed function to create
// thunks
const { reducer, actions, createThunk } = buildNodes(countNode);

// When creating the thunk you get both a function to create thunks
// and the middleware back. If you already have the middleware, you
// do not have to add it again
const { thunk, middleware } = createThunk();

// We use the middleware with Redux
const store = createStore(reducer, applyMiddleware(middleware));

// The thunk function is now typed with the state and you can custom type
// any arguments, as shown with "incrementBy" below
const incrementThunk = thunk((incrementBy: number) => (dispatch, getState) => {
  dispatch(actions.increment(incrementBy));
});

store.dispatch(incrementThunk(2));
```

The **redux-thunk** middleware can also provide a third argument. This argument is valuable to inject APIs. It is considered good practice to expose all impure APIs (side effects) through this argument. The reason being that thunks becomes way easier to test and it creates a good separation of generic APIs and application specific APIs. As an example:

```ts
import { buildNodes, node } from 'redux-nodes';
import { createStore, applyMiddleware } from 'redux';

const auth = node(
  {
    username: null as string,
  },
  {
    setUsername: (state, username: string) => (state.username = username),
  },
);

const { reducer, actions, createThunk } = buildNodes(auth);

// We pass our impure APIs (side effects) to the "createThunk" factory
const { thunk, middleware } = createThunk({
  api: {
    getUser: (): Promise<{ username: string }> => fetch('/api/user').then(response => response.json()),
  },
});

const store = createStore(reducer, applyMiddleware(middleware));

// That last argument I personally like to call "effects" as it indicates
// side effects of your application
const getUser = thunk(() => async (dispatch, getState, effects) => {
  const user = await effects.api.getUser();

  dispatch(actions.setUsername(user.username));
});

store.dispatch(getUser());
```

## Scaling up

```ts
import { buildNodes, node } from 'redux-nodes';
import { createStore } from 'redux';
import { User, Issue, Project } from './types';

// We create one "auth" node
const auth = node(
  {
    user: null as User,
    jwt: null as string,
  },
  {
    setUser: (state, user: User) => (state.user = user),
    setJwt: (state, jwt: string) => (state.jwt = jwt),
  },
);

// And also a "dashboard" node
const dashboard = node(
  {
    issues: [] as Issue[],
    projects: [] as Project[],
  },
  {
    addIssue: (state, issue: Issue) => state.issues.push(issue),
    addProject: (state, project: Project) => state.projects.push(project),
  },
);

// We put the nodes into a tree, effectively namespacing the
// state and actions with "auth" and "dashboard"
const { reducer, actions } = buildNodes({
  auth,
  dashboard,
});
const store = createStore(reducer);

store.dispatch(actions.auth.setJwt('123'));

store.getState().auth.jwt; // "123"
```

You can nest these nodes into the tree in any matter, effectively namespacing your state and actions:

```ts
import { buildNodes, node } from 'redux-nodes';
import { createStore } from 'redux';
import { User, Issue, Project } from './types';

const auth = node(
  {
    user: null as User,
    jwt: null as string,
  },
  {
    setUser: (state, user: User) => (state.user = user),
    setJwt: (state, jwt: string) => (state.jwt = jwt),
  },
);

const admin = node(...)
const issues = node(...)

// We inserted "admin" and "issues" under the "dashboard" namespace
const { reducer, actions } = buildNodes({
  auth,
  dashboard: {
    admin,
    issues
  },
});
const store = createStore(reducer);

store.dispatch(actions.dashboard.admin.toggleView());
store.getState().dashboard.admin.foo // "bar"
```

## Organizing a project

In the examples above we have inlined all our code. In a real project you would split up your logic. Some developers prefer colocating the store logic with the components by features, others completely separates the store from the components. This is of course up to you, but in this example we will split the store and the components.

```
components |
           | App.tsx
store |
      | index.ts
      | adi
```

## Devtools

When you fire actions on the dispatcher those will appear in the Redux devtools with a type of `dashboard.admin.toggleView`, and a `payload` property, being an array of arguments.
