const winston = require("winston")
import Dictionary from "mw-dictionary"
import fetch from "node-fetch"

import { MessageResponse } from "./message_response"
import { arr_com } from "./helpers"
import { block_text, make_pages } from "./discord_messages"
import { settings } from "./helpers"

const NET_MAX_LINE_LENGTH = 20

const PERFECT_SCORE   = 300;
const OFFENSIVE_FLAG  = 'a';
const DICTIONARY_FLAG = 'b';

const dict = new Dictionary({
	key: settings.dictionary.key
});

class ChatTools {
	// Creates a new netsec manager
	constructor (chat_prefix) {
		this.chat_prefix = chat_prefix
	}

	// Returns the types of messages the bot can handle
	get messageTypes () {
		return ["text", "dm"]
	}

	// Fetches rhymes with a word
	async rhyme (word, results=400) {
		// Create promise for rhyme lookup
		const lookup_result = (options) => new Promise((resolve, reject) => {
			// Preform rhyme lookup
			fetch(`http://rhymebrain.com/talk?function=getRhymes&word=${word}&maxResults=${results}`)
			.then((res) => {
				return res.json()
			})
			.then((json) => {
				resolve(json)
			})
			.catch((err) => {
				reject(err)
			})
		})

		try {
			let perfect = {
				header: "Perfect Rhymes",
				max: 0
			}
			let imperfect = {
				header: "Imperfect Rhymes",
				max: 0
			}
			for (let result of await lookup_result()) {
				const num_syll = parseInt(result.syllables)
				// Decide working set
				let result_set = result.score == PERFECT_SCORE ? perfect : imperfect
				// Check if new longest
				if (num_syll > result_set.max) {
					result_set.max = num_syll
				}
				// Check length exists
				if (! result_set[num_syll]) {
					result_set[num_syll] = []
				}
				// Add to result set
				result_set[num_syll].push(result.word)
			}
			let pages = []
			let options = [perfect, imperfect]
			// Create pages
			for (let set_i = 0; set_i < options.length; set_i++) {
				let new_pages = []
				let result_set = options[set_i]
				// Ensure there were matches
				if (result_set.max == 0) {
					continue
				}
				let match_count = 0
				let page = ""
				// Hit each length
				for (let syl = 0; syl < result_set.max; syl++) {
					// Check length was found for this word
					if (! result_set[syl]) {
						continue
					}
					match_count += result_set[syl].length
					page += result_set[syl].join(", ")
					if (page.length > 1024) {
						new_pages.push(page)
						page = ""
					}
					// Add newline if not done page
					if (syl != result_set.max && page != "") {
						page += "\n\n"
					}
				}
				// Push new pages
				for (let newpage of new_pages) {
					pages.push(block_text(`${match_count} ${result_set.header}:\n${newpage}`))
				}
				// Push last page if necessary
				if (page != "") {
					pages.push(block_text(`${match_count} ${result_set.header}:\n${page}`))
				}
			}

			return new MessageResponse(true, "", false, null, null, {
				pages: pages
			})
		} catch (err) {
			console.log(err)
			return new MessageResponse(false, "There was an error preforming the lookup", false)
		}
	}

	// Defines a word
	async define (word) {
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
		// Check if was a definition lookup 
		if (split_message[1] == "define" && split_message.length >= 3) {
			return this.define(split_message[2])
		}
		// check if was a rhyme lookup
		// if (split_message[1] == "rhyme" && split_message.length >= 3) {
		// 	return this.rhyme(split_message[2])
		// }
		return new MessageResponse(false, chat_help(), false)
	}

	// Handle a dm message
	handleDM (message, prefix, author, channel) {
		return handleText(message, prefix, [], author, channel)
	}
}

export { ChatTools }
