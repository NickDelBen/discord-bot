
import db_mongo from "./db_mongo"
import { MessageResponse } from "./message_response"
import { arr_com } from "./helpers"

class PatternMatcher {

	// Create a new responder from the specified colelction
	constructor (collection_name, add_prefix, replace_for, modify_for, show_errors) {
		this.replacers = replace_for
		this.modifiers = modify_for
		this.add_prefix = add_prefix
		this.errors = show_errors
		// Store the collection name for further use
		this.collection = collection_name
		// Store the possible responses
		this.patterns = []
		// Create the collection to ensure it exists
		db_mongo.create_collection(collection_name)
		try {
			// Attempt to fill the array
			this.loadItems ()
		} catch (err) {
			// Handle the case where mongo gives us an error
			winston.error(`Error retrieving replacements from library`)
			winston.error(err)
			throw new Error(`Could not retrieve command list from collection ${collection_name}`)
		}
	}

	// Fills the array form the collection
	async loadItems () {
		// Grab the collection form the database
		const collection = db_mongo.get().collection(this.collection)
		// Select all the sessions from the database
    	const selection = await collection.find().toArray()
    	// Create a session object from the result
   		for (const selection_i of selection) {
   			this.patterns.push({
   				target: selection_i.target,
   				exp: new RegExp(selection_i.target),
   				response: selection_i.response
   			})
    	}
	}

	// Handles the message
	handleMessage (message, prefix, roles) {
		let responses = []
		// Check if this is an add command
		if ((!(message.startsWith(`${prefix} ${this.add_prefix}`))) && arr_com(this.replacers, roles)) {
			// Check if this message is one of the targets
			return this.checkMessage(message)
		}
		// Ensure user has permissions
		if (! (arr_com(this.modifiers, roles))) {
			return new MessageResponse(this.errors, `You do not have permission to add reactions`, false)
		}
		// Split the message like command line args
		const split_message = message.match(/(".*?"|[^\s]+)+(?=\s*|\s*$)/g)
		// Check if this is a blank or help command
		if (split_message.length == 2 || split_message[2] == "help") {
			return new MessageResponse(true, "this is some help text - nick", false)
		}
		// Check if this is an add command
		if (split_message[2] == "add" && split_message.length >= 5) {
			return this.addMessage(split_message[3].replace(/['"']+/g, ''), split_message[4].replace(/['"']+/g, ''))
		}
		// Check if this is a remove command
		if (split_message[2] == "rm" && split_message.length >= 4) {
			return this.removeMessage(split_message[3].replace(/['"']+/g, ''))
		}
		// Reached command error
		return new MessageResponse(this.errors, `Command \"${prefix} ${this.add_prefix} ${split_message[2]}\" with ${split_message.length-3} parameters not found`, false)
		
	}

	// Check if a message should be replaced by the responder
	checkMessage (message) {
		// Hit each of the candidates
		for (const candidate of this.patterns) {
			// Check for a match
			if (candidate.exp.test(message)) {
				return new MessageResponse(true, candidate.response, false)
			}
		}
		return new MessageResponse(this.errors, this.errors ? "Message not found" : null, false)
	}

	// Delete a message from the responder
	async removeMessage (target) {
		// Get the collection from the database
        const collection = db_mongo.get().collection(this.collection)
        try {
            const search_result = (await collection.findOne({ target: target }))
            if (! search_result) {
            	return new MessageResponse(true, `${target} is not a learned pattern`, false)
            }
            (await collection.remove({ target: target }))
            let new_patterns = []
            for (const old_pattern of this.patterns) {
            	if (old_pattern.target != target) {
            		new_patterns.push(old_pattern)
            	}
            }
            this.patterns = new_patterns
            return new MessageResponse(true, `Pattern \`${target}\` has been unlearned`, false)
        } catch (error) {
            winston.error("Error searching database to check if ${session_id} exists")
            winston.error(error)
        }
        return new MessageResponse(this.errors, this.errors ? `Error removing ${target} from text replacements` : null, false)
	}

	// Add a message to the responder
	addMessage (target, response) {
		const insert_data = {
			target: target,
			response: response
		}
		this.patterns.push({
			target: target,
			exp: new RegExp(target),
			response: response
		})
		// Grab the collection form the database
		const collection = db_mongo.get().collection(this.collection)
		let result = null
		collection.insert(insert_data, (err, result) => {
			if (err) {
				winston.error(`Error creating new replacement text (${target} -> ${response})`)
				winston.error(err)
				result = new MessageResponse(this.errors, this.errors ? `Error creating new replacement text (${target} -> ${response})` : null, false)
			}
		})
		return new MessageResponse(true, `Pattern \`${target}\` -> \`${response}\` has been learned`, false)
	}
}

export { PatternMatcher }
