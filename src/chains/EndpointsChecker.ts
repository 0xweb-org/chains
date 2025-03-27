import alot from 'alot';
import { EvmWeb3Client } from 'dequanto/clients/EvmWeb3Client';
import { $date } from 'dequanto/utils/$date';
import { $logger } from 'dequanto/utils/$logger';
import { $promise } from 'dequanto/utils/$promise';
import { IChainInformation } from './IChainInformation';

export namespace EndpointsChecker {
    export async function handleLiveUrls (chains: IChainInformation[]): Promise<IChainInformation[]> {

        chains.forEach(chain => {
            // remove template urls
            chain.rpc = chain.rpc?.filter(url => url.includes('{') === false);
        })

        chains = chains.filter(x => x.rpc?.length > 0);

        let clients = alot(chains).map(chain => {
            let client = new EvmWeb3Client({
                platform: chain.shortName,
                chainId: chain.chainId,
                endpoints: chain.rpc.map(url => ({ url }))
            });
            return client;
        })
        .toArray();

        let liveUrls = await new EndpointsWorker(clients).live();

        chains.forEach(chain => {
            chain.rpc = chain.rpc.filter(url => liveUrls.includes(url));
        });

        return chains;
    }
}


class EndpointsWorker {
    constructor (public clients: EvmWeb3Client[]) {

    }

    async live () {
        return await alot(this.clients)
            .mapManyAsync((client, i) => {
                return this.ping(client, i, this.clients.length);
            })
            .toArrayAsync({ threads: 2 });
    }
    private async ping (client: EvmWeb3Client, clientIdx, clientsTotal) {
        let PING = 3000;
        try {
            let infos = await client.getNodeInfos({
                timeout: PING,
                calls: [ 'eth_blockNumber' ]
            });
            let block = alot(infos).max(x => x.blockNumber);

            let nodesStatuses = await alot(infos)
                .mapAsync(async info => {
                    let diff = block - info.blockNumber;
                    let ok = info.status === 'live' && diff < 5 && info.pingMs < PING;

                    if (ok) {
                        let wClient = await client.getRpc({ node: { url: info.url } });
                        let { error, result: blockData } = await $promise.caught(
                            $promise.timeout(wClient.eth_getBlockByNumber(block, false), PING)
                        );
                        if (error != null) {
                            ok = false;
                            info.error = error;
                        } else if (blockData?.timestamp) {
                            let ageMs = Date.now() - blockData.timestamp * 1000;
                            if (isNaN(ageMs) || ageMs > $date.parseTimespan('10min')) {
                                ok = false;
                                info.error = new Error(`Block AGE: ${$date.formatTimespan(ageMs)}`);
                            }
                        }
                    }

                    let message = `${ok ? '✅' : '⛔'} yellow<${info.pingMs}>ms cyan<${diff}> yellow<${ ok ? '' : info.status }> gray<${info.url}> ${info.error ? info.error.message.substring(0, 100) : ''}`
                    return {
                        message,
                        ok,
                        url: info.url,
                    };
                })
                .toArrayAsync({ threads: 2 });

            let totalCount = nodesStatuses.length;
            let okCount = nodesStatuses.filter(x => x.ok).length;
            let message = `${client.platform}(gray<${client.chainId}>) ${okCount}/${totalCount} | Progress: ${clientIdx}/${clientsTotal}`;
            message = okCount > 0? `✅ green<${message}>` : `⛔ red<${message}>`;

            $logger.log(message);
            nodesStatuses.forEach(x => {
                $logger.log('        ', x.message);
            });


            return nodesStatuses
                .filter(x => x.ok)
                .map(x => x.url);
        } catch (error) {
            console.error(`${client.chainId} network failed:`, error.message);
            return [];
        }

    }
}
