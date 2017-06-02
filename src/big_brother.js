
const winston = require("winston")
const Vision = require('@google-cloud/vision');
const fs = require('fs')
const request = require('request')

import { settings } from "./helpers"
import { MessageResponse } from "./message_response"
import { arr_com } from "./helpers"
import { block_text, make_pages } from "./discord_messages"

const brother_help = function () {
	return block_text(
`Big Brother is watching. Active modules: 
    Computer Vision`)
}

// Instantiates a client
const vision = Vision({
	projectId: settings.google.api_projectId,
	keyFilename: settings.google.api_credentials
});

class BigBrother {
	// Creates a new netsec manager
	constructor (brother_prefix, users, admins, gods, show_errors=true) {
		this.users = users
		this.admins = admins
		this.gods = gods
		this.brother_prefix = brother_prefix
		this.errors = show_errors
	}

	// Returns the types of messages the bot can handle
	get messageTypes () {
		return ["text"]
	}

	// Describes an image
	async describeImage (uri) {
		// Request description from google
		let image_data = new Promise((resolve, reject) => {
			request.head(uri, function(err, res, body) {
				if (err) {
					reject(err)
				}
				const temp_file = Math.random().toString(32)
	    		request(uri).pipe(fs.createWriteStream(temp_file)).on('close', () => {
	    			vision.detectSafeSearch(temp_file)
					.then((results) => {
						fs.unlink(temp_file, () => {
							resolve(results[0])
						})
					}).catch((err) => {
						reject(err)
					})
	    		})
			})
		})

		// Wait for result to execute
		try {
			let result = await image_data

			let exists_tags = 0
			for (let current of [result.adult, result.spoof, result.medical, result.voilence]) {
				if (current) {
					exists_tags += 1
				}
			}
			if (result.adult || result.spoof || result.medical || result.voilence) {
				let result 
			}
			// Check if not interesting
			if (exists_tags == 0) {
				return new MessageResponse(true, block_text("This image is not interesting"), false)
			}
			// Build the options for the description string
			const options_final = [
				result.adult ? 'adult content' : "",
				result.spoof ? 'a spicy meme' : "",
				result.medical ? 'medical imagery' : "",
				result.violence ? 'violent imagery' : ""
			]
			// Build the description string
			let found_tags = 0
			let current_message = "Image contains "
			for (let o_current of options_final) {
				// Skip empty options
				if (o_current == "") {
					continue
				}
				found_tags += 1
				// Add the first element
				if (found_tags == 1) {
					current_message += `${o_current}`
					continue
				}
				current_message += `${found_tags == exists_tags ? " and" : ","} ${o_current}`
			}
			return new MessageResponse(true, block_text(current_message), false)
		} catch (err) {
			return new MessageResponse(true, "The specified image path was a lie", false)
		}
		
	}

	// Handles a text message
	handleText (message, prefix, roles, author, channel) {
		// If it is not a valid command ignore
		if (message == `${prefix}${this.brother_prefix}` || message == `${prefix}${this.brother_prefix} help`) {
			return new MessageResponse(true, brother_help(), false)		
		}
		// Check if this is an add command
		if (!(message.startsWith(`${prefix}${this.brother_prefix}`))) {
			return new MessageResponse(false, "Unrelated", false)			
		}
		// Split the message like command line args
		const split_message = message.match(/(".*?"|[^\s]+)+(?=\s*|\s*$)/g)

		if (! (arr_com(this.modifiers, roles) || this.gods.includes(author.id))) {
			return new MessageResponse(this.errors, `You do not have permission to modify BigBrother settings`, false)
		}

		if (split_message[1] == "analyze") {
			return this.describeImage(split_message[2])
		}

		return new MessageResponse(false, "Unrelated", false)
	}


}

export { BigBrother }

