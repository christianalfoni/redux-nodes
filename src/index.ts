import { ACTION, NODE, PATH } from './constants';

export * from './nodes';

export type TAction<T, K extends any[]> = (value: T, ...payload: K) => T;

export interface TActions<T> {
  [key: string]: TAction<T, any>;
}

export interface TNode<T, K extends TActions<T>> {
  [NODE]: true;
  value: T;
  actions: K;
  extend: <A extends TActions<T>>(actions: A) => TNode<T, A & K>;
}

export interface TTree {
  [key: string]: TNode<any, any> | TTree;
}

export type TState<T extends TTree> = {
  [K in keyof T]: T[K] extends TNode<infer V, any> ? V : T[K] extends TTree ? TState<T[K]> : never;
};

export type TActionCreators<T extends TTree> = {
  [K in keyof T]: T[K] extends TNode<any, infer A>
    ? {
        [U in keyof A]: A[U] extends TAction<any, infer P> ? (...payload: P) => TActionPayload : never;
      }
    : T[K] extends TTree
    ? TActionCreators<T[K]>
    : never;
};

interface TActionPayload {
  type: string;
  payload: any;
  [PATH]: string[];
  [ACTION]: TAction<any, any>;
}

export function createNodes<T extends TTree>(
  nodes: T,
): {
  reducer: (state: TState<T>, action: TActionPayload) => TState<T>;
  actions: TActionCreators<T>;
} {
  function traverseTree(target, cb, path = []) {
    return Object.keys(target).reduce((aggr, key) => {
      aggr[key] = target[key][NODE]
        ? cb(target[key], path.concat(key))
        : traverseTree(target[key], cb, path.concat(key));

      return aggr;
    }, {});
  }

  const state = traverseTree(nodes, node => node.value) as any;
  const actions = traverseTree(nodes, (node, path) =>
    Object.keys(node.actions).reduce((aggr, key) => {
      aggr[key] = (...payload) => ({
        type: path.concat(`@@${key.toUpperCase()}`).join('.'),
        [PATH]: path,
        payload,
        [ACTION]: node.actions[key],
      });

      return aggr;
    }, {}),
  ) as any;
  const reducer = (currentState = state, action: TActionPayload) => {
    if (!action[ACTION]) {
      return currentState;
    }

    const value = action[PATH].reduce((aggr: any, key) => aggr[key], currentState);
    const newValue = action[ACTION](value, ...action.payload);
    let newState = currentState;

    if (value !== newValue) {
      newState = { ...newState };

      let currentStateLevel = newState as any;

      action[PATH].forEach((key, index) => {
        currentStateLevel = currentStateLevel[key] =
          index === action[PATH].length - 1 ? newValue : { ...currentStateLevel[key] };
      });
    }

    return newState;
  };

  return {
    actions,
    reducer,
  };
}
