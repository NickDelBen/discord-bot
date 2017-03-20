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
	addHandler (handler, type) {
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
		// Ignore messages from this user
		if (message.author.id == this.client.user.id) {
			return
		}
		// Build list fo roles for this user
		let user_roles = []
		// Add to the roles if the message type was channel-based
		if (message.channel.type == "text") {
			for (let [key, value] of message.member.roles) {
				user_roles.push(value.name)
			}
		}
		// Hit the message with each location
		for (const handler of this.handlers) {
			let handler_result = { result: false }
			// Check the type of channel the message came in on
			switch (message.channel.type) {
				// Check for text messages
				case "text": {
					if (handler.messageTypes.includes("text")) {
						handler_result = (await handler.handleText(message.content, settings.prefix, user_roles, message.author.id))
					}
					break
				}
				// Check for dms
				case "dm": {
					if (handler.messageTypes.includes("dm")) {
						handler_result = (await handler.handleDM(message.content, settings.prefix, message.author.id))
					}
					break
				}
			}
			// Check if the result was an array
			if (! (handler_result instanceof Array)) {
				handler_result = [ handler_result ]
			}
			for (const handler_message of handler_result) {
				// If we found a result we can reply
				if (handler_message.result) {
					return handler_message.sendMessage(this.client, message.channel)
				}
			}
		}
	}
}


export { DiscordBot }
