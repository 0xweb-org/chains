import * as sharp from 'sharp';
import { IChainInformation } from '../chains/IChainInformation';

let Sharp: typeof import('sharp') = sharp as any;

export namespace $image {

    // async getPixel (x: number, y: number): Promise<number[]> {
    //     const buffer = await Sharp(buffer)
    //         .raw()
    //         .toBuffer()
    //     console.log(buffer[0], buffer[1], buffer[2], buffer[3],)
    //     await this.createLogo();
    // }

    // Resize to square
    // Fill transparent to dominant opposite color (grayscale logo)
    export async function createLogo (buffer: ArrayBuffer, chain: IChainInformation) {
        try {
            return await createLogoInner(buffer);
        } catch (error) {
            console.error(`Error creating logo: ${ JSON.stringify(chain)}`, error.message);
            return null;
        }
    }

    async function createLogoInner (buffer: ArrayBuffer) {
        const stats = await Sharp(buffer).stats();
        const metadata = await Sharp(buffer).metadata();

        let dominant = Math.min(stats.dominant.r, stats.dominant.g, stats.dominant.b);
        // Fix: Ethereum logo gets black background, as the dominant color is calculated as almost white.
        dominant = 0;
        const color = { r: 255 - dominant, g: 255 - dominant, b: 255 - dominant };

        if (metadata.format === 'svg') {
            buffer = await Sharp(buffer).png().toBuffer();
        }

        if (metadata.hasAlpha && !stats.isOpaque) {
            buffer = await Sharp(buffer)
                .flatten({ background: color })
                .toBuffer()
        }
        let size = 256;
        if (metadata.width < size && metadata.height < size) {
            size = Math.max(metadata.width, metadata.height);
        }
        if (metadata.width !== size || metadata.height !== size) {
            if (size < 256) {
                buffer = await Sharp(buffer)
                    .resize(size, size, { fit: 'contain', background: color })
                    .toBuffer();
            } else {
                // Add padding for big images
                const PADDING = 24;
                const newWidth = size - 2 * PADDING;
                const newHeight = size - 2 * PADDING;

                buffer = await Sharp(buffer)
                    .resize(newWidth, newHeight, { fit: 'contain', background: color })
                    .toBuffer();

                buffer = await Sharp({
                    create: {
                        width: size,
                        height: size,
                        channels: 4,
                        background: color
                    }
                })
                .composite([{ input: Buffer.from(buffer), top: PADDING, left: PADDING }])
                .png()
                .toBuffer()
            }
        }
        return buffer;
    }
}
