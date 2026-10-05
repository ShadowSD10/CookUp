import { assetPaths, assetUrl } from './manifest';

export class Assets {
  private readonly images = new Map<string, HTMLImageElement>();

  async load(): Promise<void> {
    await Promise.all(
      assetPaths.map(async (path) => {
        const image = new Image();
        image.src = assetUrl(path);
        try {
          await image.decode();
        } catch (cause) {
          throw new Error(`Could not load asset: ${path}`, { cause });
        }
        this.images.set(path, image);
      }),
    );
  }

  get(path: string): HTMLImageElement {
    const image = this.images.get(path);
    if (!image) throw new Error(`Asset not loaded: ${path}`);
    return image;
  }
}
