import { createStore } from 'redux';

import { buildNodes, node } from '..';

test('should have state', () => {
  const foo = node({
    foo: 'bar',
  });
  const { reducer } = buildNodes(foo);
  const store = createStore(reducer);
  expect(store.getState().foo).toBe('bar');
});

test('should trigger actions, also nested', () => {
  const foo = node(
    {
      foo: 'bar',
    },
    {
      changeFoo: (state, newFoo: string) => (state.foo = newFoo),
    },
  );
  const bar = node(
    {
      foo: 'bar',
    },
    {
      changeFoo: (state, newFoo: string) => (state.foo = newFoo),
    },
  );

  const { reducer, actionCreators: actions } = buildNodes({
    foo,
    test: {
      bar,
    },
  });
  const store = createStore(reducer);
  store.dispatch(actions.foo.changeFoo('test'));
  store.dispatch(actions.test.bar.changeFoo('blip'));

  expect(store.getState().foo.foo).toBe('test');
  expect(store.getState().test.bar.foo).toBe('blip');
});

test('should handle general dispatches', () => {
  const foo = node(
    {
      foo: 'bar',
    },
    {
      changeFoo: (state, newFoo: string) => (state.foo = newFoo),
    },
    (state, action) => {
      if (action.type === 'test.bar.changeFoo') {
        state.foo = 'testBarChanged';
      }
    },
  );
  const bar = node(
    {
      foo: 'bar',
    },
    {
      changeFoo: (state, newFoo: string) => (state.foo = newFoo),
    },
    (state, action) => {
      if (action.type === 'foo.changeFoo') {
        state.foo = 'fooChanged';
      }
    },
  );

  const { reducer, actionCreators: actions } = buildNodes({
    foo,
    test: {
      bar,
    },
  });
  const store = createStore(reducer);
  store.dispatch(actions.foo.changeFoo('test'));
  expect(store.getState().foo.foo).toBe('test');
  expect(store.getState().test.bar.foo).toBe('fooChanged');
  store.dispatch(actions.test.bar.changeFoo('blip'));
  expect(store.getState().foo.foo).toBe('testBarChanged');
  expect(store.getState().test.bar.foo).toBe('blip');
});

test('should trigger change', () => {
  expect.assertions(1);
  const foo = node(
    {
      foo: 'bar',
    },
    {
      changeBar: (state, newFoo: string) => (state.foo = newFoo),
    },
  );
  const { reducer, actionCreators } = buildNodes(foo);
  const store = createStore(reducer);
  store.subscribe(() => {
    expect(store.getState().foo).toBe('bar2');
  });
  store.dispatch(actionCreators.changeBar('bar2'));
});
