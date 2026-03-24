module.exports = (sequelize, DataTypes) => {
  const Intervention = sequelize.define('Intervention', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    date_intervention: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    type: {
      type: DataTypes.ENUM('révision', 'réparation', 'vidange', 'autre'),
      allowNull: false
    },
    description: DataTypes.TEXT,
    garage_nom: DataTypes.STRING,
    garage_adresse: DataTypes.STRING,
    kilometrage: {
      type: DataTypes.INTEGER,
      validate: { min: 0 }
    },
    cout_total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    // ← AJOUT DES NOUVELLES COLONNES ICI
    km_recommande: {
      type: DataTypes.INTEGER,
      defaultValue: 15000,
      comment: 'Kilométrage recommandé pour cette intervention'
    },
    jours_recommandes: {
      type: DataTypes.INTEGER,
      defaultValue: 365,
      comment: 'Jours recommandés entre deux interventions'
    }
  }, {
    tableName: 'interventions',
    timestamps: true
  });

  Intervention.associate = (models) => {
    Intervention.belongsTo(models.Vehicle, { foreignKey: 'vehicleId', targetKey: 'id', onDelete: 'CASCADE' });
    Intervention.belongsToMany(models.Piece, {
      through: models.InterventionPiece,
      foreignKey: 'interventionId',
      otherKey: 'pieceId',
      as: 'pieces'
    });
  };

  return Intervention;
};