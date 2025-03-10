import * as sharp from 'sharp';
import { File } from 'atma-io';
import { IChainInformation } from './model';

let Sharp: typeof import('sharp') = sharp as any;

export class ImageHandler {
    constructor (private buffer: ArrayBuffer, private chain: IChainInformation) {

    }

    // async getPixel (x: number, y: number): Promise<number[]> {
    //     const buffer = await Sharp(this.buffer)
    //         .raw()
    //         .toBuffer()


    //     console.log(buffer[0], buffer[1], buffer[2], buffer[3],)

    //     await this.createLogo();
    // }

    // Resize to square
    // Fill transparent to dominant opposite color (grayscale logo)
    async createLogo () {
        try {
            return await this.createLogoInner();
        } catch (error) {
            console.error(`Error creating logo: ${ JSON.stringify(this.chain)}`, error.message);
            return null;
        }
    }
    private async createLogoInner () {
        const stats = await Sharp(this.buffer).stats();
        const metadata = await Sharp(this.buffer).metadata();
        const dominant = Math.min(stats.dominant.r, stats.dominant.g, stats.dominant.b);
        const color = { r: 255 - dominant, g: 255 - dominant, b: 255 - dominant };

        if (metadata.format === 'svg') {
            this.buffer = await Sharp(this.buffer).png().toBuffer();
        }

        if (metadata.hasAlpha && !stats.isOpaque) {
            this.buffer = await Sharp(this.buffer)
                .flatten({ background: color })
                .toBuffer()
        }
        const size = 256;
        if (metadata.width !== 256 || metadata.height!== 256) {
            this.buffer = await Sharp(this.buffer)
                .resize(size, size, { fit: 'contain', background: color })
                .toBuffer()
        }
        return this.buffer;
    }
}
