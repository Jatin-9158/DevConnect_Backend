const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const express = require('express')
const uploadRouter = express.Router();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
const upload = multer({ dest: 'uploads/' });


uploadRouter.post('/upload', upload.single('file'), (req, res) => {
  cloudinary.uploader.upload(req.file.path, { resource_type: 'auto' }, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ url: result.secure_url });
  });
});
module.exports = uploadRouter