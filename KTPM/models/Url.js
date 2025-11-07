const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Url = sequelize.define('Url', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'data',
  timestamps: false,
}); 

module.exports = Url;
