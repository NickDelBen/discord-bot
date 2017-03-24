const winston = require("winston")
import Dictionary from "mw-dictionary"

import { MessageResponse } from "./message_response"
import { arr_com } from "./helpers"
import { block_text, make_pages } from "./discord_messages"

const NET_MAX_LINE_LENGTH = 20

const dict = new Dictionary({
	key: "9e0e960a-33df-42a6-885e-f6bac3b2968a"
});

//sample method
// dict.define(process.argv[3], function(error, result){
// 	if (error == null) {
// 		for(var i=0; i<result.length; i++){
// 			console.log(i+'.');
// 			console.lookupg('Part of speech: '+result[i].partOfSpeech);
// 			console.log('Definitions: '+result[i].definition);
// 			console.log(result[i].definition)
// 		}
// 	}
// 	else if (error === "suggestions"){
// 		console.log(process.argv[3] + ' not found in dictionary. Possible suggestions:');
// 		for (var i=0; i<result.length; i++){
// 			console.log(result[i]);
// 		}
// 	}
// 	else console.log(error);
// });


class ChatTools {
	// Creates a new netsec manager
	constructor (chat_prefix) {
		this.chat_prefix = chat_prefix
	}

	// Returns the types of messages the bot can handle
	get messageTypes () {
		return ["text", "dm"]
	}

	// Defines a word
	async define (word) {
		let result = null
		// Create a promise for the result of the lookup
		const lookup_result = (options) => new Promise((resolve, reject) => {
			// Preform dictionary lookup
			dict.define(word, (error, result) => {
				if (error) {
					reject(error)
				}
				resolve(result)
			})
		})

		try {
			let pages = []
			// Preform the lookup
			const results = await lookup_result()
			for (let result of results) {
				pages.push(block_text(`${result.partOfSpeech}\n${result.definition}`))
			}
			return new MessageResponse(true, "", false, null, null, {
				pages: pages
			})
		} catch (err) {
			return new MessageResponse(true, `There was no dictionary entry for \`${word}\``, false)
		}
	}

	// Handles a text message
	handleText (message, prefix, roles, author, channel) {
		// If it is not a valid command ignore
		if (!(message.startsWith(`${prefix}${this.chat_prefix}`))) {
			return new MessageResponse(false, "Unrelated", false)		
		}
		// Split the message like command line args
		const split_message = message.match(/(".*?"|[^\s]+)+(?=\s*|\s*$)/g)
		// Check if this is a blank or help command
		if (split_message.length == 1 || split_message[1] == "help") {
			return new MessageResponse(true, net_help(), false)
		}
		// Check if was a whois lookup 
		if (split_message[1] == "define" && split_message.length >= 3) {
			return this.define(split_message[2])
		}
		return new MessageResponse(false, chat_help(), false)
	}

	// Handle a dm message
	handleDM (message, prefix, author, channel) {
		return handleText(message, prefix, [], author, channel)
	}
}

export { ChatTools }
