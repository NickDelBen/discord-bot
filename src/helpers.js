
// Read the settings
let temp_settings = require('../config/config.bot.json')
if (temp_settings.extra_settings.use) {
	temp_settings = Object.assign(temp_settings, require(temp_settings.extra_settings.location))
}
const settings = temp_settings

// Niave sequence comparer.
// TODO: Replace with KMP sequence-matcher
const arr_com = function (a1, a2) {
	for (const i1 in a1) {
		for (const i2 in a2) {
			if (i1 == i2) {
				return true
			}
		}
	}
	return false
}

export { settings, arr_com }
