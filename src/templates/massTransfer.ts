import getAssetIdListByTx from '@waves/node-api-js/cjs/tools/adresses/getAssetIdListByTx';
import { IMassTransferTransaction, IWithApiMixin } from '@waves/ts-types';
import { fetchDetails } from '@waves/node-api-js/cjs/api-node/assets';
import { indexBy, prop } from 'ramda';
import { BigNumber } from '@waves/bignumber';

export const massTransfer = (node: string, tx: IMassTransferTransaction<string | number> & IWithApiMixin): Promise<string> => {
    return fetchDetails(node, getAssetIdListByTx(tx)).then((assets) => {
        const hash = indexBy(prop('assetId'), assets);
        const fee = BigNumber.toBigNumber(tx.fee)
            .div(Math.pow(10, 8))
            .toFixed();
        const currency = tx.assetId == null ? 'Waves' : hash[tx.assetId].name;

        return [
            'New Mass Transfer  transaction!',
            `id: ${tx.id}`,
            ...tx.transfers.map((item) => {
                const amount = BigNumber.toBigNumber(item.amount)
                    .div(Math.pow(10, tx.assetId == null ? 8 : hash[tx.assetId].decimals))
                    .toFixed();

                return `Transfer item: ${amount} ${currency}`;
            }),
            `Sender: ${tx.sender}`,
            `Fee: ${fee} Waves`
        ].join('\n');
    });
}