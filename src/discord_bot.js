const winston = require("winston")
import Discord from "discord.js"
import discord_music from "discord.js-music-v11"

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
		// Checks for paginated messages
		this.paginated = {}
	}

	// Add music to discord bot
	addMusic (prefix) {
		discord_music(this.client, {
			prefix: prefix,
			global: false
		})
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
		// Handle reactions
		this.client.on("messageReactionAdd", (reaction, user) => {
			this.handle_reaction(reaction, user)
		})
		this.client.on("messageReactionRemove", (reaction, user) => {
			this.handle_reaction(reaction, user)
		})
		// Connect the system
		this.client.login(this.api_token).catch((e) => winston.error(e))
	}

	// A pagination skip
	handle_pagination (message, emoji) {
		if (! this.paginated[message.id]) {
			return
		}
		if (["\u2B05", "\u27A1"].includes(emoji.name)) {
			this.paginated[message.id].changePage(this.client, message.channel, emoji.name == "\u2B05" ? -1 : 1, message)
		}
	}


	// Hande a reaction
	async handle_reaction (reaction, user) {
		// Ignore if reaction from this user
		if (user.id == this.client.user.id) {
			return
		}
		// Check for pagination
		this.handle_pagination(reaction.message, reaction._emoji)
	}

	// Handles the specified message
	async handle_message (message) {
		// Ignore messages from this user
		if (message.author.id == this.client.user.id) {
			return
		}
		// Hit the message with each location
		for (const handler of this.handlers) {
			let handler_result = { result: false }
			// Check the type of channel the message came in on
			switch (message.channel.type) {
				// Check for text messages
				case "text": {
					if (handler.messageTypes.includes("text")) {
						let user_roles = []
						for (let [key, value] of message.member.roles) {
							user_roles.push(value.name)
						}
						handler_result = (await handler.handleText(message.content, settings.prefix, user_roles, message.author, message.channel))
					}
					break
				}
				// Check for dms
				case "dm": {
					console.log(message)
					if (handler.messageTypes.includes("dm")) {
						handler_result = (await handler.handleDM(message.content, settings.prefix, message.author, message.channel))
					}
					break
				}
			}
			// Check if the result was an array
			if (! (handler_result instanceof Array)) {
				handler_result = [ handler_result ]
			}
			for (let handler_i = 0; handler_i < handler_result.length; handler_i++) {
				let handler_message = handler_result[handler_i]
				// If we found a result we can reply
				if (handler_message.result) {
					const result = (await handler_message.sendMessage(this.client, message.channel))
					// If paginated we should store id
					if (handler_message.paginated) {
						this.paginated[result.id] = handler_message
					}
				}
			}
		}
	}
}


export { DiscordBot }
