const winston = require("winston")
import whois from "whois"
import dn from "dn"
import validate_ip from "validate-ip-node"

import { MessageResponse } from "./message_response"
import { arr_com } from "./helpers"
import { block_text, make_pages } from "./discord_messages"

const NET_MAX_LINE_LENGTH = 20

const net_help = function () {
	return block_text(
`Collection of network tools
    net shodan <ip>     [DM/channel] Preform a shodan search on the specified ip
    net dig <address>   [DM/channel] Preform a dig lookup for the specified address
    net whois <address> [DM/channel] Preform a whois lookup on the specified address`)
}

class NetSecManager {
	// Creates a new netsec manager
	constructor (sec_prefix) {
		this.sec_prefix = sec_prefix
	}

	// Returns the types of messages the bot can handle
	get messageTypes () {
		return ["text", "dm"]
	}

	// Preforms a shodan lookup of the specified up
	shodanLookup (address) {
		// Ensure a valid ip address was specified
		if (! validate_ip(address)){
			return new MessageResponse(true, `\`${address}\` is not a valid ipv4 or ipv6 address`, false)
		}
		return new MessageResponse(true, `https://shodan.io/host/${address}`, false)
	}

	// Preform a whois lookup
	async whoisLookup (address) {
		let result = null
		// Create a promise for the result of the lookup
		const lookup_result = (options) => new Promise((resolve, reject) => {
			// Preform the lookup
			whois.lookup(address, {timeout: 3000}, (err, data) => {
				// If there was an error return error
				if (err) {
					reject(err)
				}
				resolve(data)
			})
		})

		try {
			// Preform the lookup
			const dat = await lookup_result()
			let page_item = {
				pages: []
			}
			let page_content = []
			for (let pagetext of make_pages(dat, NET_MAX_LINE_LENGTH)) {
				page_item.pages.push(block_text(pagetext))
			}
			return new MessageResponse(true, "", false, null, null, page_item)
		} catch (err) {
			return new MessageResponse(true, `There was no response from \`${address}\``, false)
		}
	}

	// Preforma  dig
	async digLookup (address) {
		let result = null
		// Create a promise for the result of the lookup
		const lookup_result = (options) => new Promise((resolve, reject) => {
			// Preform the lookup
			dn.soa(address, (err, data) => {
				// If there was an error return error
				if (err) {
					reject(err)
				}
				resolve(data)
			})
		})

		try {
			// Preform the lookup
			const result = await lookup_result()
			let dat = ""
			for (let key in result) {
				dat += `${key}: ${result[key]}\n`
			}
			dat = dat.substr(0, dat.length - 1)
			let page_item = {
				pages: []
			}
			let page_content = []
			for (let pagetext of make_pages(dat, NET_MAX_LINE_LENGTH)) {
				page_item.pages.push(block_text(pagetext))
			}
			return new MessageResponse(true, "", false, null, null, page_item)
		} catch (err) {
			return new MessageResponse(false, "Error preforming whois lookup", false)
		}
	}

	// Handles a text message
	handleText (message, prefix, roles, author, channel) {
		// If it is not a valid command ignore
		if (!(message.startsWith(`${prefix}${this.sec_prefix}`))) {
			return new MessageResponse(false, "Unrelated", false)		
		}
		// Split the message like command line args
		const split_message = message.match(/(".*?"|[^\s]+)+(?=\s*|\s*$)/g)
		// Check if this is a blank or help command
		if (split_message.length == 1 || split_message[1] == "help") {
			return new MessageResponse(true, net_help(), false)
		}
		// Check if was a whois lookup 
		if (split_message[1] == "whois" && split_message.length >= 3) {
			return this.whoisLookup(split_message[2])
		}
		// Check for a dig lookup
		if (split_message[1] == "dig" && split_message.length >= 3) {
			return this.digLookup(split_message[2])
		}
		// Check for a shodan lookup
		if (split_message[1] == "shodan" && split_message.length >= 3) {
			return this.shodanLookup(split_message[2])
		}
		return new MessageResponse(true, net_help(), false)
	}

	// Handle a dm message
	handleDM (message, prefix, author, channel) {
		return handleText(message, prefix, [], author, channel)
	}


}

export { NetSecManager }