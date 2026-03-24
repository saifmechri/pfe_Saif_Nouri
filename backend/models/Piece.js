module.exports = (sequelize, DataTypes) => {
  const Piece = sequelize.define('Piece', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: DataTypes.TEXT,
    prix_unitaire: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'pieces',
    timestamps: true
  });

  Piece.associate = (models) => {
    Piece.belongsToMany(models.Intervention, {
      through: models.InterventionPiece,
      foreignKey: 'pieceId',
      otherKey: 'interventionId'
    });
  };

  return Piece;
};
