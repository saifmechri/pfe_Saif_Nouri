module.exports = (sequelize, DataTypes) => {
  const InterventionPiece = sequelize.define('InterventionPiece', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    quantite: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1 }
    },
    prix_unitaire_applique: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Prix de la pièce au moment de l\'intervention'
    }
  }, {
    tableName: 'intervention_pieces',
    timestamps: false
  });

  return InterventionPiece;
};