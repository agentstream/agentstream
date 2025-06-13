import { RoutePath } from '@/common/enum';
import { redirect, RedirectType } from 'next/navigation';

export async function GET() {
    redirect(RoutePath.WorkBench, RedirectType.replace);
}
