import * as TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import { Storage } from './Storage';
import * as Koa from 'koa';
import { libs } from '@waves/waves-transactions';
import * as querystring from 'querystring';
import { options } from 'yargs';


const { token } = options({ token: { alias: 't', required: true, type: 'string' } }).argv;
const app = new Koa();
const telegram = new TelegramBot(token as string, { polling: true });
const storage = new Storage();


app.use(ctx => {
    const tx = querystring.parse(ctx.url.slice(2));
    console.log(tx);

    const message = `<b>dApp request sign transaction:</b>
    <code>${JSON.stringify(tx, null, 4)}</code>
    Write "sign" or "reject".`;

    if (tx.type) {
        ctx.body = message;
        const address = libs.crypto.address({ publicKey: tx.senderPublicKey as string }, 'W');
        console.log(address);
        storage.read(address)
            .then(data => {
                if (data) {
                    telegram.sendMessage(data.id, message, {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Share with your friends',
                                        switch_inline_query: 'share'
                                    }
                                ]
                            ]
                        }
                    });
                } else {
                    ctx.body = 'Has no users!';
                }
            })
    } else {
        ctx.body = 'Wrong request';
    }
});

app.listen(8080);


telegram.on("text", message => {
    console.log(message);
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
