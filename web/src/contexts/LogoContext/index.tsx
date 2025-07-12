'use client';

import { Module } from '@/common/enum';
import { PackageSpec, ResourceList } from '@/common/types';
import { isRequestSuccess, mergeObjects, parseResourceData } from '@/common/utils';
import { listAllPackages } from '@/server/logics/package';
import { useQuery } from '@tanstack/react-query';
import { createContext, PropsWithChildren } from 'react';

export const LogoContext = createContext({} as Record<string, string>);

export const LogoContextProvider = (props: PropsWithChildren) => {
  const { data } = useQuery({
    queryKey: [Module.Package, 'logo'],
    queryFn: async () => {
      const resp = await listAllPackages();
      if (!isRequestSuccess(resp)) {
        throw resp.data;
      }
      return resp.data as ResourceList<PackageSpec>;
    }
  });
  const logos = mergeObjects(
    (data?.items ?? []).map(item => {
      const { id, logo } = parseResourceData(item);
      return { [id]: logo };
    })
  );
  return <LogoContext.Provider value={logos}>{props.children}</LogoContext.Provider>;
};
