'use client';

import { Module } from '@/common/enum';
import { listAllWithNotice } from '@/common/interactions';
import { parseResourceData } from '@/common/logics';
import { noticeUnhandledError, mergeObjects } from '@/common/utils';
import { useQuery } from '@tanstack/react-query';
import { createContext, PropsWithChildren } from 'react';

export const LogoContext = createContext({} as Record<string, string>);

export const LogoContextProvider = (props: PropsWithChildren) => {
  const { data, isError, error } = useQuery({
    queryKey: [Module.Package, 'logo'],
    queryFn: async () => {
      const resp = await listAllWithNotice(Module.Package);
      return resp?.data;
    }
  });
  noticeUnhandledError(isError, error);
  const logos = mergeObjects(
    (data?.items ?? []).map(item => {
      const { id, logo } = parseResourceData(item);
      return { [id]: logo };
    })
  );
  return <LogoContext.Provider value={logos}>{props.children}</LogoContext.Provider>;
};
