# redux-nodes

A Typescript friendly replacement for reducers

## Why?

Even though reducers are a great low level concept for defining and changing state, we can benefit from creating an abstraction over these reducers to make us more productive and happier. **redux-nodes** allows you to define a state tree of nodes that results in fully typed state and action creators.

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

// We create our store passing in our create reducer
const store = createStore(reducer);

store.getState(); // { "count": 0 }
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
  // using plain imperative API
  {
    increment: state => state.count++,
  },
);

// The "buildNodes" also returns our "action creators"
const { reducer, actionCreators } = buildNodes(countNode);
const store = createStore(reducer);

// We dispatch by calling our action creator, which
// returns the action
store.dispatch(actionCreators.increment());

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

const { reducer, actionCreators } = buildNodes(countNode);
const store = createStore(reducer);

// They will also be typed here
store.dispatch(actionCreators.increment(2));

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

const { reducer, actionCreators } = buildNodes(countNode);
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

const { reducer, actionCreators } = buildNodes({
  auth,
  dashboard,
});
const store = createStore(reducer);

store.dispatch(actionCreators.auth.setJwt('123'));
```

You can nest these nodes however you want:

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

const { reducer, actionCreators } = buildNodes({
  auth,
  dashboard: {
    admin,
    issues
  },
});
const store = createStore(reducer);

store.dispatch(actionCreators.dashboard.admin.toggleView());
```

## Devtools

When you fire actions on the dispatcher those will appear in the Redux devtools with a type of `dashboard.admin.toggleView`, and a `payload` property, being an array of arguments.
