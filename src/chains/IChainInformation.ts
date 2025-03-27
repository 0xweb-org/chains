import { TEth } from 'dequanto/models/TEth'


export interface IImageInformation {
    url: string
    width?: number
    height?: number
    format?: 'png' | 'svg' | string
}

export interface IChainInformation {

    "name": string
    "chain": string
    "status": "deprecated" | "active" | "incubating"
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
        api?: { url, key? }
    }[]

    tvl?: number
}
