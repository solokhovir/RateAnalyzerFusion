import {FusionSDK, NetworkEnum} from '@1inch/fusion-sdk'
import axios from 'axios';
import pkg from 'pg';
const {Client} = pkg;
import Web3 from "web3";
import dotenv from 'dotenv';
dotenv.config();

const INFURA_PROJECT_ID = process.env.INFURA_KEY;
const web3 = new Web3(`https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`);

let gas_price;

web3.eth.getGasPrice().then((price) => {
    console.log(`Current gas price: ${price} wei`);
    gas_price = price;
});

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'rates',
    password: '1234',
    port: 5432,
});

client.connect();

let open_ocean_price = 0
let gas_price_open_ocean = 0
let one_inch_price = 0
let open_ocean_price_with_gas = 0
let one_inch_price_dot = 0

let timerId = setTimeout(async function tick() {
    const sdk = new FusionSDK({
        url: 'https://fusion.1inch.io',
        network: NetworkEnum.ETHEREUM
    })
    const params = {
        fromTokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        toTokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        amount: '100000000'
    }

    const quote = await sdk.getQuote(params)
    one_inch_price = quote.toTokenAmount

    const res = await axios.get("https://open-api.openocean.finance/v3/eth/quote?inTokenAddress=0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599&outTokenAddress=0xdAC17F958D2ee523a2206206994597C13D831ec7&amount=1&gasPrice=5&slippage=1",)
        .then((res) => {
            const result = res.data
            open_ocean_price = result.data.outAmount
            gas_price_open_ocean = result.data.estimatedGas
        }).catch((err) => {
            throw new Error(err)
        })

    console.log("open_ocean: ", open_ocean_price)
    console.log("1_inch_price: ", one_inch_price)
    open_ocean_price_with_gas = (open_ocean_price * Math.pow(10, -6) + open_ocean_price * Math.pow(10, -6) * gas_price_open_ocean * Math.pow(10, -3) * 33281456811 * Math.pow(10, -18))
    one_inch_price_dot = (one_inch_price * Math.pow(10, -6))
    if (open_ocean_price_with_gas > one_inch_price_dot) {
        const query = {
            text: 'INSERT INTO rates(aggregator, price) VALUES($1, $2)',
            values: ["1inch_fusion", one_inch_price_dot],
        };
        client.query(query, (err, res) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Data added to table successfully');
            }

        });
    } else {
        const query = {
            text: 'INSERT INTO rates(aggregator, price) VALUES($1, $2)',
            values: ["open_ocean", open_ocean_price_with_gas],
        };
        client.query(query, (err, res) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Data added to table successfully');
            }

        });
    }
    timerId = setTimeout(tick, 2000); // (*)
}, 5000);


