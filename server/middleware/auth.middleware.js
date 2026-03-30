const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = auth;
