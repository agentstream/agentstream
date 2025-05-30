'use client';

import { Module } from '@/common/enum';
import { createContext, PropsWithChildren } from 'react';

type Props = {
  value: Module;
};

export const ModuleContext = createContext<Module>(Module.Package);

const ModuleContextProvider = (props: PropsWithChildren<Props>) => {
  return <ModuleContext.Provider value={props.value}>{props.children}</ModuleContext.Provider>;
};

export default ModuleContextProvider;
