import { NODE } from './constants';
import { TActions, TNode } from '.';

export function node<T>(initialValue: T): TNode<T, {}> {
  return {
    [NODE]: true,
    value: initialValue,
    actions: {},
    extend(extendedActions) {
      Object.assign(this.actions, extendedActions);
      return this;
    },
  };
}

export const value = <T>(initialValue: T) =>
  node(initialValue).extend({
    set: (_, newValue: T) => newValue,
  });

export const num = (initialValue: number) =>
  value(initialValue).extend({
    increment: (val, by = 1) => val + by,
    decrement: (val, by = -1) => val + by,
  });

export const toggle = (initialValue: boolean) =>
  value(initialValue).extend({
    toggle: val => !val,
  });

export const dictionary = <T>(initialValue: { [key: string]: T }) =>
  value(initialValue).extend({
    add: (curr, key: string, item: T) => ({ ...curr, [key]: item }),
    remove: (curr, key: string) => {
      const newValue = { ...curr };
      delete newValue[key];

      return newValue;
    },
  });

export const list = <T>(initialValue: T[]) =>
  value(initialValue).extend({
    add: (curr, item: T) => curr.concat(item),
    remove: (curr, item: T) => curr.slice(0).splice(curr.indexOf(item), 1),
  });
