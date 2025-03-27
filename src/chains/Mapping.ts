import { TChain } from 'src/models/TChain';
import { IChainInformation } from './IChainInformation';
import alot from 'alot';
import { l } from 'dequanto/utils/$logger';

export namespace Mapping {
    export async function map (chains: IChainInformation[]): Promise<TChain[]> {
        let count = chains.length;
        chains = chains.filter(x => x.rpc?.length > 0);
        l`red<${count - chains.length}> have empty RPCs, filtered out.`;


        count = chains.length;
        chains = chains.filter(x => x.shortName != null && x.chainId != null);
        l`red<${count - chains.length}> have no shortName, filtered out.`;

        let dict = alot(chains).toDictionary(x => x.shortName, x => x);

        // Remove `-mainnet` from chain names
        chains.forEach(chain => {
            let shortName = chain.shortName.replace(/\-?mainnet$/, '');
            if (shortName === chain.shortName) {
                return;
            }
            if (shortName in dict) {
                return;
            }
            dict[shortName] = chain;
            chain.shortName = shortName;
        });


        let arr = chains.map(chain => {
            return {
                chainId: chain.chainId,
                icon: typeof chain.icon === 'string' ? chain.icon : chain.icon?.url,
                www: chain.infoURL,

                name: chain.name,
                platform: chain.shortName,

                chainToken: chain.nativeCurrency?.symbol,

                endpoints: chain.rpc.map(url => ({
                    url
                })),

                explorers: chain.explorers?.map(explorer => {
                    return {
                        name: explorer.name,
                        url: explorer.url,
                        api: explorer.api ?? void 0
                    }
                }),

                ens: chain.ens

            } satisfies TChain;
        });

        return arr;
    }
}
