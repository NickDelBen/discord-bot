
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
   	raffle rm               [DM/channel] Remove any raffle you have created
`)
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

class Raffler {
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

	// Start the specified raffle

}

export { Raffler }