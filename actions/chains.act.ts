import alot from 'alot';
import { File } from 'atma-io';
import { UAction } from 'atma-utest'
import { ImageHandler } from '../src/ImageHandler';
import { EthereumListsSource } from '../src/EthereumListsSource';
import { ChainListSource } from '../src/ChainListSource';
import { $downloader } from '../src/$downloader';
import { l } from 'dequanto/utils/$logger';

UAction.create({
    async 'generate'() {
        let handlers = [
            new EthereumListsSource(),
            new ChainListSource(),
        ];

        let sourcesArr = await alot(handlers).mapManyAsync(async handler => {
            return handler.getChains();
        }).toArrayAsync();

        const groups = alot(sourcesArr)
            .groupBy(x => x.chainId)
            .toArray();

        const sources = await alot(groups)
            .mapAsync(async (group, i) => {
                let chain = group.values[0];
                let output = `./chain/${chain.chainId}/logo.png`;
                if (await File.existsAsync(output)) {
                    chain.icon = output;
                    return chain;
                }
                for (let x of group.values) {
                    if (!x.icon) {
                        continue;
                    }
                    l`yellow<${i + 1}/${groups.length}> gray<Loading icon for> ${x.name} (#cyan<${x.chainId}>) ${ (x.icon as any)?.url ?? x.icon }`;
                    let img = await $downloader.downloadImage(x);
                    if (img?.content == null) {
                        continue;
                    }
                    let image = new ImageHandler(Buffer.from(img.content), x);
                    let iconBuffer = await image.createLogo();
                    if (iconBuffer == null) {
                        continue;
                    }

                    await File.writeAsync(output, Buffer.from(iconBuffer), { encoding: 'binary' });
                    chain.icon = output;
                    return chain;
                }
                chain.icon = null;
                return chain;
            })
            .toArrayAsync();

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
