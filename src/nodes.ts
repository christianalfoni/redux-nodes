import { NODE } from './constants';
import { TActions, TNode } from '.';

export function node<T, K extends TActions<T>>(initialValue: T, actions: K = {} as K): TNode<T, K> {
  return {
    [NODE]: true,
    value: initialValue,
    actions,
  };
}

export const value = <T, K extends TActions<T> = {}>(initialValue: T, actions?: K) =>
  node(initialValue, {
    set: (_, newValue: T) => newValue,
    ...actions,
  });

export const num = (initialValue: number, actions?: TActions<number>) =>
  value(initialValue, {
    increment: (val, by = 1) => val + by,
    decrement: (val, by = -1) => val + by,
    ...actions,
  });

export const toggle = (initialValue: boolean, actions?: TActions<boolean>) =>
  value(initialValue, {
    toggle: val => !val,
    ...actions,
  });

export const dictionary = <T>(initialValue: { [key: string]: T }, actions?: TActions<{ [key: string]: T }>) =>
  value(initialValue, {
    add: (curr, key: string, item: T) => ({ ...curr, [key]: item }),
    remove: (curr, key: string) => {
      const newValue = { ...curr };
      delete newValue[key];

      return newValue;
    },
    ...actions,
  });

export const list = <T>(initialValue: T[], actions?: TActions<T[]>) =>
  value(initialValue, {
    add: (curr, item: T) => curr.concat(item),
    remove: (curr, item: T) => curr.slice(0).splice(curr.indexOf(item), 1),
    ...actions,
  });
