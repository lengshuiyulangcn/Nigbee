// load the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
// define the schema for our user model
var postSchema = mongoose.Schema({
        author	     : ObjectId,
	username     : String,
	title        : { type: String, required: '{PATH} is required'},
	content      : { type: String, required: '{PATH} is required'},
        created_at   : { type: Date, default: Date.now },
        updated_at   : { type: Date, default: Date.now },
	tags	     : { type: [String]}
});

postSchema.plugin(require('mongoose-paginate'))
// create the model for users and expose it to our app
module.exports = mongoose.model('Post', postSchema);
