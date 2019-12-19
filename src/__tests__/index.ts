import { createStore } from 'redux';

import { createNodes, dictionary, list, node, value } from '..';

function getInstance() {
  const foo = value('bar');
  const bar = value('baz');

  const { reducer, actions } = createNodes({
    foo,
    test: {
      bar,
    },
  });

  const store = createStore(reducer);

  return {
    store,
    actions,
  };
}

test('should have state', () => {
  const { store } = getInstance();
  expect(store.getState().foo).toBe('bar');
});

test('should trigger thunks', () => {
  const { store, actions } = getInstance();
  store.dispatch(actions.foo.set('test'));
  store.dispatch(actions.test.bar.set('blip'));

  expect(store.getState().foo).toBe('test');
  expect(store.getState().test.bar).toBe('blip');
});
