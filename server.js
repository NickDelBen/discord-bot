
const winston = require("winston")

import db_mongo from './src/db_mongo'
import { settings } from "./src/helpers"
import { DiscordBot } from "./src/discord_bot"
import { PatternMatcher } from "./src/pattern_matcher"

// Create a new bot
let bot = new DiscordBot(settings.api_token)

// Connect to mongo db
db_mongo.connect(settings.mongo.url, function(err) {

	// Create the direct responder
	let matcher = new PatternMatcher("pattern_reactor", "pm", settings.metagroups.users, settings.metagroups.power, false)
	matcher.addMessage("ping", "pong")

	// Assign the simple responder handler
	bot.addHandler(matcher)

	// Start the bot
	bot.connect()
})

