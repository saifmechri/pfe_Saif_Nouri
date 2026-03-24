module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define('Vehicle', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      field: 'user_id'
    },
    modele_voiture: DataTypes.STRING,
    matricule_voiture: DataTypes.STRING,
    type_vehicule: DataTypes.STRING,
    kilometrage_voiture: DataTypes.INTEGER,
    photo_voiture: DataTypes.STRING
  }, {
    tableName: 'vehicules',
    timestamps: false
  });

  Vehicle.associate = (models) => {
    Vehicle.belongsTo(models.User, { foreignKey: 'userId', otherKey: 'id' });
    Vehicle.hasMany(models.Intervention, { foreignKey: 'vehicleId', onDelete: 'CASCADE' });
  };

  return Vehicle;
};
