import alot from 'alot';
import { $downloader } from '../utils/$downloader';
import { IChainInformation } from './IChainInformation';
import { File } from 'atma-io';
import { l } from 'dequanto/utils/$logger';

export class ChainListSource {
    async getChains(): Promise<IChainInformation[]> {
        let [chains, chainTvls] = await Promise.all([
            $downloader.getJson <IChainInformation[]> ("https://chainid.network/chains.json"),
            $downloader.getJson<
                {
                "gecko_id": string
                "tvl": number
                "tokenSymbol": string | "ONE",
                "name": string | "Harmony",
                "chainId": number | 1666600000
              }[]
            >("https://api.llama.fi/chains")
          ]);

        let chainTvlsDict = alot(chainTvls).toDictionary(x => x.chainId, x => x);

        // Ensure icons
        await alot(chains).forEachAsync(async (chain, i) => {

            chain.tvl = Math.round(chainTvlsDict[chain.chainId]?.tvl ?? 0);
            // Icon 404, skip
            chain.icon = null;

            if (await File.existsAsync(`./chain/${chain.chainId}/logo.png`)) {
                return;
            }

            let icons = [
                chain.icon,
                chainTvlsDict[chain.chainId]?.gecko_id,
                chainTvlsDict[chain.chainId]?.name?.toLowerCase()
            ].filter(Boolean);

            for (let icon of icons) {
                let path = await this.getIconUrl(icon, i, chains.length);
                if (path != null) {
                    chain.icon = path;
                    return;
                }
            }

        }).toArrayAsync();

        l`ChainListSource: Chains count green<${chains.length}>; with icons green<${ chains.filter(x => x.icon != null).length }>`;
        return chains;
    }

    private async getIconUrl (icon: string | any, i: number, total: number) {
        if (!icon || typeof icon !== 'string') {
            return null;
        }
        let path = `https://icons.llamao.fi/icons/chains/rsz_${icon}.jpg`;
        let has = await File.existsAsync(path);
        if (i % 10 === 0) {
            l`ChainListSource: Check Icon ${i + 1}/${total} green<${icon}>: ${ has ? '✅' : '⛔' }`;
        }
        return has ? path : null;
    }
}
