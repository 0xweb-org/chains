import { $require } from 'dequanto/utils/$require';
import { IChainInformation, IImageInformation } from './model';
import { File } from 'atma-io';
import * as sharp from 'sharp';
import { l } from 'dequanto/utils/$logger';
import { $promise } from 'dequanto/utils/$promise';

let Sharp: typeof import('sharp') = sharp as any;

export namespace $downloader {
    export function getFormat (url: string) {
        return /\.(?<extension>\w+)$/.exec(url)?.groups?.extension
    }
    export function getLogoImageInfo (chain: IChainInformation): IImageInformation | null {
        if (!chain.icon) {
            return null
        };
        if (typeof chain.icon ==='string') {
            return {
                url: chain.icon
            };
        }
        return chain.icon;
    }

    export async function getJson <T> (path: string) {
        let json = await get<T>(path, { output: 'json' });
        return json;
    }
    export async function getString (path: string) {
        let buffer = await get<ArrayBuffer>(path, { output: 'buffer' });
        return Buffer.from(buffer).toString('utf8');
    }

    export async function downloadImage(chain: IChainInformation): Promise<{ content: string | Buffer, format: 'svg' | 'png' | string }> {
        if (!chain.icon) {
            return null;
        }
        let icon = chain.icon;
        let url = typeof icon ==='string' ? icon : icon.url;
        let format = typeof icon === 'string' ? this.getFormat(icon) : (icon.format ?? this.getFormat(icon.url));

        $require.notNull(format, `Type of image.format is not defined for ${JSON.stringify(icon)}`);

        if (url.startsWith('ipfs://')) {
            // ipfs://QmdwQDr6vmBtXmK2TmknkEuZNoaDqTasFdZdu3DRw8b2wt
            url = `https://ipfs.io/ipfs/${ url.replace('ipfs://', '') }`;
        }
        let buffer = await get<ArrayBuffer>(url, { output: 'buffer' });
        if (buffer == null || buffer.byteLength === 0) {
            return null;
        }

        if (format === 'svg') {
            let str = Buffer.from(buffer).toString('utf8');
            if (str.includes('xlink:href="data:')) {
                // Ignore SVGs with inlined image links as sharp cannot handle them
                return null;
            }
            return { content: str, format:'svg' };
        }

        return { content: Buffer.from(buffer), format };
    }


    async function get <T = string | ArrayBuffer> (url: string, opts: { output: 'buffer' | 'json', retries?: number }): Promise<T | null> {
        let retries = opts.retries ?? 3;
        let response = await fetch(url);
        if (response.status === 200 || response.status === 201) {
            if (opts.output === 'json') {
                return await response.json();
            }
            return await response.arrayBuffer() as any;
        }
        if (response.status === 404 || response.status === 500) {
            return null;
        }
        if (response.status === 504 && url.includes('ipfs.io')) {
            // On timeouts, resource not available, return null
            return null;
        }
        if (retries <= 0) {
            return null;
        }
        await $promise.wait(1000);
        return get(url, {
            ...opts,
            retries: retries - 1,
        });
    }
}
