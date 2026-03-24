const db = require('../db');

module.exports = {
  User: db.User,
  Vehicle: db.Vehicle,
  Intervention: db.Intervention,
  Piece: db.Piece,
  InterventionPiece: db.InterventionPiece,
  sequelize: db.sequelize,
  Sequelize: db.Sequelize
};
