module.exports = (sequelize, DataTypes) => {
  const Garage = sequelize.define('Garage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    adresse: DataTypes.STRING,
    telephone: DataTypes.STRING,
    email: DataTypes.STRING,
    // ← COLONNES POUR RECOMMANDATIONS:
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      comment: 'Latitude GPS du garage'
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      comment: 'Longitude GPS du garage'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 3.5,
      comment: 'Note moyenne du garage (0-5)'
    },
    isOpen: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'garages',
    timestamps: true
  });

  return Garage;
};
