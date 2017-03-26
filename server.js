
// https://discordapp.com/oauth2/authorize?&client_id=<CLIENTID>&scope=bot&permissions=0
const winston = require("winston")

import db_mongo from './src/db_mongo'
import { settings } from "./src/helpers"
import { DiscordBot } from "./src/discord_bot"
import { PatternMatcher } from "./src/pattern_matcher"
import { RaffleManager } from "./src/raffler"
import { NetSecManager } from './src/netsec'
import { ChatTools } from "./src/chat_tools"

// Create a new bot
let bot = new DiscordBot(settings.api_token)

// Connect to mongo db
db_mongo.connect(settings.mongo.url, function(err) {

	// Create the direct responder
	let matcher = new PatternMatcher("pattern_reactor", "pm", settings.metagroups.users, settings.metagroups.power, settings.gods, false)
	// Assign the simple responder handler
	bot.addHandler(matcher)

	// Create the lottery handler
	let raffler = new RaffleManager("raffle", settings.metagroups.users, settings.metagroups.power, settings.gods, false)
	bot.addHandler(raffler)

	// Create security functions
	let securer = new NetSecManager("net")
	bot.addHandler(securer)

	// Create chat tools
	let tooler = new ChatTools("eng")
	bot.addHandler(tooler)

	// Start the bot
	bot.connect()
})

