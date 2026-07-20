import { IPostRepository } from "../domain/repositories/IPostRepository";

export interface ListPublicPostsInputDTO {
  limit?: number;
  cursor?: string | null;
}

export class ListPublicPostsUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(input?: ListPublicPostsInputDTO) {
    const { posts, nextCursor } = await this.postRepository.findAllPublic({
      limit: input?.limit ?? 20,
      cursor: input?.cursor ?? null,
    });
    return { posts, nextCursor };
  }
}
