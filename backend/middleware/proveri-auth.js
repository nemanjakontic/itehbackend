const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.query.auth;
    console.log(token);
    const decodedToken = jwt.verify(token, 'secret_this_should_be_very_long');
    req.userData = {email: decodedToken.email, userId: decodedToken.userId};
    next();
  }catch (error) {
    res.status(401).json({message: 'Niste autentikovani'});
  }
};
