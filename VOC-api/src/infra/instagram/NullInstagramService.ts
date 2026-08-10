import { IInstagramService } from "./IInstagramService";
import { InstagramGalleryResult } from "./InstagramMediaTypes";

export class NullInstagramService implements IInstagramService {
  async fetchRecentMedia(): Promise<InstagramGalleryResult> {
    return { available: false, items: [] };
  }
}