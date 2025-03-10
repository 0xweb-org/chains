import alot from 'alot';
import { $downloader } from './$downloader';
import { IChainInformation } from './model';
import { File } from 'atma-io';

export class CryptoLogosSource {
    async getLogos () {
        let chains = await $downloader.getJson <IChainInformation[]> ("https://chainid.network/chains.json");

        let code = await $downloader.getString('https://cryptologos.cc/_cmc.js');

        let iFrom = code.indexOf('{');
        let iTo = code.lastIndexOf('}');
        let source = code.substring(iFrom, iTo + 1).replace(`\\'`, "'");

        await File.writeAsync(`1.txt`, source);

        let dict = JSON.parse(source) as Record<string, {
            name: string
            symbol: string
            meta: string
        }>;

        let arr = alot.fromObject(dict).map(entry => {
            let symbol = entry.value.symbol.toLowerCase();
            let chain = chains.find(chain => {
                if (chain.nativeCurrency?.symbol === entry.value.symbol) {
                    return true;
                }
                return false;
            });
            // if (chain == null) {
            //     console.error(`No chain found for ${entry.value.name} (${entry.value.symbol})`);
            // }
            return {
                key: entry.key,
                ...entry.value,
                icon: `https://cryptologos.cc/logos/${entry.key}-${symbol}-logo.png`,
                chainId: chain?.chainId
            };
        })
        .filter(x => x.chainId != null)
        .toArray();

        return arr;
    }
}
