import getAssetIdListByTx from '@waves/node-api-js/cjs/tools/adresses/getAssetIdListByTx';
import { ITransferTransaction, IWithApiMixin } from '@waves/ts-types';
import { fetchDetails } from '@waves/node-api-js/cjs/api-node/assets';
import { indexBy, prop } from 'ramda';
import { BigNumber } from '@waves/bignumber';

export const transfer = (node: string, tx: ITransferTransaction<string | number> & IWithApiMixin): Promise<string> => {
    return fetchDetails(node, getAssetIdListByTx(tx)).then((assets) => {
        const hash = indexBy(prop('assetId'), assets);
        const amount = BigNumber.toBigNumber(tx.amount)
            .div(Math.pow(10, tx.assetId == null ? 8 : hash[tx.assetId].decimals))
            .toFixed();
        const fee = BigNumber.toBigNumber(tx.fee)
            .div(Math.pow(10, tx.feeAssetId == null ? 8 : hash[tx.feeAssetId].decimals))
            .toFixed();
        const currency = tx.assetId == null ? 'Waves' : hash[tx.assetId].name;
        const feeCurrency = tx.feeAssetId == null ? 'Waves' : hash[tx.feeAssetId].name;

        return [
            'New Transfer transaction!',
            `id: ${tx.id}`,
            `Recipient: ${tx.recipient}`,
            `Amount: ${amount} ${currency}`,
            `Sender: ${tx.sender}`,
            `Fee: ${fee} ${feeCurrency}`
        ].join('\n');
    });
}