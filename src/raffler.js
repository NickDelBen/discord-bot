
import { MessageResponse } from "./message_response"
import { arr_com } from "./helpers"
import { block_text } from "./discord_messages"

const raffle_help = function () {
	return block_text(
`Raffle module by MartianProblems
Allows for creating lotteries and raffles
    raffle help             [DM/channel] Displays this help text
    raffle enter            [channel]    Enters the onging raffle in this channel
    raffle info             [channel]    Displays info about ongoing raffle
    raffle create <reward>  [DM/channel] Creates a new raffle with the specified reward text
    raffle start            [channel]    Runs the raffle you have created (draws immediatly)
    raffle rm               [DM/channel] Remove any raffle you have created`)
}

class RaffleItem {
	// Creates a new raffle item
	constructor (raffler, reward) {
		this.raffler = raffler
		this.reward = reward
		this.channel = null
		this.duration = 0
		this.entries = []
	}
}

class RaffleManager {
	// Create a new responder from the specified colelction
	constructor (raffle_prefix, raffle_for, enter_for, gods, show_errors) {
		this.raffle_prefix = raffle_prefix
		this.rafflers = raffle_for
		this.enterers = enter_for
		this.gods = gods
		this.errors = show_errors

		// The user whos raffle is currently ongoing by channel
		this.current_draws = {}
		// Each raffler will have a current item
		this.items = {}
	}

	// Returns the types of messages the bot can handle
	get messageTypes () {
		return ["text", "dm"]
	}

	// Handles a text message
	handleText (message, prefix, roles, author_id) {
		// If it is not a valid command ignore
		if (!(message.startsWith(`${prefix} ${this.raffle_prefix}`))) {
			return new MessageResponse(false, "Unrelated", false)		
		}
		// Split the message like command line args
		const split_message = message.match(/(".*?"|[^\s]+)+(?=\s*|\s*$)/g)
		// Check if this is a blank or help command
		if (split_message.length == 2 || split_message[2] == "help") {
			return new MessageResponse(true, raffle_help(), false)
		}


		// Reached command error
		return new MessageResponse(this.errors, `Command \"${prefix} ${this.raffle_prefix} ${split_message[2]}\" with ${split_message.length-3} parameters not found`, false)
	}

	// Handles a dm message
	handleDM (message, prefix, author_id) {
		// If it is not a valid command ignore
		if (!(message.startsWith(`${prefix} ${this.raffle_prefix}`))) {
			return new MessageResponse(false, "Unrelated", false)		
		}
		// Split the message like command line args
		const split_message = message.match(/(".*?"|[^\s]+)+(?=\s*|\s*$)/g)
		// Check if this is a blank or help command
		if (split_message.length == 2 || split_message[2] == "help") {
			return new MessageResponse(true, raffle_help(), false)
		}

		// Reached command error
		return new MessageResponse(this.errors, `Command \"${prefix} ${this.raffle_prefix} ${split_message[2]}\" with ${split_message.length-3} parameters not found`, false)
	}

}

export { RaffleManager }