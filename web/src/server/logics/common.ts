import { MessageChannel } from '@/common/types';
import 'server-only';

export function buildSources(sources: string): MessageChannel[] {
    return (sources ?? '')
        .split(',')
        .filter(item => item !== '')
        .map(topic => ({
            pulsar: {
                topic,
                subscriptionName: ''
            }
        }));
}

export function buildSink(sink: string): MessageChannel {
    return {
        pulsar: {
            topic: sink ?? ''
        }
    };
}
