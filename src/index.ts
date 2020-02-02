import * as TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import { Storage } from './Storage';
import * as Koa from 'koa';
import { libs } from '@waves/waves-transactions';
import { options } from 'yargs';
import * as bodyParser from 'koa-bodyparser';
import watch from '@waves/node-api-js/cjs/tools/adresses/watch';
import { getTemplate } from './templates';


const { token } = options({ token: { alias: 't', required: true, type: 'string' } }).argv;
const app = new Koa();
const telegram = new TelegramBot(token as string, { polling: true });
const storage = new Storage();
const node = 'https://nodes.wavesplatform.com';

app.use(bodyParser());


storage.keys().then(list => {
    list.forEach(address => {
        watch(node, address, 10000).then(watcher => {
            watcher.on('change-state', (list) => {
                storage.read(address).then(data => {
                    list.forEach((tx) => {
                        getTemplate(node, tx).then((template) => {
                            telegram.sendMessage(data.id, template);
                        });
                    })
                });
            });
        });
    });
});

const request: Record<string, { resolve: Function, reject: Function, tx: any, id: any }> = Object.create(null);

app.use(ctx => {
    const tx = ctx.request.body;

    const message = `<b>dApp request sign transaction:</b>
<code>${JSON.stringify(tx, null, 4)}</code>`;

    if (tx.type) {
        ctx.body = message;
        const address = libs.crypto.address({ publicKey: tx.senderPublicKey as string }, 'W');
        return storage.read(address)
            .then(data => {
                if (data) {
                    return telegram.sendMessage(data.id, message, {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: 'Sign', callback_data: `Sign ${tx.id}` },
                                    { text: 'Reject', callback_data: `Reject ${tx.id}` }
                                ]
                            ]
                        }
                    }).then(message => {

                        let resolve, reject;
                        const promise = new Promise((res, rej) => {
                            resolve = res;
                            reject = rej;
                        });

                        request[data.id] = {
                            resolve, reject, tx, id: message.message_id
                        } as any;

                        return promise.then(tx => {
                            delete request[data.id];
                            ctx.body = tx;
                        }).catch(() => {
                            delete request[data.id];
                            ctx.body = 'Reject!';
                        });
                    });
                } else {
                    ctx.body = 'Has no users!';
                }
            });
    } else {
        ctx.body = 'Wrong request';
    }
});

app.listen(8080);

telegram.on('callback_query', (event) => {
    if (event.data!.includes('Sign') && request[event.from!.id!]) {
        telegram.sendMessage(event.from.id, 'Signed!', { parse_mode: 'HTML' });
        telegram.editMessageReplyMarkup({ inline_keyboard: [[]] }, {
            message_id: request[event.from!.id!].id,
            chat_id: event.from.id
        });
        request[event.from!.id!].resolve(request[event.from!.id!].tx);
    }
    if (event.data!.includes('Reject') && request[event.from!.id!]) {
        telegram.sendMessage(event.from.id, 'Rejected!', { parse_mode: 'HTML' });
        telegram.editMessageReplyMarkup({ inline_keyboard: [[]] }, {
            message_id: request[event.from!.id!].id,
            chat_id: event.from.id
        });
        request[event.from!.id!].reject(request[event.from!.id!].tx);
    }
});


telegram.on('text', message => {
    const [command, ...args] = (message.text || '').split(/\s/);
    const [address] = args;

    switch (command) {
        case 'balance':
            fetch(`https://nodes.wavesplatform.com/addresses/balance/${address}`)
                .then(r => r.json())
                .then(data => {
                    telegram.sendMessage(message.chat.id, `${data.balance / Math.pow(10, 8)} WAVES`);
                }, error => {
                    telegram.sendMessage(message.chat.id, error.message);
                });
            break;
        case 'watch':
            storage.write(address, message.from);
            break;
        default:
            telegram.sendMessage(message.chat.id, `Unsupported message! Ask Daniil about bot API!`);
    }
});
