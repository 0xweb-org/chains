# Blockchain Information Repository

This repository provides structured and normalized information about various blockchains. The data is aggregated from multiple sources, cleaned, and formatted for consistency. Icons are also standardized to ensure uniform representation.

## Features
- **Comprehensive Data**: Includes key details about different blockchains.
- **Normalized Format**: Ensures consistency in structure and representation.
- **Standardized Icons**: Unified visual representation across blockchains.

## Data Sources

- https://github.com/ethereum-lists/chains
- https://github.com/DefiLlama/chainlist
- https://cryptologos.cc/

## Usage
You can use this repository to:
- Retrieve structured blockchain data.
- Access standardized blockchain icons.
- Integrate the data into your applications or research projects.

### Chain List

1. All well-known blockchains

```ts
`https://raw.githubusercontent.com/0xweb-org/chains/master/chainlist.json`
```


2. ShortName to ChainID mapping

```ts
`https://raw.githubusercontent.com/0xweb-org/chains/master/chainids.json`
```


3. Blockchain information by `ChainID`

```ts
`https://raw.githubusercontent.com/0xweb-org/chains/master/chain/${chainId}/chain.json`
```

4. Blockchain Logo (PNG, `256x256`) by `ChainID`

```ts
`https://raw.githubusercontent.com/0xweb-org/chains/master/chain/${chainId}/logo.png`
```


## Rebuild from sources

```
npm i
npm run build
```

----

🏁 [0xweb.org](https://0xweb.org)
