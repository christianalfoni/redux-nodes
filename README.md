# redux-nodes

Reducer nodes for typing out of the box

## Why?

Even though reducers are a great low level concept for defining and changing state, we can benefit from creating an abstraction over these reducers to make us more productive and happier. **redux-nodes** allows you to define a state tree of nodes that results in fully typed state and action creators.

## Example

[![Edit redux-nodes](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/focused-cache-ed22i?fontsize=14&hidenavigation=1&theme=dark)

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

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

enum Filter {
  ALL,
  COMPLETED,
  ACTIVE,
}

const app = node({
  todos: [] as Todo[],
  filter: Filter.ALL,
});

const { reducer, selectors: stateSelectors } = buildNodes(app);

const store = createStore(reducer);

const visibleTodos = createSelector(stateSelectors.todos, stateSelectors.filter, (todos, filter) => {
  switch (filter) {
    case Filter.SHOW_ALL:
      return todos;
    case Filter.SHOW_COMPLETED:
      return todos.filter(t => t.completed);
    case Filter.SHOW_ACTIVE:
      return todos.filter(t => !t.completed);
    default:
      throw new Error("Unknown filter: " + filter);
})

const selectors = {
  ...stateSelectors,
  visibleTodos,
};
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

## Devtools

When you fire actions on the dispatcher those will appear in the Redux devtools with a type of `dashboard.admin.toggleView`, and a `payload` property, being an array of arguments.
