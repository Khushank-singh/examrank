const jwt = require("jsonwebtoken");

const JWT_SECRET = "examrank_secret_key";

function authMiddleware(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            error: "Access denied. No token provided."
        });
    }

    console.log("Auth header received:", authHeader);

    let token;

    if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    } else {
        token = authHeader;
    }

    console.log("Token extracted:", token);

    try {

        const decoded = jwt.verify(token.trim(), JWT_SECRET);

        req.userId = decoded.userId;

        next();

    }
    catch (error) {

        console.log("JWT Error:", error.message);

        return res.status(401).json({
            error: "Invalid token"
        });

    }

}

module.exports = authMiddleware;
