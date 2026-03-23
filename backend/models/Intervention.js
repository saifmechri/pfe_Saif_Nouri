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
    garage_nom: DataTypes.STRING,     // optionnel : nom du garage
    garage_adresse: DataTypes.STRING,  // optionnel
    kilometrage: {
      type: DataTypes.INTEGER,
      validate: { min: 0 }
    },
    cout_total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    }
  }, {
    tableName: 'interventions',
    timestamps: true
  });

  Intervention.associate = (models) => {
    Intervention.belongsTo(models.Vehicle, { foreignKey: 'vehicleId', targetKey: 'id', onDelete: 'CASCADE' });
    // Une intervention peut avoir plusieurs pièces (relation many-to-many)
    Intervention.belongsToMany(models.Piece, {
      through: models.InterventionPiece,
      foreignKey: 'interventionId',
      otherKey: 'pieceId',
      as: 'pieces'
    });
  };

  return Intervention;
};