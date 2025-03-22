import alot from 'alot';
import { File } from 'atma-io';
import { UAction } from 'atma-utest'
import { EthereumListsSource } from '../src/chains/EthereumListsSource';
import { ChainListSource } from '../src/chains/ChainListSource';
import { $downloader } from '../src/utils/$downloader';
import { l } from 'dequanto/utils/$logger';
import { $image } from '../src/utils/ImageHandler';

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

        // Merge chain data
        const sources = await alot(groups)
            .mapAsync(async (group, i) => {
                let chain = group.values[0];
                let output = `./chain/${chain.chainId}/logo.png`;
                if (await File.existsAsync(output)) {
                    chain.icon = output;
                } else {
                    chain.icon = await alot(group.values)
                        .filter(x => x.icon != null)
                        .mapAsync(async x => {
                            l`yellow<${i + 1}/${groups.length}> gray<Loading icon for> ${x.name} (#cyan<${x.chainId}>) ${ (x.icon as any)?.url ?? x.icon }`;
                            let img = await $downloader.downloadImage(x);
                            if (img?.content == null) {
                                return null;
                            }
                            let iconBuffer = await $image.createLogo(Buffer.from(img.content), x);
                            if (iconBuffer == null) {
                                return null;
                            }

                            await File.writeAsync(output, Buffer.from(iconBuffer), { encoding: 'binary' });
                            return output;
                        })
                        .firstAsync()
                }

                chain.tvl = alot(group.values).first(x => x.tvl != null)?.tvl;

                return chain;
            })
            .toArrayAsync();

        const sortedByTvl = alot(sources)
            .sortBy(x => x.tvl, 'desc')
            .thenBy(x => x.chainId)
            .toArray();

        const chainList = sortedByTvl;
        await File.writeAsync(`chainlist.json`, chainList);

        const chainListTop50 = alot(chainList).take(50).toArray();
        await File.writeAsync(`chainlist-top50.json`, chainListTop50);

        const chainIds = alot(chainList).toDictionary(x => x.shortName, x => x.chainId);
        await File.writeAsync(`chainids.json`, chainIds);

        await alot(chainList).forEachAsync(async chain => {
            let output = `./chain/${chain.chainId}/chain.json`;
            await File.writeAsync(output, chain);
        }).toArrayAsync();
    }
})
