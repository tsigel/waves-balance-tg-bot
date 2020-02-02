import { TTransactionFromAPI } from '@waves/ts-types';
import { transfer } from './transfer';
import { unknown } from './unknown';


export const getTemplate = (node: string, tx: TTransactionFromAPI<string | number>): Promise<string> => {
    switch (tx.type) {
        case 4:
            return transfer(node, tx);
        default:
            return unknown(node, tx);
    }
}
