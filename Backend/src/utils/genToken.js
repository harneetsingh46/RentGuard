import jwt from "jsonwebtoken";

const genToken = (id, username, email, role) => {
  return jwt.sign({ id, username, email, role }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
};

export default genToken;
