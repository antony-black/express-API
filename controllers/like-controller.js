const { prisma } = require("../prisma/prisma-client");

const LikeController = {
  likePost: async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.userId;

    if (!postId) {
      return res.status(400).json({
        error: "LikeController/likePost: all fields are required!",
      });
    }

    try {
      const isLikeExisted = await prisma.like.findFirst({
        where: { postId, userId },
      });

      if (isLikeExisted) {
        return res.status(400).json({
          error: "LikeController/likePost: you have been liked this post!",
        });
      }

      const like = await prisma.like.create({ data: { postId, userId } });

      res.json(like);
    } catch (error) {
      console.error("LikeController/likePost: like post error!");
      return res.status(500).json({
        error: "LikeController/likePost: internal server error!",
      });
    }
  },

  unlikePost: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!id) {
      return res.status(400).json({
        error: "LikeController/likePost: you have been unliked this post!",
      });
    }

    try {
      const isLikeExisted = await prisma.like.findFirst({
        where: { postId: id, userId },
      });

      if (!isLikeExisted) {
        return res.status(400).json({ error: "Like hasn't already existed!" });
      }

      const like = await prisma.like.deleteMany({
        where: { postId: id, userId },
      });

      res.json(like);
      // res.json({ message: "Successfully unliked the post!" });
    } catch (error) {
      console.error("LikeController/unlikePost: unlike post error!", error);
      return res.status(500).json({
        error: "LikeController/unlikePost: internal server error!",
      });
    }
  }
};

module.exports = LikeController;
