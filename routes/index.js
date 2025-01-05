const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  UserController,
  PostController,
  CommentsController,
  LikeController,
  FollowController,
} = require("../controllers");
const authMiddleware = require("../middlewares/authMiddlewqre");

const uploadDestination = "uploads";
//show where store files
const storage = multer.diskStorage({
  destination: uploadDestination,
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const uploads = multer({ storage: storage });
// user
router.post("/registration", UserController.registration);
router.post("/login", UserController.login);
router.get("/current", authMiddleware, UserController.current);
router.get("/users/:id", authMiddleware, UserController.getUserById);
router.put(
  "/users/:id",
  authMiddleware,
  uploads.single("avatar"),
  UserController.updateUser
);

// posts
router.post("/posts", authMiddleware, PostController.createPost);
router.get("/posts", authMiddleware, PostController.getAllPosts);
router.get("/posts/:id", authMiddleware, PostController.getPostById);
router.delete("/posts/:id", authMiddleware, PostController.removePost);

// comments
router.post("/comments", authMiddleware, CommentsController.createComment);
router.delete(
  "/comments/:id",
  authMiddleware,
  CommentsController.removeComment
);

// like
router.post("/likes", authMiddleware, LikeController.likePost);
router.delete("/likes/:id", authMiddleware, LikeController.unlikePost);

// follow
router.post("/follow", authMiddleware, FollowController.followUser);
router.delete("/unfollow/:id", authMiddleware, FollowController.unfollowUser);

module.exports = router;
