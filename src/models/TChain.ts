import { TEth } from 'dequanto/models/TEth'
import { TTransport } from 'dequanto/rpc/transports/ITransport'

export interface TChain {
    name?: string
    icon?: string
    www?: string

    platform: TEth.Platform
    aliases?: string[]

    chainId: number
    chainToken: string


    endpoints: IRpcConfig[]

    explorers: TExplorer[]

    defaultTxType?: 0 | 1 | 2;
    defaultGasPriceRatio?: number;

    // block time in ms
    blockTimeAvg?: number;

    erc4337?: {
        name: string;
        contracts: {
            entryPoint: TEth.Address;
            accountFactory: TEth.Address;
        };
    }[];

    safe?: {
        transactionService: `https://${string}`
        contracts: {
            Safe: TEth.Address;
            SafeL2?: TEth.Address;
            SafeProxyFactory: TEth.Address;
            MultiSend: TEth.Address;
            CreateCall?: TEth.Address;
        };
    };
    flashbots?: {
        url: string;
    };
    ens?: {
        registry: TEth.Address
    }
    spotPriceAggregator?: {
        aggregator: TEth.Address
    };
}


interface IRpcConfig {
    url?: string
    options?: TTransport.Options.Http | TTransport.Options.Ws

    /** Will be a preferred node for submitting transactions */
    safe?: boolean
    distinct?: boolean
    wallet?: boolean

    web3?: TTransport.Transport | Promise<TTransport.Transport>

    name?: string
    /** Will be used only if manually requested with .getWeb3, or .getNodeUrl */
    manual?: boolean

    /** max block range per request when getting for example the past logs*/
    fetchableBlockRange?: number

    /** True if the node supports traceTransaction calls */
    traceable?: boolean

    // requestCount/timeSpan: e.g. 100/1min
    rateLimit?: string

    // the max block range to fetch per single request when getting Logs
    blockRangeLimit?: string | number

    // maximum of requests to be batched, otherwise batches will be paginated
    batchLimit?: number

    // Will be used only for the specified methods
    methods?: {
        exclude?: string[]
        only?: string[]
    }
}


interface TExplorer {
    platform?: TEth.Platform

    name: string
    standard?: 'EIP3091' | string
    url: string

    api: { url: string, key?: string }
}
