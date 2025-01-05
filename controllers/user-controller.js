const { prisma } = require("../prisma/prisma-client");
const bcrypt = require("bcryptjs");
const jdenticon = require("jdenticon");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const UserController = {
  registration: async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    try {
      const isUserExisted = await prisma.user.findUnique({ where: { email } });
      if (isUserExisted) {
        return res.status(400).json({
          error: `UserController/registration: User with this email, ${email}, has been existed`,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const avatarImage = jdenticon.toPng(name, 200);
      const avatarName = `${name}_${Date.now()}.png`;
      const avatarPath = path.join(__dirname, "/../uploads", avatarName);
      fs.writeFileSync(avatarPath, avatarImage);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          avatarUrl: `/uploads/${avatarPath}`,
        },
      });

      res.json(user);
    } catch (error) {
      console.error("UserController/registration: ", error.message);
      res.status(500).json({ error: "An error occurred during registration." });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({
          error: "UserController/login: The user wasn't found!",
        });
      }

      const isPasswordsEqual = await bcrypt.compare(password, user.password);
      if (!isPasswordsEqual) {
        return res.status(400).json({
          error: "UserController/login: Incorrect password!",
        });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_ACCESS_SECRET,
        {
          expiresIn: "30d",
        }
      );

      res.json({ token });
    } catch (error) {
      console.error("UserController/login: ", error.message);
      res.status(500).json({ error: "An error occurred during login." });
    }
  },

  getUserById: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          followers: true,
          following: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          error: "UserController/getUserById: the user hasn't found!",
        });
      }

      const isFollowing = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId: id }],
        },
      });

      res.json({ ...user, isFollowing: Boolean(isFollowing) });
    } catch (error) {
      console.error("UserController/getUserById: ", error);
      return res.status(500).json({
        error: "UserController/getUserById: internal server error!",
      });
    }
  },

  updateUser: async (req, res) => {
    const { id } = req.params;
    const { email, name, dateOfBirth, bio, location } = req.body;

    let filePath;

    if (req.file && req.file.path) {
      filePath = req.file.path;
    }

    if (id !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "UserController/updateUser: have no access!" });
    }

    try {
      if (email) {
        const isUserExisted = await prisma.user.findFirst({ where: { email } });
        if (isUserExisted && isUserExisted.id !== id) {
          return res.status(400).json({
            error: `UserController/updateUser: User with this email, ${email}, has been existed!`,
          });
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          email: email || undefined,
          name: name || undefined,
          avatarUrl: filePath ? `/${filePath}` : undefined,
          dateOfBirth: dateOfBirth || undefined,
          bio: bio || undefined,
          location: location || undefined,
        },
      });

      res.json(user);
    } catch (error) {
      console.log("UserController/updateUser:", error);
      res.status(500).json({ error: "UserController/updateUser: error!" });
    }
  },

  current: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.user.userId
        },
        include: {
          followers: {
            include: {
              follower: true,
            },
          },
          following: {
            include: {
              following: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(400).json({error: 'UserController/current: couldn\'t find the user!'})
      }

      res.json(user);
    } catch (error) {
      console.error('UserController/current: ', error);
      return res.status(500).json({error: 'UserController/current: internal server error!'})
    }
  },
};

module.exports = UserController;
