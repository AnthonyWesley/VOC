import { IUserRepository } from "../../identity/domain/repositories/IUserRepository";
import {
  IPostRepository,
  PostListItemDTO,
} from "../domain/repositories/IPostRepository";

export interface ListPostsInputDTO {
  authUserId?: string | null;
  limit?: number;
  cursor?: string | null;
  status?: string;
}

export interface ListPostsResponseDTO {
  posts: PostListItemDTO[];
  nextCursor: string | null;
}

export class ListPostsUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: ListPostsInputDTO): Promise<ListPostsResponseDTO> {
    const authUserId = input?.authUserId ?? null;

    let isAdmin = false;

    if (authUserId) {
      const authUser = await this.userRepository.findById(authUserId);
      isAdmin = authUser?.highestLevel != null && authUser.highestLevel >= 100;
    }

    const { posts, nextCursor } = await this.postRepository.findAll({
      authUserId: authUserId ?? undefined,
      isAdmin,
      limit: input.limit ?? 20,
      cursor: input.cursor ?? null,
      status: input.status,
    });

    return { posts, nextCursor };
  }
}
