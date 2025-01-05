const { prisma } = require("../prisma/prisma-client");

const PostController = {
  createPost: async (req, res) => {
    const { content } = req.body;
    const authorId = req.user.userId;

    if (!content) {
      return res
        .status(400)
        .json({ error: "PostController/createPost: all fields are required!" });
    }

    try {
      const post = await prisma.post.create({
        data: {
          content,
          authorId,
        },
      });

      res.json(post);
    } catch (error) {
      console.error("PostController/createPost: create post error!");
      return res
        .status(500)
        .json({ error: "PostController/createPost: internal server error!" });
    }
  },

  getAllPosts: async (req, res) => {
    const userId = req.user.userId;

    try {
      const posts = await prisma.post.findMany({
        include: {
          likes: true,
          author: true,
          comments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const postWithLikeInfo = posts.map((post) => ({
        ...post,
        likedByUser: post.likes.some((like) => like.userId === userId),
      }));

      res.json(postWithLikeInfo);
    } catch (error) {
      console.error("PostController/getAllPosts: get all posts error!");
      return res
        .status(500)
        .json({ error: "PostController/getAllPosts: internal server error!" });
    }
  },

  getPostById: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          comments: {
            include: {
              user: true,
            },
          },
          likes: true,
          author: true,
        },
      });

      if (!post) {
        return res.status(404).json({
          error: "PostController/getPostById: the post hasn't found!",
        });
      }

      const postWithLikeInfo = {
        ...post,
        likedByUser: post.likes.some((like) => like.userId === userId),
      };

      res.json(postWithLikeInfo);
    } catch (error) {
      console.error("PostController/getPostById: get post by ID error!");
      return res
        .status(500)
        .json({ error: "PostController/getPostById: internal server error!" });
    }
  },

  removePost: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    const isPost = await prisma.post.findUnique({ where: { id } });
    if (!isPost) {
      return res
        .status(404)
        .json({ error: "PostController/removePost: the post hasn't found!" });
    }

    if (isPost.authorId !== userId) {
      return res.status(403).json({
        error:
          "PostController/removePost: you have no access! You can remove only your own posts.",
      });
    }

    try {
      const transaction = await prisma.$transaction([
        prisma.comment.deleteMany({ where: { postId: id } }),
        prisma.like.deleteMany({ where: { postId: id } }),
        prisma.post.deleteMany({ where: { id } }),
      ]);

      res.json(transaction);
    } catch (error) {
      console.error("PostController/removePost: remove post error!");
      return res
        .status(500)
        .json({ error: "PostController/removePost: internal server error!" });
    }
  },
};

module.exports = PostController;