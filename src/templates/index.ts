import { TTransactionFromAPI } from '@waves/ts-types';
import { transfer } from './transfer';
import { massTransfer } from './massTransfer';
import { unknown } from './unknown';


export const getTemplate = (node: string, tx: TTransactionFromAPI<string | number>): Promise<string> => {
    switch (tx.type) {
        case 4:
            return transfer(node, tx);
        case 11:
            return massTransfer(node, tx);
        default:
            return unknown(node, tx);
    }
}
