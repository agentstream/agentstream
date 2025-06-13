import { Module } from '@/common/enum';
import { usePathname } from 'next/navigation';

export function useModule() {
    return usePathname().split('/')[2] as Module;
}
