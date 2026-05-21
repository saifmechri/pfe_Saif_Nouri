const userModel = require('./user.model');
const garageModel = require('./garage.model');
let interventionModel;
try {
  interventionModel = require('./intervention.model');
} catch (e) {
  interventionModel = null;
}

module.exports = {
  userModel,
  garageModel,
  interventionModel
};


