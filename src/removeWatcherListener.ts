import { Watch } from '@waves/node-api-js/cjs/tools/adresses/watch';
import { TTransactionFromAPI } from '@waves/ts-types';
import { curry } from 'ramda';


export const removeWatcherListener = curry((
    state: Record<string, Promise<Watch>>,
    address: string,
    handler: THandler) => {
        if (!state[address]) {
            return void 0;
        }

        state[address].then((watcher) => {
            watcher.on('change-state', handler);
        });

        delete state[address];
});

type THandler = (list: Array<TTransactionFromAPI<string | number>>) => void;