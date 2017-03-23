
import db_mongo from "./db_mongo"
import { MessageResponse } from "./message_response"
import { arr_com } from "./helpers"
import { block_text } from "./discord_messages"

// Help text for the pattern matcher
const pattern_help = function () {
	return block_text(
`Responds with specified messages when patterns are detected
    pm help                          [DM/channel] This help text
    pm add "<pattern>" "<response>"  [DM/channel] Create a new pattern-response pair
    pm rm "<pattern>"                [DM/channel] Remove an existing pattern-response pair`)
}

class PatternMatcher {
	// Create a new responder from the specified colelction
	constructor (collection_name, add_prefix, replace_for, modify_for, gods, show_errors) {
		this.gods = gods
		this.replacers = replace_for
		this.modifiers = modify_for
		this.add_prefix = add_prefix
		this.errors = show_errors
		// Store the collection name for further use
		this.collection = collection_name
		// Store the possible responses
		this.patterns = {}
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
   			this.patterns[target] = {
   				target: selection_i.target,
   				exp: new RegExp(selection_i.target),
   				response: selection_i.response
   			}
    	}
	}

	// Returns the types of messages the bot can handle
	get messageTypes () {
		return ["text", "dm"]
	}

	// Handles a text message
	handleText (message, prefix, roles, author_id) {
		// Check if this is an add command
		if (!(message.startsWith(`${prefix}${this.add_prefix}`))) {
			if (arr_com(this.replacers, roles)) {
				// Check if this message is one of the targets
				return this.checkMessage(message)
			}
			return new MessageResponse(false, "Unrelated", false)			
		}
		// Split the message like command line args
		const split_message = message.match(/(".*?"|[^\s]+)+(?=\s*|\s*$)/g)
		// Check if this is a blank or help command
		if (split_message.length == 1 || split_message[1] == "help") {
			return new MessageResponse(true, pattern_help(), false)
		}
		// Ensure user has permissions
		if (! (arr_com(this.modifiers, roles) || this.gods.includes(author_id))) {
			return new MessageResponse(this.errors, `You do not have permission to modify reactions`, false)
		}
		// Check if this is an add command
		if (split_message[2] == "add" && split_message.length >= 4) {
			return this.addMessage(split_message[2].replace(/['"']+/g, ''), split_message[3].replace(/['"']+/g, ''))
		}
		// Check if this is a remove command
		if (split_message[2] == "rm" && split_message.length >= 3) {
			return this.removeMessage(split_message[2].replace(/['"']+/g, ''))
		}
		// Reached command error
		return new MessageResponse(this.errors, `Command \"${prefix}${this.add_prefix} ${split_message[1]}\" with ${split_message.length-2} parameters not found`, false)
	}

	// Handle a dm
	handleDM (message, prefix, author_id, channe_id) {
		// If it is not a valid command ignore
		if (!(message.startsWith(`${prefix}${this.add_prefix}`))) {
			return new MessageResponse(false, "Unrelated", false)		
		}
		// Split the message like command line args
		const split_message = message.match(/(".*?"|[^\s]+)+(?=\s*|\s*$)/g)
		// Check if this is a blank or help command
		if (split_message.length == 1 || split_message[1] == "help") {
			return new MessageResponse(true, pattern_help(), false)
		}
		// Ensure user has permissions
		if (! this.gods.includes(author_id)) {
			return new MessageResponse(this.errors, `You do not have permission to modify reactions`, false)
		}
		// Check if this is an add command
		if (split_message[2] == "add" && split_message.length >= 4) {
			return this.addMessage(split_message[2].replace(/['"']+/g, ''), split_message[3].replace(/['"']+/g, ''))
		}
		// Check if this is a remove command
		if (split_message[2] == "rm" && split_message.length >= 3) {
			return this.removeMessage(split_message[2].replace(/['"']+/g, ''))
		}
		// Reached command error
		return new MessageResponse(this.errors, `Command \"${prefix}${this.add_prefix} ${split_message[1]}\" with ${split_message.length-2} parameters not found`, false)
	}

	// Check if a message should be replaced by the responder
	checkMessage (message) {
		// Hit each of the candidates
		for (const candidate_i in this.patterns) {
			const candidate = this.patterns[candidate_i]
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
        	// Search for if pattern in database
            const search_result = (await collection.findOne({ target: target }))
            if (! search_result) {
            	return new MessageResponse(true, `${target} is not a learned pattern`, false)
            }
            // Remove from database
            (await collection.remove({ target: target }))
            // Remove from cache
            delete this.patterns[target]
            return new MessageResponse(true, `Pattern \`${target}\` has been unlearned`, false)
        } catch (error) {
            winston.error("Error searching database to check if ${session_id} exists")
            winston.error(error)
        }
        return new MessageResponse(this.errors, this.errors ? `Error removing ${target} from text replacements` : null, false)
	}

	// Add a message to the responder
	async addMessage (target, response) {
		const insert_data = {
			target: target,
			response: response
		}
		this.patterns[target] = {
			target: target,
			exp: new RegExp(target),
			response: response
		}
		// Grab the collection form the database
		const collection = db_mongo.get().collection(this.collection)
		try {
			// Upsert into document, replacing if exists
			const update_result = (await collection.update({target: target}, insert_data, { upsert: true })).result
			// If there was a created item reply with update message
			if (update_result.nModified == 1) {
				return new MessageResponse(true, `Pattern \`${target}\` -> \`${response}\` has been relearned`, false)
			}
			// If there was an insert reply with that message
			if (update_result.nUpserted == 1) {
				return new MessageResponse(true, `Pattern \`${target}\` -> \`${response}\` has been learned`, false)
			}
		} catch (err) {
			winston.error(`Error creating new replacement text (${target} -> ${response})`)
			winston.error(err)
		}
		return new MessageResponse(this.errors, this.errors ? `Error creating pattern \`${target} -> ${response}\`` : null, false)
	}
}

export { PatternMatcher }
