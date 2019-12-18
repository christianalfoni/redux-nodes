import { TDispatch, TState, TThunk, createStore, value } from '..';

const state = {
  foo: value('bar'),
  test: {
    bar: value('baz'),
  },
};

const changeFooThunk: Thunk<string> = newValue => ({ actions }) => {
  actions.foo.set(newValue);
};

const thunks = {
  changeFooThunk,
};

const effects = {};

type State = TState<typeof state>;

interface Dispatch extends TDispatch<typeof state, typeof thunks> {}

type Thunk<T = void> = TThunk<T, Dispatch, State, typeof effects>;

function getStore() {
  return createStore(
    { state, thunks, effects },
    {
      enhancers: [],
    },
  );
}

test('should have state', () => {
  const store = getStore();
  expect(store.getState().foo).toBe('bar');
});

test('should trigger thunks', () => {
  const store = getStore();
  store.dispatch.thunks.changeFooThunk('test');
  store.dispatch.actions.test.bar.set('blip');

  expect(store.getState().foo).toBe('test');
  expect(store.getState().test.bar).toBe('blip');
});
