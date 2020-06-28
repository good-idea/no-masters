import commandExists from 'command-exists'

async function main() {
	const gh = await commandExists('gh').catch(() => {
		console.error(
			'⚠️  You don\'t have `gh` installed. Install it before running this script, i.e. "brew install gh". See: https://cli.github.com/manual/installation',
		)
		process.exit()
	})

	console.log(typeof gh)
}

main()
