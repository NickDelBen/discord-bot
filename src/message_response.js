
class MessageResponse {
	// Create a bew resposne message
	constructor (result, response, terminate, type, target) {
		this.result = result
		this.response = response
		this.terminate = terminate
		this.type = type
		this.target = target
	}

	// Send a respone message
	async sendMessage (client, channel) {
		// If no type use chanel type
		if ((! this.type) && channel) {
			this.type = channel.type
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
