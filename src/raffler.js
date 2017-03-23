
import { MessageResponse } from "./message_response"
import { arr_com } from "./helpers"
import { block_text } from "./discord_messages"

const raffle_help = function () {
	return block_text(
`Allows for creating lotteries and raffles
    raffle help             [DM/channel] Displays this help text
    raffle enter            [channel]    Enters the onging raffle in this channel
    raffle info             [channel]    Displays info about ongoing raffle
    raffle create <reward>  [DM/channel] Creates a new raffle with the specified reward text
    raffle start            [channel]    Runs the raffle you have created (draws immediatly)
    raffle end              [DM/channel] Ends your currently running raffle
    raffle rm               [DM/channel] Remove any raffle you have created`)
}

class RaffleItem {
	// Creates a new raffle item
	constructor (raffler, reward) {
		this.raffler = raffler
		this.reward = reward
		this.channel = null
		this.entries = {}
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

	// Creates a new raffle
	addRaffle (raffler, reward, channel) {
		// Check if this user already has a raffle
		if (this.items[raffler.id]) {
			return [
				new MessageResponse(true, block_text("You have already created a raffle. Check your dm"), false, "text", channel.id),
				new MessageResponse(true, block_text("You already have created a raffle. You can\n    `raffle start` to begin your raffle\n    `raffle rm` to remove your raffle"), false, "dm", raffler)
			]
		}
		// Create a new raffle for this user
		this.items[raffler.id] = new RaffleItem(raffler, reward)
		return new MessageResponse(true, block_text(`You have created a raffle! \nTo start raffle type \`raffle start\` in the channel you wish to have the raffle in`), false)
	}

	// Removes a raffle
	removeRaffle (raffler, channel) {
		// Check that the user has a raffle
		if (! this.items[raffler.id]) {
			return new MessageResponse(true, "You have not created a raffle", false)
		}
		// Check if the raffle has already started
		if (this.items[raffler.id].channel) {
			return new MessageResponse(true, "It's too late to apologise; the die is cast. You can end your raffle with `raffle end`", false)
		}
		// Remove the raffle
		delete this.items[raffler.id]
		// Notify user the raffle was removed
		return new MessageResponse(true, "Your raffle has been removed", false)
	}

	// Enter the raffle in this channel
	enter (enterer, channel) {
		// Check if this channel has a raffle
		if (! this.current_draws[channel.id]) {
			return new MessageResponse(true, block_text(`There is no active raffle on this channel. More info '${this.raffle_prefix} help'`), false)
		}
		// Check if the user is hosting the raffle
		if (this.current_draws[channel.id] == enterer.id) {
			return new MessageResponse(true, block_text('You can not enter your own raffle'), false)
		}
		// Check if the user has already entered the raffle
		if (this.items[this.current_draws[channel.id]].entries[enterer.id]) {
			return new MessageResponse(true, block_text("You have already entered this raffle"), false, "dm", enterer)
		}
		// Add this user to the raffle
		this.items[this.current_draws[channel.id]].entries[enterer.id] = enterer
		return [
			new MessageResponse(true, `@${enterer.username} has entered the raffle. The raffle now has ${Object.keys(this.items[this.current_draws[channel.id]].entries).length} entries`, false, "text", channel),
			new MessageResponse(true, "You have been entered to win a lottery. Good Luck!", false, "dm", enterer.id)

		]
	}

	// End the active raffle
	end (raffler, channel) {
		// Check if there is a raffle this user can end
		if (!(this.current_draws[channel.id]) || (this.current_draws[channel.id] != raffler.id)) {
			return new MessageResponse(true, block_text("You do not ahve a raffle that you can end."), true)
		}
		// Select winner
		let raffle_item = this.items[this.current_draws[channel.id]]
		const winner_options = Object.keys(raffle_item.entries)
		const raffle_winner = this.items[winner_options[Math.floor(Math.random() * winner_options.length)]]
		return [
			new MessageResponse(true, `The raffle has ended and @${raffle_winner.username} is the winner!`, false, "text", raffle_item.channel.id),
			new MessageResponse(true, `Your raffle has ended and @${raffle_winner.username}  has won.\bThey have been messasged the win text.`, false, "dm", raffler.id),
			new MessageResponse(true, `You have won a raffle. The host of the raffle says:\n${raffle_item.reward}\nCongratulations!`, false, "dm", raffle_winner.id)
		]
	}

	// Get the infor about a raffle
	getInfo (channel) {
		// Check if this channel has a raffle
		if (! this.current_draws[channel.id]) {
			return new MessageResponse(true, block_text(`There is no active raffle on this channel. More info '${this.raffle_prefix} help'`), false)
		}
		return new MessageResponse(true, block_text(`There is an active raffle!\nQuickly enter with '${this.raffle_prefix} enter'`), false)
	}

	// Start the current raffle
	start (raffler, channel) {
		// Check that the user has a raffle
		if (! this.items[raffler.id]) {
			return new MessageResponse(true, "You have not created a raffle", false)
		}
		// Check if the raffle has already started
		if (this.items[raffler.id].channel) {
			return new MessageResponse(true, "You have already started a raffle. You can end your raffle with `raffle end`", false)
		}
		// Modify the raffle in the storage
		this.items[raffler].channel = channel.id
		// Add to the ongoing list
		this.current_draws[channel.id] = raffler.id
		return [
			new MessageResponse(true, block_text("A raffle has been started!\nThe raffle can be ended by it's creator with 'raffle end'\n\nQuickly Enter it with 'raffle enter'"), false),
			new MessageResponse(true, block_text("You have started a raffle\nYou can end your raffle by typing `raffle end`"), false, "dm", raffler)
		]
	}

	// Handles a text message
	handleText (message, prefix, roles, author, channel) {
		// If it is not a valid command ignore
		if (!(message.startsWith(`${prefix}${this.raffle_prefix}`))) {
			return new MessageResponse(false, "Unrelated", false)		
		}
		// Split the message like command line args
		const split_message = message.match(/(".*?"|[^\s]+)+(?=\s*|\s*$)/g)
		// Check if this is a blank or help command
		if (split_message.length == 1 || split_message[1] == "help") {
			return new MessageResponse(true, raffle_help(), false)
		}
		// Handle if it is a create request
		if (split_message[1] == "create" && split_message.length >= 3) {
			return this.addRaffle(author, split_message[2], channel)
		}
		// Handle if it is a remove request
		if (split_message[1] == "rm") {
			return this.removeRaffle(author, channel)
		}
		// Handle a user ending the raffle
		if (split_message[1] == "end") {
			return this.end(author, channel)
		}
		// Handle a user entering the raffle
		if (split_message[1] == "enter") {
			return this.enter(author, channel)
		}
		// Handle a request for informationa about the current raffle
		if (split_message[1] == "info") {
			return this.getInfo(channel)
		}
		// Handle a user starting their raffle
		if (split_message[1] == "start") {
			return this.start(author, channel)
		}
		// Reached command error
		return new MessageResponse(true, raffle_help(), false)
	}

	// Handles a dm message
	handleDM (message, prefix, author_id, channel_id) {
		// If it is not a valid command ignore
		if (!(message.startsWith(`${prefix}${this.raffle_prefix}`))) {
			return new MessageResponse(false, "Unrelated", false)		
		}
		// Split the message like command line args
		const split_message = message.match(/(".*?"|[^\s]+)+(?=\s*|\s*$)/g)
		// Check if this is a blank or help command
		if (split_message.length == 1 || split_message[1] == "help") {
			return new MessageResponse(true, raffle_help(), false)
		}
				// Handle if it is a create request
		if (split_message[1] == "create" && split_message.length >= 3) {
			return this.addRaffle(author, split_message[2], channel)
		}
		// Handle if it is a remove request
		if (split_message[1] == "rm") {
			return this.removeRaffle(author, channel)
		}
		// Handle a user ending the raffle
		if (split_message[1] == "end") {
			return this.end(author, channel)
		}
		// Reached command error
		return new MessageResponse(true, raffle_help(), false)
	}

}

export { RaffleManager }