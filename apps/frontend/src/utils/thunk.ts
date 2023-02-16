export const thunk = <
  Func extends (...args: any) => any
>(
  fn: Func,
  args?: Parameters<Func>
) => () => {
  const checkedArgs = args && !!args.length ? [...args] : [];
  fn(...checkedArgs);
};