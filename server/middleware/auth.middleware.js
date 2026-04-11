const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.id) return res.status(401).json({ message: "Invalid token" });
        req.userId = decoded.id;
        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = auth;
