const { prisma } = require("../prisma/prisma-client");

const FollowController = {
  followUser: async (req, res) => {
    const { followingId } = req.body;
    const userId = req.user.userId;

    if (followingId === userId) {
      return res.status(500).json({
        message:
          "FollowController/followUser: you can't following your own accautn!",
      });
    }

    try {
      const isSubscriptionExisted = await prisma.follows.findFirst({
        where: {
          AND: [
            {
              followerId: userId,
            },
            {
              followingId,
            },
          ],
        },
      });

      if (isSubscriptionExisted) {
        return res.status(400).json({
          message:
            "FollowController/followUser: the subscription has already existed!",
        });
      }

      await prisma.follows.create({
        data: {
          follower: { connect: { id: userId } },
          following: { connect: { id: followingId } },
        },
      });
      
      res.status(201).json({
        message: "FollowController/followUser: the subscription is succeed",
      });
    } catch (error) {
      console.error("FollowController/followUser: follow user error!");
      return res.status(500).json({
        error: "FollowController/followUser: internal server error!",
      });
    }
  },

  unfollowUser: async (req, res) => {
    const { followingId } = req.body;
    const userId = req.user.userId;

    try {
      const follows = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId: followingId }],
        },
      });

      if (!follows) {
        return res.status(404).json({
          error:
            "FollowController/unfollowUser: the subscription hasn't found!",
        });
      }

      await prisma.follows.delete({
        where: { id: follows.id },
      });

      res.status(200).json({
        message: "FollowController/unfollowUser: unsubscribe has already done!",
      });
    } catch (error) {
      console.error("FollowController/unfollowUser: unfollow user error!");
      return res.status(500).json({
        error: "FollowController/unfollowUser: internal server error!",
      });
    }
  },
};

module.exports = FollowController;
