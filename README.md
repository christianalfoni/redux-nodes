# redux-nodes

Replacing reducers with nodes

## Why?

Even though reducers are a good low level concept for defining state and managing the state using actions, there are other abstractions that can help our productivity and hapiness as developers. **redux-nodes** allows you to rather define a state tree of nodes that is converted into a reducer, giving you fully typed state and actions right out of the box. Basically it is a Typescript first API.

## Meet the nodes

Even though **redux-nodes** IS redux, you do not write reducers and manage actions. Rather, it all starts with **nodes**. That means instead of creating a reducer, you create a tree of nodes. After all, the reducers are merged into a state tree, it is the same with the **nodes**.

Instead of:

```js
const reducer = (state = { foo: 'bar' }, action) => {
  switch (action.type) {
    case 'setFoo': {
      return { ...state, foo: action.payload };
    }
  }

  return state;
};

const store = createStore(reducer);

store.dispatch({
  type: 'setFoo',
  payload: 'bar2',
});
```

You write:

```js
const { reducer, actions } = createNodes({
  foo: value('bar'),
});

const store = createStore(reducer);

store.dispatch(actions.foo.set('bar2'));
```

**value** is a type of node. It is a node that gives you a **set** action. There are other nodes as well. For example **list**, **dictionary**, **toggle** etc. All these nodes has preset actions that becomes available as typed methods on the **actions**. This reduces boilerplate and improves the typing experience.

## Extending nodes

**value** in the example above is a **node**, more specifically it has been extended from **node**. You can also extend the nodes to add domain specific actions to your state. For example we can create a dictionary where we can toggle todos:

```ts
const todos = dictionary<Todo>({}).extend({
  toggleCompleted: (currentTodos, id: string) => ({
    ...currentTodos,
    [id]: {
      ...currentTodos[id],
      completed: !currentTodos[id].completed,
    },
  }),
});

const { reducer, actions } = createNodes({
  todos,
});

const store = createStore(reducer);

store.dispatch(actions.todos.toggleCompleted('123'));
```

As with reducers you can use [Immer](https://immerjs.github.io/immer/docs/introduction) to express complex changes better:

```ts
const todos = dictionary<Todo>({}).extend({
  toggleCompleted: (currentTodos, id: string) =>
    produce(currentTodos, draft => {
      draft[id].completed = !draft[index].completed;
    }),
});
```

But we can create completely new reusable nodes as well:

```ts
const uniqueList = <T>(initialList: T[]) =>
  value(initialList).extend({
    add: (currentList, item: T) => {
      if (currentList.includes(item)) {
        return currentList;
      }

      return currentList.concat(item);
    },
    remove: (currentList, item: T) => currentList.filter(currentItem => currentItem !== item),
  });

const { reducer, actions } = createNodes({
  foo: uniqueList<string>(['foo']),
});

const store = createStore(reducer);

// Does not add "foo", as it is already there
store.dispatch(actions.foo.add('foo'));
```

## Devtools

When you fire actions on the dispatcher those will appear in the Redux devtools as `some.path.in.state.@@SET`, where `@@` represent the action fired.
