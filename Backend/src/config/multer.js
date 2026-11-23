import multer from "multer";

const storage = multer.memoryStorage();

const imageTypes = ["image/jpeg", "image/png", "image/webp"];

const allowedTypes = [
  ...imageTypes,
  "application/pdf",
];

const createUpload = (types, maxFiles = 1) =>
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
      files: maxFiles,
    },
  });

const upload = createUpload(allowedTypes);
export const uploadImage = createUpload(imageTypes);
export const uploadUnitImages = createUpload(imageTypes, 5);

export default upload;