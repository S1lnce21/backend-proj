import prisma from "../db";

export interface CreatePostData {
  title: string;
  content?: string;
  authorId: number;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
}

export const postService = {
  getAllPosts: async () => {
    return prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  getPostById: async (id: number) => {
    return prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  },

  createPost: async (data: CreatePostData) => {
    return prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: data.authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  },

  updatePost: async (id: number, data: UpdatePostData, authorId: number) => {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new Error("Пост не найден");
    }

    if (post.authorId !== authorId) {
      throw new Error("У вас нет прав на редактирование этого поста");
    }

    return prisma.post.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  },

  deletePost: async (id: number, authorId: number) => {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new Error("Пост не найден");
    }

    if (post.authorId !== authorId) {
      throw new Error("У вас нет прав на удаление этого поста");
    }

    return prisma.post.delete({
      where: { id },
    });
  },

  getUserPosts: async (userId: number) => {
    return prisma.post.findMany({
      where: { authorId: userId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
};