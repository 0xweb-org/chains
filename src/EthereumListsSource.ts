import { IChainInformation, IImageInformation } from './model';
import { File, Directory } from 'atma-io';
import alot from 'alot';
import { l } from 'dequanto/utils/$logger';
import { $require } from 'dequanto/utils/$require';
import { CryptoLogosSource } from './CryptoLogosSource';

export class EthereumListsSource {

    async getChains(): Promise<IChainInformation[]> {
        let files = await Directory.readFilesAsync(`./sources/ethereum-lists-chains/_data/chains/`, '*.json');
        let logos = await new CryptoLogosSource().getLogos();
        let logosDict = alot(logos).toDictionary(x => x.chainId, x => x);
        let jsons = await alot(files).mapAsync(async (file, i) => {
            let info = await file.readAsync<IChainInformation>();
            let logoInfo = logosDict[info.chainId];
            if (logoInfo?.icon) {
                if (await File.existsAsync(logoInfo.icon)) {
                    info.icon = logoInfo.icon;
                    return info;
                } else {
                    l`CryptoLogo 404 for ${logoInfo.name}: ${logoInfo.icon}`
                }
            }
            if (info.icon) {
                let path = `./sources/ethereum-lists-chains/_data/icons/${info.icon}.json`;
                if (await File.existsAsync(path)) {
                    let json = await File.readAsync<{ url, width, height, format }>(path);
                    if (Array.isArray(json)) {
                        info.icon = json[0]; // Use first icon in case of array
                    } else {
                        info.icon = json;
                    }

                    $require.notNull((info.icon as any).url, `EthereumListsSource missing icon URL for ${info.name} (${info.icon})`);
                } else {
                    console.log(`<EthereumListsChain> Missing icon for ${info.name} (${info.icon})`);
                    info.icon = null;
                }
            }
            return info;
        }).toArrayAsync();

        l`EthereumListsSource: Chains count green<${jsons.length}>; with icons green<${ jsons.filter(x => x.icon != null).length }>`;
        return jsons;
    }


}
