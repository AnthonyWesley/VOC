import { InstagramGalleryResult } from "./InstagramMediaTypes";

export interface IInstagramService {
  fetchRecentMedia(): Promise<InstagramGalleryResult>;
}