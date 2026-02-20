/**
 * Admin middleware: requires user to be authenticated AND have role 'admin'.
 * Use after protect middleware.
 */

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied – admin only' });
};

module.exports = { adminOnly };
