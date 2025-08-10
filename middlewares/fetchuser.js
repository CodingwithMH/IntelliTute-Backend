const jwt = require("jsonwebtoken");
const fetchuser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = data.user;

    next();
  } catch (error) {
    res.status(401).json({ error: "Authenticate using a valid token" });
  }
};
module.exports = fetchuser;
