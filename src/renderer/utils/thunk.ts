export const thunk = <
  Func extends (...args: Args[]) => void,
  Args extends unknown
>(
  fn: Func,
  args?: Parameters<Func>
) => () => {
  const checkedArgs = args && !!args.length ? [...args] : [];
  fn(...checkedArgs);
};
