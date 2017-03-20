
var MongoClient = require('mongodb').MongoClient

// Create an initial state for the database
var state = {
	db: null,
}

// Get the database
exports.get = function()
{
  return state.db
}

// Connect to the database
exports.connect = function(url, done)
{
	// If the database is connected continue
	if (state.db) {
		return done()
	}
	// Try to connect to the database
	MongoClient.connect(url, function(err, db) {
		// If there was an error finish and pus the error code
		if (err) {
			return done(err)
		}
		state.db = db
		done()
	})
}

// Close the database connection
exports.close = function()
{
	// If no database is connected return
	if (!state.db) {
		return
	}
	// Close any open database
	state.db.close(function(err, result) {
		state.db = null
		state.mode = null
		done(err)
	})
}

// Create a new collection if it does not exist
exports.create_collection = async function (collection_name)
{
	try {
		// Do not create if it exists already
		if ((await state.db.runCommand({listCollections: 1})).includes(collection_name)) {
			return
		}
		state.db.createCollection(collection_name)
	} catch (err) {
		return
	}
}
