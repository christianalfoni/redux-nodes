# redux-nodes
Nodes instead of reducers

## Why?

Instead of writing:

```js
const myReducer = (state = { foo: 'bar' }, action) => {
  switch (action.type) {
    case 'setFoo': {
      return { ...state, foo: action.payload }
    }
  }
  
  return state
}

dispatch({
  type: 'setFoo',
  payload: 'bar2'
})
```

You write:

```js
const tree = {
  foo: value('bar')
}

dispatch.foo.set('bar2')
```

Most of the state you define in your reducers are related to the same type of changes. Creating actions, action creators etc. is a lot of work for doing the same stuff over and over. **Nodes** allows you define how a value should be defined and changed.

## The benfits

- Far less syntax required for the same guarantees
- An expressive API to define the types of state values you want to work with
- Can easily be extended, for example a list of Todos can be a **list** with an addition of **toggleCompleted**

## Extendable

**value** in the example above is a **node**, it is implemented as:

```js
const value = (value, extendedActions) => node(value, {
  set: (currentValue, newValue) => newValue,
  ...extendedActions
})
```

So **nodes** can easily be extended. For example:

```js
const shoutableValue = (initialValue) => value(initialValue, {
  shout: (currentValue) => currentValue.toUpperCase() + '!!!'
})

const tree = {
  foo: shoutableValue('bar')
}

dispatch.foo.shout()
```

Or a more realistic usecase:

```js
const todos = list([], {
  toggleCompleted: (currentList, index) => [
    ...currentList.slice(0, index),
    {
      ...currentList[index],
      currentList[index].completed: !currentList[index].completed,
    },
    ...currentList.slice(index)
  ]
})
```

Where [Immer](https://immerjs.github.io/immer/docs/introduction) can help you by doing:

```js
const todos = list([], {
  toggleCompleted: (currentList, index) => produce(currentList, draft => {
    currentList[index].completed = !currentList[index].completed
  })
})
```

## Amazeballs typing

All the state and action dispatches are typed out of the box. That means a list of Todos could be expressed as:

```ts
const todos = list<Todo>([])

dispatch.todos.add({
 // Typed as Todo
})
```

Look at the **default nodes** for inspiration.

## Get going

```ts
import { createStore, TState, TDispatch } from '
```
