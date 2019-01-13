var mongoose = require('mongoose');


var projectSchema = mongoose.Schema({
    nameProject: {type: String, required: true},
    descripProject: {type: String, required: true}
});

module.exports = mongoose.model('Project', projectSchema);