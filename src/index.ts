import produce from 'immer';

const NODE = Symbol('NODE');
const ACTION = Symbol('ACTION');
const PATH = Symbol('PATH');

export type TAction<T, K extends any[]> = (value: T, ...payload: K) => void;

export interface IActions<T> {
  [key: string]: TAction<T, any>;
}

export interface INode<T extends {}, K extends IActions<any>> {
  [NODE]: true;
  value: T;
  actions: K;
  reducer: (state: T, action: { type: string; [key: string]: any }) => void;
}

export type TTree =
  | INode<any, any>
  | {
      [key: string]: INode<any, any> | TTree;
    };

export type TState<T extends TTree> = T extends INode<infer V, any>
  ? V
  : {
      [K in keyof T]: T[K] extends INode<infer VV, any> ? VV : T[K] extends TTree ? TState<T[K]> : never;
    };

export type TActionCreators<T extends TTree> = T extends INode<any, infer A>
  ? {
      [U in keyof A]: A[U] extends TAction<any, infer P> ? (...payload: P) => IActionPayload : never;
    }
  : {
      [K in keyof T]: T[K] extends INode<any, infer AA>
        ? {
            [U in keyof AA]: AA[U] extends TAction<any, infer P> ? (...payload: P) => IActionPayload : never;
          }
        : T[K] extends TTree
        ? TActionCreators<T[K]>
        : never;
    };

export type TSelectors<T extends TTree> = T extends INode<infer V, any>
  ? {
      [P in keyof V]: (state: TState<T>) => V[P];
    }
  : {
      [K in keyof T]: T[K] extends INode<infer VV, any>
        ? {
            [PP in keyof VV]: (state: TState<T>) => VV[PP];
          }
        : T[K] extends TTree
        ? TSelectors<T[K]>
        : never;
    };

interface IActionPayload {
  type: string;
  payload: any;
  [PATH]: string[];
  [ACTION]: TAction<any, any>;
}

export function node<T extends { [key: string]: any }, K extends IActions<T>>(
  value: T,
  actions: K = {} as K,
  reducer?: (state: T, action: { type: string; [key: string]: any }) => void,
): INode<T, K> {
  return {
    [NODE]: true,
    value,
    actions,
    reducer,
  };
}

export function buildNodes<T extends TTree>(
  tree: T,
): {
  reducer: (state: TState<T> | undefined, action: any) => TState<T>;
  actions: TActionCreators<T>;
  selectors: TSelectors<T>;
} {
  function traverseTree(target, cb, path = []) {
    return Object.keys(target).reduce((aggr, key) => {
      aggr[key] = target[key][NODE]
        ? cb(target[key], path.concat(key))
        : traverseTree(target[key], cb, path.concat(key));

      return aggr;
    }, {});
  }

  function convertActions(actionsNode, path) {
    return Object.keys(actionsNode.actions).reduce((aggr, key) => {
      aggr[key] = (...payload) => ({
        type: path.concat(key).join('.'),
        [PATH]: path,
        payload,
        [ACTION]: actionsNode.actions[key],
      });

      return aggr;
    }, {});
  }

  function createSelectors(selectorsNode, path) {
    return Object.keys(selectorsNode.value).reduce((aggr, key) => {
      aggr[key] = selectorState => path.concat(key).reduce((stateAggr, stateKey) => stateAggr[stateKey], selectorState);

      return aggr;
    }, {});
  }

  function getReducers(reducersNode: TTree, path = [], result = []) {
    if (reducersNode[NODE] && reducersNode.reducer) {
      result.push({
        path: path.slice(),
        reducer: reducersNode.reducer,
      });
    } else if (!reducersNode[NODE]) {
      Object.keys(reducersNode).forEach(key => {
        getReducers(reducersNode[key], path.concat(key), result);
      });
    }

    return result;
  }

  function updateState(currentState, path, cb) {
    const value = path.reduce((aggr: any, key) => aggr[key], currentState);
    const newValue = produce(value, cb);
    let newState = currentState;

    if (value !== newValue) {
      newState = { ...newState };
      let currentStateLevel = newState as any;

      if (path.length) {
        path.forEach((key, index) => {
          currentStateLevel = currentStateLevel[key] =
            index === path.length - 1 ? newValue : { ...currentStateLevel[key] };
        });
      } else {
        newState = newValue;
      }
    }

    return newState;
  }

  const state = tree[NODE] ? tree.value : (traverseTree(tree, currentNode => currentNode.value) as any);
  const actions = tree[NODE] ? convertActions(tree, []) : (traverseTree(tree, convertActions) as any);
  const reducers = getReducers(tree);
  const reducer = (currentState = state, action: IActionPayload) => {
    let newState = currentState;

    if (action[ACTION]) {
      newState = updateState(currentState, action[PATH], draft => {
        action[ACTION](draft, ...action.payload);
      });
    }

    reducers.forEach(currentReducer => {
      newState = updateState(newState, currentReducer.path, draft => {
        currentReducer.reducer(draft, action);
      });
    });

    return newState;
  };
  const selectors = tree[NODE] ? createSelectors(tree, []) : (traverseTree(tree, createSelectors) as any);

  return {
    reducer,
    actions,
    selectors,
  };
}
