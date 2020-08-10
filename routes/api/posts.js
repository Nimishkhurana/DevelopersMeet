const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");
const Post = require("../../models/Post");

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  "/",
  auth,
  [check("text", "Text is required").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const post = new Post({
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
      });

      await post.save();
      res.json(post);
    } catch (err) {
      console.erorr(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get(
  "/",
  auth,

  async (req, res) => {
    try {
      const posts = await Post.find().sort({ date: -1 });

      res.json(posts);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route   GET api/posts/:post_id
// @desc    Get post by id
// @access  Private
router.get(
  "/:post_id",
  auth,

  async (req, res) => {
    try {
      const post = await Post.findById(req.params.post_id);
      if (!post) {
        return res.status(404).send({ msg: "Post not found" });
      }
      res.json(post);
    } catch (err) {
      if (err.kind == "ObjectId") {
        return res.status(404).send({ msg: "Post not found" });
      }
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route   DELETE api/posts/:post_id
// @desc    DELETE post by id
// @access  Private
router.delete("/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).send({ msg: "Post not found" });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(401).send({ msg: "User not authorized" });
    }

    await post.remove();
    res.json({ msg: "Post removed" });
  } catch (err) {
    if (err.kind == "ObjectId") {
      return res.status(404).send({ msg: "Post not found" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/posts/like/:post_id
// @desc    Like a post
// @access  Private
router.put("/like/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).send({ msg: "Post not found" });
    }

    // Check if post is already liked by user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).send({ msg: "Post already liked" });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();
    res.json(post.likes);
  } catch (err) {
    if (err.kind == "ObjectId") {
      return res.status(404).send({ msg: "Post not found" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/posts/unlike/:post_id
// @desc    Unlike a post
// @access  Private
router.put("/unlike/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).send({ msg: "Post not found" });
    }

    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    if (removeIndex === -1) {
      return res
        .status(400)
        .send({ msg: "Post has not yet been liked by user" });
    }

    post.likes.splice(removeIndex, 1);
    await post.save();

    res.json(post.likes);
  } catch (err) {
    if (err.kind == "ObjectId") {
      return res.status(404).send({ msg: "Post not found" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/posts/comment/:post_id
// @desc    Add a comment on post
// @access  Private
router.put(
  "/comment/:post_id",
  auth,
  [check("text", "Text is required").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const post = await Post.findById(req.params.post_id);
      if (!post) {
        return res.status(404).send({ msg: "Post not found" });
      }

      const user = await User.findById(req.user.id);
      const comment = {
        user: user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
      };

      post.comments.unshift(comment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      if (err.kind == "ObjectId") {
        return res.status(404).send({ msg: "Post not found" });
      }
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route   DELETE api/posts/comment/:post_id/:comment_id
// @desc    Delete a comment
// @access  Private
router.delete("/comment/:post_id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).send({ msg: "Post not found" });
    }

    // Check if comment exists on this post
    const removeIndex = post.comments
      .map((comment) => comment.id)
      .indexOf(req.params.comment_id);
    if (removeIndex === -1) {
      return res.status(404).send({ msg: "Comment not found" });
    }

    if (post.comments[removeIndex].user.toString() !== req.user.id) {
      return res.status(401).send({ msg: "User not authorized" });
    }

    post.comments.splice(removeIndex, 1);
    await post.save();

    res.json(post.comments);
  } catch (err) {
    if (err.kind == "ObjectId") {
      return res.status(404).send({ msg: "Post not found" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
