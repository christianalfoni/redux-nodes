import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import {
  Action,
  DeepPartial,
  Dispatch,
  Store,
  StoreEnhancer,
  applyMiddleware,
  compose,
  createStore as createReduxStore,
} from 'redux';

import { ACTION, NODE, PATH } from './constants';

export { Provider } from 'react-redux';

export * from './nodes';

export type TAction<T, K extends any[]> = (value: T, ...payload: K) => T;

export interface TActions<T> {
  [key: string]: TAction<T, any>;
}

export type TThunk<
  T,
  D extends TDispatch<any, any>,
  State extends TState<any>,
  Effects extends { [key: string]: any } = {}
> = T extends void
  ? () => (context: {
      dispatch: D;
      actions: D['actions'];
      thunks: D['thunks'];
      getState: () => State;
      effects: Effects;
    }) => void
  : (
      payload: T,
    ) => (context: {
      dispatch: D;
      actions: D['actions'];
      thunks: D['thunks'];
      getState: () => State;
      effects: Effects;
    }) => void;

export interface TThunks {
  [key: string]: TThunk<any, any, any, any> | TThunks;
}

export interface TNode<T, K extends TActions<any>> {
  [NODE]: true;
  value: T;
  actions: K;
}

export interface TTree {
  [key: string]: TNode<any, any> | TTree;
}

export type TState<T extends TTree> = {
  [K in keyof T]: T[K] extends TNode<infer V, any> ? V : T[K] extends TTree ? TState<T[K]> : never;
};

type RawThunks<T extends TThunks> = {
  [U in keyof T]: T[U] extends TThunk<infer P, any, any>
    ? P extends void
      ? () => void
      : (payload: P) => void
    : T[U] extends TThunks
    ? RawThunks<T[U]>
    : never;
};

export type TDispatch<T extends TTree, U extends TThunks> = Dispatch<Action> & {
  actions: {
    [K in keyof T]: T[K] extends TNode<any, infer A>
      ? {
          [B in keyof A]: A[B] extends TAction<any, infer P> ? (...payload: P) => void : never;
        }
      : T[K] extends TTree
      ? TState<T[K]>
      : never;
  };
  thunks: RawThunks<U>;
};

interface TActionPayload {
  type: string;
  payload: any;
  [PATH]: string[];
  [ACTION]: TAction<any, any>;
}

type StateSelector<State> = (state: State) => any;

interface StateSelectors<State> {
  [key: string]: (state: State) => any;
}

export function createSelectorHook<State extends TState<any>>() {
  return <T extends StateSelector<State> | StateSelectors<State>>(
    selector: T,
  ): T extends StateSelector<State>
    ? ReturnType<T>
    : T extends StateSelectors<State>
    ? { [U in keyof T]: ReturnType<T[U]> }
    : never => {
    if (typeof selector === 'function') {
      return useSelector(selector as any);
    } else {
      return useSelector(
        (state: State) =>
          Object.keys(selector).reduce((aggr, key) => {
            aggr[key] = selector[key](state);

            return aggr;
          }, {}),
        shallowEqual,
      ) as any;
    }
  };
}

export function createDispatchHook<D extends TDispatch<any, any>>() {
  return () => useDispatch<D>();
}

export function createStore<
  T extends TTree,
  U extends TThunks,
  E extends {
    [key: string]: any;
  }
>(
  {
    tree,
    thunks = {} as U,
    effects = {} as E,
  }: {
    tree: T;
    thunks?: U;
    effects?: E;
  },
  options: {
    preloadedState?: DeepPartial<TState<T>>;
    middlewares?: any[];
    enhancers?: StoreEnhancer[];
  } = {},
): Store<TState<T>, any> & {
  dispatch: TDispatch<T, any>;
} {
  let dispatch;

  function traverseTree(target, cb, path = []) {
    return Object.keys(target).reduce((aggr, key) => {
      aggr[key] = target[key][NODE] ? cb(target[key], path.concat(key)) : traverseTree(target[key], path.concat(key));

      return aggr;
    }, {});
  }

  const state = traverseTree(tree, node => node.value) as any;
  const actions = traverseTree(tree, (node, path) =>
    Object.keys(node.actions).reduce((aggr, key) => {
      aggr[key] = (...payload) =>
        dispatch({
          type: path.concat(`@@${key.toUpperCase()}`).join('.'),
          [PATH]: path,
          payload,
          [ACTION]: node.actions[key],
        });

      return aggr;
    }, {}),
  ) as any;
  const store = createReduxStore(
    (currentState = state, action: TActionPayload) => {
      if (!action[ACTION]) {
        return currentState;
      }

      const value = action[PATH].reduce((aggr: any, key) => aggr[key], currentState);
      const newValue = action[ACTION](value, ...action.payload);
      let newState = currentState;

      if (value !== newValue) {
        newState = { ...newState };

        const currentStateLevel = newState as any;

        action[PATH].forEach((key, index) => {
          currentStateLevel[key] = index === action[PATH].length - 1 ? newValue : { ...currentStateLevel[key] };
        });
      }

      return newState;
    },
    options.preloadedState,
    compose(
      applyMiddleware(
        ...(options.middlewares || []).concat(({ getState }) => next => action => {
          if (typeof action === 'function') {
            return action({
              dispatch,
              actions: dispatch.actions,
              thunks: dispatch.thunks,
              getState,
              effects,
            });
          }

          next(action);
        }),
      ),
      ...(options.enhancers || []),
    ),
  );

  dispatch = store.dispatch;

  Object.assign(store.dispatch, {
    actions,
    thunks,
  });

  return store as any;
}
