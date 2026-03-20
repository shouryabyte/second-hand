const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const streamifier = require("streamifier");

const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

function randomId() {
  return crypto.randomBytes(10).toString("hex");
}

function getUploadProvider() {
  const configured = isCloudinaryConfigured();
  const env = (process.env.UPLOAD_PROVIDER || "").trim().toLowerCase();
  if (env === "cloudinary" || env === "local") return env;
  return configured ? "cloudinary" : "local";
}

function ensureUploadsDir() {
  fs.mkdirSync(path.join(process.cwd(), "uploads"), { recursive: true });
}

function localPublicUrl(req, filename) {
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}/uploads/${encodeURIComponent(filename)}`;
}

function uploadToCloudinaryBuffer(buffer, { folder, publicId, resourceType, mimeType }) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        invalidate: true
      },
      (err, result) => {
        if (err) return reject(err);
        return resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
}

async function uploadImage(req, file) {
  const provider = getUploadProvider();
  if (provider === 'local' && process.env.VERCEL) {
    throw new Error('Local uploads are not supported on Vercel. Set UPLOAD_PROVIDER=cloudinary and configure Cloudinary env vars.');
  }
  if (provider === "cloudinary") {
    if (!isCloudinaryConfigured()) throw new Error("Cloudinary is not configured");
    const folder = process.env.CLOUDINARY_FOLDER || "sh-marketplace";
    const publicId = `${Date.now()}-${randomId()}`;
    const result = await uploadToCloudinaryBuffer(file.buffer, {
      folder,
      publicId,
      resourceType: "image",
      mimeType: file.mimetype
    });

    return {
      url: result.secure_url || result.url,
      publicId: result.public_id,
      originalName: file.originalname || null,
      mimeType: file.mimetype,
      size: file.size
    };
  }

  ensureUploadsDir();
  const ext = path.extname(file.originalname || "").slice(0, 10);
  const filename = `${Date.now()}-${randomId()}${ext}`;
  const full = path.join(process.cwd(), "uploads", filename);
  fs.writeFileSync(full, file.buffer);
  return {
    url: localPublicUrl(req, filename),
    publicId: filename,
    originalName: file.originalname || null,
    mimeType: file.mimetype,
    size: file.size
  };
}

async function uploadVoice(req, file) {
  const provider = getUploadProvider();
  if (provider === 'local' && process.env.VERCEL) {
    throw new Error('Local uploads are not supported on Vercel. Set UPLOAD_PROVIDER=cloudinary and configure Cloudinary env vars.');
  }
  if (provider === "cloudinary") {
    if (!isCloudinaryConfigured()) throw new Error("Cloudinary is not configured");
    const folder = (process.env.CLOUDINARY_FOLDER || "sh-marketplace") + "/voice";
    const publicId = `${Date.now()}-${randomId()}`;
    const result = await uploadToCloudinaryBuffer(file.buffer, {
      folder,
      publicId,
      resourceType: "video",
      mimeType: file.mimetype
    });

    return {
      url: result.secure_url || result.url,
      publicId: result.public_id,
      mimeType: file.mimetype,
      size: file.size
    };
  }

  ensureUploadsDir();
  const ext = path.extname(file.originalname || "").slice(0, 10) || ".webm";
  const filename = `${Date.now()}-${randomId()}${ext}`;
  const full = path.join(process.cwd(), "uploads", filename);
  fs.writeFileSync(full, file.buffer);
  return {
    url: localPublicUrl(req, filename),
    publicId: filename,
    mimeType: file.mimetype,
    size: file.size
  };
}

module.exports = { getUploadProvider, uploadImage, uploadVoice };
