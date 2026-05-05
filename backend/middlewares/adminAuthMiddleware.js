const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'jwt_secret_key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin123@gmail.com';

const verifyAdminToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'Token non fourni', data: null });

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ success: false, message: 'Format de token invalide', data: null });

    const decoded = jwt.verify(token, SECRET);
    if (!decoded || !decoded.admin || decoded.email !== ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: 'Acces admin refuse', data: null });
    }

    req.admin = { email: decoded.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expire', data: null });
    return res.status(401).json({ success: false, message: 'Token invalide', data: null });
  }
};

module.exports = { verifyAdminToken };
