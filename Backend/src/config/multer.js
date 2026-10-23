import multer from "multer";

const storage = multer.memoryStorage();

const imageTypes = ["image/jpeg", "image/png", "image/webp"];

const allowedTypes = [
  ...imageTypes,
  "application/pdf",
];

const createUpload = (types) =>
  multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (types.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type."), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  });

const upload = createUpload(allowedTypes);
export const uploadImage = createUpload(imageTypes);

export default upload;