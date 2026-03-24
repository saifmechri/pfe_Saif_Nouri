module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    password: DataTypes.STRING,
    role_id: DataTypes.INTEGER,
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      defaultValue: 33.8869,
      comment: 'Latitude GPS de l\'utilisateur (Tunis par défaut)'
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      defaultValue: 9.5375,
      comment: 'Longitude GPS de l\'utilisateur (Tunis par défaut)'
    }
  }, {
    tableName: 'users',
    timestamps: false
  });

  User.associate = (models) => {
    User.hasMany(models.Vehicle, { foreignKey: 'userId', onDelete: 'CASCADE' });
  };

  return User;
};
