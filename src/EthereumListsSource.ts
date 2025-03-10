import { IChainInformation, IImageInformation } from './model';
import { File, Directory } from 'atma-io';
import alot from 'alot';
import { l } from 'dequanto/utils/$logger';
import { $require } from 'dequanto/utils/$require';

export class EthereumListsSource {

    async getChains(): Promise<IChainInformation[]> {
        let files = await Directory.readFilesAsync(`./sources/ethereum-lists-chains/_data/chains/`, '*.json');
        let jsons = await alot(files).mapAsync(async (file, i) => {
            let info = await file.readAsync<IChainInformation>();
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

        l`EthereumListsSource: Chains count green<${jsons.length}>`;
        return jsons;
    }


}
