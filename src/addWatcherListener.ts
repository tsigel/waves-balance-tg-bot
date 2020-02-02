import create, { Watch } from '@waves/node-api-js/cjs/tools/adresses/watch';
import { curry } from 'ramda';
import { TTransactionFromAPI } from '@waves/ts-types';


export const addWatcherListener = curry((
    node: string,
    state: Record<string, Promise<Watch>>,
    address: string,
    handler: THandler) => {
    state[address] = create(node, address)
        .then((watcher) => {
            watcher.on('change-state', handler);

            return watcher;
        });
    return state[address];
});

type THandler = (list: Array<TTransactionFromAPI<string | number>>) => void;