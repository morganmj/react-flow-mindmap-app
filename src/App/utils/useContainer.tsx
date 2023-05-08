import React, { FC, PropsWithChildren, createContext, useContext } from "react";

const NEVER: unique symbol = Symbol("never");

interface ContainerInitialState<T> {
  initialState?: T;
}

interface Container<Context, State = unknown> {
  Provider:({ initialState, children, }: PropsWithChildren<ContainerInitialState<State>>)=> JSX.Element
  useContainer: () => Context;
}

export const createContainer = <ContextValue, State = unknown>(
  useHook: (initialState?: State) => ContextValue
): Container<ContextValue, State> => {
  const Context = createContext<ContextValue | typeof NEVER>(NEVER);

  function Provider({
    initialState,
    children,
  }: PropsWithChildren<ContainerInitialState<State>>): JSX.Element {
    const contextValue = useHook(initialState);

    return <Context.Provider value={contextValue}>{children}</Context.Provider>;
  }

  const useContainer = (): ContextValue => {
    const value = useContext(Context);

    if (value === NEVER) {
      throw new Error(
        "`useContainer` should be used within <Container.Provider />"
      );
    }

    return value;
  };

  return { Provider, useContainer };
};

export const useContainer = <ContextValue, State = unknown>(
  container: Container<ContextValue, State>
): ContextValue => container.useContainer();
