const { prisma } = require("../prisma/prisma-client");

const CommentsController = {
  createComment: async (req, res) => {
    const { postId, content } = req.body;
    const userId = req.user.userId;

    if (!postId || !content) {
      return res.status(400).json({
        message: "CommentsController/createComment: all fields are required!",
      });
    }

    try {
      const comment = await prisma.comment.create({
        data: {
          postId,
          userId,
          content,
        },
      });

      res.json(comment);
    } catch (error) {
      console.error("CommentsController/createComment: create comment error!");
      return res.status(500).json({
        error: "CommentsController/createComment: internal server error!",
      });
    }
  },

  removeComment: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const isCommentExisted = await prisma.comment.findUnique({
        where: { id },
      });

      if (!isCommentExisted) {
        return res
          .status(404)
          .json({ error: "The comment hasn't been found!" });
      }

      if (isCommentExisted.userId !== userId) {
        return res
          .status(403)
          .json({
            error:
              "CommentsController/removeComment: you don't have the access to delete this comment!",
          });
      }

      await prisma.comment.delete({ where: { id } });

      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("CommentsController/removeComment: remove comment error!");
      return res.status(500).json({
        error: "CommentsController/removeComment: internal server error!",
      });
    }
  },
};

module.exports = CommentsController;
