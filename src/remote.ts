import inquirer from 'inquirer'
import execa from 'execa'
import commandExists from 'command-exists'
import { end, log, exec } from './utils'

/* Make sure `gh` is installed */
async function confirmGH() {
	await commandExists('gh').catch(() => {
		end(
			'You don\'t have `gh` installed. Install it before running this script, i.e. "brew install gh". See: https://cli.github.com/manual/installation',
			true,
		)
	})
}

async function getRemoteInfo() {
	await confirmGH()
	const { stdout } = await exec('gh', ['api', 'repos/:owner/:repo'], false)
	return JSON.parse(stdout)
}

export async function hasRemote(name: string): Promise<boolean> {
	const { stdout: remotes } = await exec('git', ['remote', '-v'], false)
	const remoteNames = remotes
		.split('\n')
		.map((s) => s.replace(/^(\w+)(.*)$/, '$1'))

	return remoteNames.includes(name)
}

export async function getRemoteBranchNames(): Promise<string[]> {
	await confirmGH()
	try {
		const remoteBranches = await execa('gh', [
			'api',
			'repos/:owner/:repo/branches',
		])
		const branches = JSON.parse(remoteBranches.stdout).map((b: any) => b.name)
		return branches
	} catch (err) {
		if (err.message.includes('no git remotes found')) return []
		throw err
	}
}

async function deleteRemoteMaster() {
	await confirmGH()

	const masterBranchInfo = await exec(
		'gh',
		['api', 'repos/:owner/:repo/branches/master'],
		false,
	).then((r) => JSON.parse(r.stdout))

	if (masterBranchInfo.protected === true) {
		end(
			'This branch is protected. Remove the protection settings to continue, or delete your branch manually.',
		)
	}

	await exec(
		'gh',
		['api', '-X', 'DELETE', 'repos/:owner/:repo/git/refs/heads/master'],
		false,
	)
}

export async function updateRemoteDefault() {
	await confirmGH()
	const branches = await getRemoteBranchNames()
	const includesMain = branches.includes('main')
	const includesMaster = branches.includes('master')
	if (!includesMain) {
		end('You have not pushed your main branch to the origin.', true)
	}
	log('Updating the default branch to "main"')
	await exec(
		'gh',
		['api', '-X', 'PATCH', 'repos/:owner/:repo', '-F', 'default_branch=main'],
		false,
	)
	if (includesMaster) {
		const { confirmDelete } = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'confirmDelete',
				message:
					'Do you want to delete your origin master branch?\nThis is potentially dangerous!\nIf you have automatic CI or deployments set up, you should handle deleting your master branch manually.',
			},
		])

		if (confirmDelete) {
			const { name: repoName } = await getRemoteInfo()

			const { confirmName } = await inquirer.prompt([
				{
					type: 'input',
					name: 'confirmName',
					message: `Enter the name of your repo '${repoName}' to continue`,
				},
			])
			if (confirmName === repoName) {
				await deleteRemoteMaster()
			} else {
				end('Error, you did not enter the correct repo name')
			}
		}
	}
}
