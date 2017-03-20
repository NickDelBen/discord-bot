const winston = require("winston")
import Discord from "discord.js"

import { settings } from "./helpers"

class DiscordBot {
	// Create a new discord bot
	constructor (api_token) {
		// Create a client
		this.client = new Discord.Client()
		// Handle messages from client
		this.client.on("debug", (m) => winston.debug(m))
		this.client.on("warn", (m) => winston.warn(m))
		// Store the specified token
		this.api_token = api_token
		// Default there are no commands added
		this.handlers = []
	}

	// Add the specified commands to the command set
	addHandler (handler) {
		this.handlers.push(handler)
	}

	// Connects the bot
	connect () {
		// Handle the messages with the built in message handler
		this.client.on("message", (m) => {
			this.handle_message(m)
		})
		// Connect the system
		this.client.login(this.api_token).catch((e) => winston.error(e))
	}

	// Handles the specified message
	async handle_message (message) {
		// Build list fo roles for this user
		let user_roles = []
		for (let [key, value] of message.member.roles) {
			user_roles.push(value.name)
		}
		// Ignore messages from this user
		if (message.author.id == this.client.user.id) {
			return
		}
		// Hit the message with each location
		for (const handler of this.handlers) {
			const handler_result = (await handler.handleMessage(message.content, settings.prefix, user_roles))
			// If we found a result we can reply
			if (handler_result.result) {
				return message.channel.sendMessage(handler_result.response)
			}
		}
	}
}


export { DiscordBot }
