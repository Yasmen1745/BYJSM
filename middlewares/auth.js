import jwt from "jsonwebtoken";
import User from "../models/user.js"

export default function (allowedRoles) {
  allowedRoles = allowedRoles || [];

  return async function (req, res, next) {
    try {
      const token = req.cookies.token;
      console.log(`Auth middleware - Path: ${req.path}, Token exists: ${!!token}, Required roles: ${allowedRoles.join(',')}`);

      if (!token) {
        console.log('No token provided');
        // Check if this is an API request
        const isApiRequest = req.path.startsWith('/api/') ||
                           req.headers.accept?.includes('application/json') ||
                           req.headers['content-type']?.includes('multipart/form-data');
        if (isApiRequest) {
          return res.status(401).json({ message: "No token provided" });
        }
        return res.status(401).redirect("/");
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`Token decoded - User ID: ${decoded.id}, Role: ${decoded.role}`);

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        console.log(`Access denied - User role: ${decoded.role}, Required: ${allowedRoles.join(',')}`);
        // Check if this is an API request
        const isApiRequest = req.path.startsWith('/api/') ||
                           req.headers.accept?.includes('application/json') ||
                           req.headers['content-type']?.includes('multipart/form-data');
        if (isApiRequest) {
          return res.status(403).json({ message: "Forbidden: Access denied" });
        }
        return res.status(403).redirect("/");
      }

      req.user = await User.findById(decoded.id);
      console.log(`Authentication successful for user: ${req.user?.name}`);
      next();
    } catch (error) {
      console.log('JWT verification error:', error.message);
      // Always return JSON for API errors
      const isApiRequest = req.path.startsWith('/api/') ||
                         req.headers.accept?.includes('application/json') ||
                         req.headers['content-type']?.includes('multipart/form-data');
      if (isApiRequest) {
        return res.status(401).json({ message: "Invalid or expired token", error: error.message });
      }
      return res.status(401).redirect("/");
    }
  };
}
