
class MessageResponse {
	// Create a bew resposne message
	constructor (result, response, terminate, type, target, paginated) {
		this.result = result
		this.response = response
		this.terminate = terminate
		this.type = type
		this.target = target
		this.paginated = paginated
	}

	// Handles a paginated message
	changePage (client, channel, change, message) {
		// Calculate index of new page
		let new_page = (this.paginated.page + change)
		// Find the true new page with rapping
		new_page = ((new_page % this.paginated.pages.length) + this.paginated.pages.length) % this.paginated.pages.length
		this.response = `${this.paginated.pages[new_page]}\`Page ${new_page+1} of ${this.paginated.pages.length}\``
		this.paginated.page = new_page
		// Change the page
		message.edit(this.response)
	}

	// Send a respone message
	async sendMessage (client, channel) {
		// If no type use chanel type
		if ((! this.type) && channel) {
			this.type = channel.type
		}
		// Check for a paginated response
		if (this.paginated) {
			this.paginated.page = 0
			// Do not paginate if only 1 page
			if (this.paginated.pages.length == 1) {
				this.response = this.paginated.pages[0]
				this.paginated = false
				return this.sendMessage(client, channel)
			}
			let response = (await channel.sendMessage("Paged Message"))
			await response.react("\u2B05")
			await response.react("\u27A1")
			this.changePage(client, channel, 0, response)
			return response
		}
		switch (this.type) {
			// Send dm message directly to user
			case "dm": {
				// If a target is specified send to the target user
				if (this.target) {
					const target_user = await client.fetchUser(this.target)
					return target_user.sendMessage(this.response)
				}
				// If no target but a channel send over specified channel
				if (channel) {
					return channel.sendMessage(this.response)
				}
				break
			} 
			// Send message to a channel
			case "text": {
				// If a target is specified send to target channel
				if (this.target) {
					return (await client.channels.get(this.target)).sendMessage(this.response)
				}
				// If no target but a channel send over specified channel
				if (channel) {
					return channel.sendMessage(this.response)
				}
				break
			}
			// Error
			default: {
				return null
			}
		}
	}
}

export { MessageResponse }
