import { applyMiddleware, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';

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

  const { reducer, actions } = buildNodes({
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

  const { reducer, actions } = buildNodes({
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
  const { reducer, actions } = buildNodes(foo);
  const store = createStore(reducer);
  store.subscribe(() => {
    expect(store.getState().foo).toBe('bar2');
  });
  store.dispatch(actions.changeBar('bar2'));
});

test('should expose selectors', () => {
  expect.assertions(1);
  const foo = node({
    foo: 'bar',
  });
  const { reducer, selectors } = buildNodes(foo);
  const store = createStore(reducer);

  expect(selectors.foo(store.getState())).toBe('bar');
});

test('should expose nested selectors', () => {
  expect.assertions(1);
  const foo = node({
    foo: 'bar',
  });
  const { reducer, selectors } = buildNodes({
    foo,
  });
  const store = createStore(reducer);

  expect(selectors.foo.foo(store.getState())).toBe('bar');
});

test('should create thunk', () => {
  expect.assertions(1);
  const foo = node(
    {
      foo: 'bar',
    },
    {
      changeFoo: (state, newFoo: string) => {
        state.foo = newFoo;
      },
    },
  );
  const { reducer, actions, createThunk } = buildNodes(foo);
  const { thunk, middleware } = createThunk({
    upperCase: (value: string) => value.toUpperCase(),
  });
  const store = createStore(reducer, applyMiddleware(middleware));
  const test = thunk((payload: string) => (dispatch, getState, effects) => {
    dispatch(actions.changeFoo(effects.upperCase(getState().foo + payload)));
  });

  store.dispatch(test('koko'));
  expect(store.getState().foo).toBe('BARKOKO');
});
