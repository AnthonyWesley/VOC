import { IUserRepository } from "../../identity/domain/repositories/IUserRepository";
import {
  IPostRepository,
  PostListItemDTO,
} from "../domain/repositories/IPostRepository";

export interface ListPostsInputDTO {
  authUserId?: string | null;
  limit?: number;
  cursor?: string | null;
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
      isAdmin = authUser?.roles[0].name === "ADMIN" || false;
    }

    const { posts, nextCursor } = await this.postRepository.findAll({
      authUserId: authUserId ?? undefined,
      isAdmin,
      limit: input.limit ?? 20,
      cursor: input.cursor ?? null,
    });

    return {
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        imageUrl: post.imageUrl,
        visibility: post.visibility,
        authorId: post.authorId,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        author: {
          fullName: post.author.fullName ?? null,
          photoUrl: post.author.photoUrl ?? null,
          roles: post.author.roles ?? null,
        },
      })),
      nextCursor,
    };
  }
}
