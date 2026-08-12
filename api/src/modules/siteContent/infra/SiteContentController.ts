import { Request, Response } from "express";
import {
  SiteContentRepository,
  SiteContentUpdateInput,
} from "./SiteContentRepository";

export class SiteContentController {
  constructor(private readonly repository: SiteContentRepository) {}

  async getPublic(_: Request, response: Response): Promise<Response> {
    const result = await this.repository.get();
    return response.status(200).json(result);
  }

  async getAdmin(_: Request, response: Response): Promise<Response> {
    const result = await this.repository.get();
    return response.status(200).json(result);
  }

  async update(request: Request, response: Response): Promise<Response> {
    const payload = request.body as SiteContentUpdateInput;
    const result = await this.repository.update(payload);
    return response.status(200).json(result);
  }
}
