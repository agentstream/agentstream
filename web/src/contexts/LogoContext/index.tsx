'use client';

import { Module } from '@/common/enum';
import { parseResourceData } from '@/common/logics';
import { noticeUnhandledError, mergeObjects } from '@/common/utils';
import { useResourceList } from '@/hooks';
import { createContext, PropsWithChildren } from 'react';

export const LogoContext = createContext({} as Record<string, string>);

export const LogoContextProvider = (props: PropsWithChildren) => {
  const { data, isError, error } = useResourceList(Module.Package);
  noticeUnhandledError(isError, error);
  const logos = mergeObjects(
    (data ?? []).map(item => {
      const { id, logo } = parseResourceData(item);
      return { [id]: logo };
    })
  );
  return <LogoContext.Provider value={logos}>{props.children}</LogoContext.Provider>;
};
