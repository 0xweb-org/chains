import alot from 'alot';
import { Directory, File } from 'atma-io';
import { UAction } from 'atma-utest'
import { TEth } from 'dequanto/models/TEth';
import { l } from 'dequanto/utils/$logger';
import { $require } from 'dequanto/utils/$require';
import * as sharp from 'sharp';

UAction.create({
    async 'generate'() {
        let handlers = [
            new EthereumListsChain()
        ];

        let sources = await alot(handlers).mapManyAsync(async handler => {
            return handler.getChains();
        }).toArrayAsync();

        const chainList = sources;
        await File.writeAsync(`chainlist.json`, chainList);

        const chainIds = alot(sources).toDictionary(x => x.shortName, x => x.chainId);
        await File.writeAsync(`chainids.json`, chainIds);

        await alot(sources).forEachAsync(async chain => {
            let output = `./chain/${chain.chainId}/chain.json`;
            await File.writeAsync(output, chain);
        }).toArrayAsync();
    }
})


class EthereumListsChain {
    images = new ImageHandler();

    async getChains(): Promise<IChainInformation[]> {
        let files = await Directory.readFilesAsync(`./sources/ethereum-lists-chains/_data/chains/`, '*.json');
        let jsons = await alot(files).mapAsync(async (file, i) => {
            let info = await file.readAsync<IChainInformation>();
            if (info.icon) {
                let path = `./sources/ethereum-lists-chains/_data/icons/${info.icon}.json`;
                if (await File.existsAsync(path)) {
                    info.icon = await File.readAsync<{ url, width, height, format }>(path);
                } else {
                    console.log(`<EthereumListsChain> Missing icon for ${info.name} (${info.icon})`);
                    info.icon = null;
                }
            }
            let logo = this.getLogoImageInfo(info);
            if (logo != null) {
                info.icon = await this.images.downloadImage(info);
            }

            if (i % 10 === 0) {
                console.log(`<EthereumListsChain> Processed ${i}/${files.length} (~${info.name})`);
            }

            return info;
        }).toArrayAsync();
        return jsons;
    }

    getLogoImageInfo (chain: IChainInformation): IImageInformation | null {
        if (!chain.icon) return null;
        if (typeof chain.icon ==='string') {
            return {
                url: chain.icon
            };
        }
        return chain.icon;
    }
}

interface IImageInformation {
    url: string
    width?: number
    height?: number
    format?: 'png' | 'svg' | string
}

interface IChainInformation {

    "name": string
    "chain": string
    "icon": string | IImageInformation | null
    "rpc": string[],
    "features": { name: 'EIP1559' | string }[]
    "faucets": [],
    "nativeCurrency": {
        "name": string | "Ether",
        "symbol": string | "ETH",
        "decimals": number | 18
    },
    "infoURL": string | "https://ethereum.org",
    "shortName": string | "eth",
    "chainId": number | 1,
    "networkId": number | 1,
    "slip44": number | 60,
    "ens": {
        "registry": TEth.Address | "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"
    },
    "explorers":
    {
        "name": string | "etherscan",
        "url": string | "https://etherscan.io",
        "standard": string | "EIP3091"
    }[]
}


class ImageHandler {
    getFormat (url: string) {
        return /\.(?<extension>\w+)$/.exec(url)?.groups?.extension
    }

    async downloadImage(chain: IChainInformation): Promise<string> {
        if (!chain.icon) {
            return;
        }
        let output = `./chain/${chain.chainId}/logo`;
        if (await File.existsAsync(output)) {
            return;
        }
        let icon = chain.icon;
        if (Array.isArray(icon)) {
            icon = icon[0]; // Use first icon in case of array
        }
        let url = typeof icon ==='string' ? icon : icon.url;
        let format = typeof icon === 'string' ? this.getFormat(icon) : (icon.format ?? this.getFormat(icon.url));

        $require.notNull(format, `Type of image.format is not defined for ${JSON.stringify(icon)}`);

        if (url.startsWith('ipfs://')) {
            // ipfs://QmdwQDr6vmBtXmK2TmknkEuZNoaDqTasFdZdu3DRw8b2wt
            url = `https://ipfs.io/ipfs/${ url.replace('ipfs://', '') }`;
        }
        l`gray<Loading logo for> ${chain.name} gray<from> ${url}`;
        let response = await fetch(url);
        if (response.status > 300) {
            return null;
        }
        let buffer = await response.arrayBuffer();
        if (format === 'svg') {
            await File.writeAsync(output, Buffer.from(buffer));
            return output;
        }
        if (buffer.byteLength === 0) {
            return null;
        }

        //const { width, height } = await sharp(Buffer.from(buffer)).metadata();
        try {
            const size = 256;
            const resized = await sharp(Buffer.from(buffer))
                .resize(size, size, { fit: 'inside' })
                .toBuffer();

            await File.writeAsync(output, resized);
            return output;
        } catch (error) {
            console.error(`Invalid image format for ${url}:`, error.message, buffer);
            return null;
        }
    }
}
