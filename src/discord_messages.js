
const block_text = function (message) {
	return `\`\`\`\n${message}\n\`\`\``
}

const make_pages = function (text, max_lines) {
	let lines = []
	let previous_index = 0
	let current_found = 0

	let match, indexes = []
	const reg = /(?:\r\n|\r|\n)/gi
	// Search for occurances of line breaks
	while (match = reg.exec(text)) {
		current_found += 1
		// If we have completed a page
		if (current_found == max_lines) {
			lines.push(text.substr(previous_index, match.index))
			previous_index = match.index
			current_found = 0
		}
	}
	// Add trailing text
	if (Math.abs(previous_index - text.length) > 4) {
		lines.push(text.substr(previous_index, text.length))
	}
	return lines
}

export { block_text, make_pages }
