const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    content: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }]
}, { timestamps: true }); // <-- important

module.exports = mongoose.model("post", postSchema);
