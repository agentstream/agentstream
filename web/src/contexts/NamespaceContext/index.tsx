'use client';

import { noticeUnhandledError } from '@/common/utils';
import { useNamespaceList } from '@/hooks';
import { createContext, PropsWithChildren } from 'react';

export const NamespaceContext = createContext(new Array<string>());

export const NamespaceContextProvider = (props: PropsWithChildren) => {
  const { data, isError, error } = useNamespaceList();
  noticeUnhandledError(isError, error);
  return <NamespaceContext.Provider value={data ?? []}>{props.children}</NamespaceContext.Provider>;
};
