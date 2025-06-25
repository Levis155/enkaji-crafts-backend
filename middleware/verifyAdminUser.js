import jwt from "jsonwebtoken";

function verifyAdminUser(req, res, next) {
  const adminAccessToken = req.cookies.enkajiAdminAccessToken;

  if (!adminAccessToken) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  jwt.verify(adminAccessToken, process.env.JWT_SECRET_KEY, (err, data) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    req.user = data;
    next();
  });
}

export default verifyAdminUser;