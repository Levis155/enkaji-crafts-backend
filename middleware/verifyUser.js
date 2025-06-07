import jwt from "jsonwebtoken";

function verifyUser(req, res, next) {
  const { enkajiAuthToken } = req.cookies;

  if (!enkajiAuthToken) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  jwt.verify(enkajiAuthToken, process.env.JWT_SECRET_KEY, (err, data) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    req.user = data;
    next();
  });
}

export default verifyUser;
