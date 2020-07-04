#!/usr/bin/env node
import inquirer from 'inquirer'
import { end, log, exec, getCurrentBranch, branchExists } from './utils'
import { updateRemoteDefault } from './remote'
import { successMessage } from './successMessage'

async function main() {
	/* Check for unstaged changes */
	const { stdout: gitStatus } = await exec('git', ['status', '-s'], false)
	if (gitStatus.length > 0) {
		end(
			'You have unsaved changes in this repo. Commit these changes before continuing.',
			true,
		)
	}

	const masterExists = await branchExists('master')
	if (masterExists === false) {
		const { nextStep } = await inquirer.prompt({
			type: 'list',
			name: 'nextStep',
			message:
				'You do not have a master branch in your local repository. Please select an option:',
			choices: [
				{
					name: 'Pull the master from remote and continue (safest)',
					value: 'pullMaster',
					short: 'pullFromMaster',
				},
				{
					name:
						'Update your remote repository\'s default branch to "main"\n  (do this only if you have already created a "main" branch and pushed it to origin)',
					short: 'updateRemote',
					value: 'updateRemote',
				},
				{
					name: 'Exit',
					value: 'exit',
					short: 'exit',
				},
			],
		})
		if (nextStep === 'exit') {
			successMessage()
		} else if (nextStep === 'updateRemote') {
			await updateRemoteDefault()
			successMessage()
		} else if (nextStep === 'pullMaster') {
			await exec('git', ['checkout', '-b', 'master', 'origin/master'])
		}
	}

	/* Make sure we are on the master branch */
	let currentBranch = await getCurrentBranch()

	if (currentBranch !== 'master') {
		log('Switching to the master branch')
		await exec('git', ['checkout', 'master'], false)
	}

	/* Do a pull & push to make sure we are in sync with the remote */
	log('Pulling latest changes from remote..')
	await exec('git', ['pull', 'origin', 'master'])
	log('Successfully pulled changes.')
	log('Pushing local changes to remote..')
	await exec('git', ['push'])
	log('Successfully pushed changes.')

	/* Check to see if there is a 'main' branch */
	const mainExists = await branchExists('main')
	if (mainExists) {
		/* Check out to the main branch */
		log('Switching to the main branch')
		await exec('git', ['checkout', 'main'], false)
		const gitBranchMergedMain = await exec(
			'git',
			['branch', '--merged', 'main'],
			false,
		)
		const masterIsMerged = /master/.test(gitBranchMergedMain.stdout)
		if (!masterIsMerged) {
			const { confirmMasterMerge } = await inquirer.prompt([
				{
					type: 'confirm',
					name: 'confirmMasterMerge',
					message:
						'Your master branch has not been merged into main. Confirm to merge, or cancel to exit.',
				},
			])
			if (confirmMasterMerge === false) end('Exiting')
			/* Merge in master to main */
			log('Merging the master branch into main..')
			await exec('git', ['merge', 'master'])
		}
	} else {
		/* Create the new local branch */

		log('Creating new "main" branch..')
		await exec('git', ['checkout', '-b', 'main'])
	}

	/* Set the upstream */
	log('Setting the upstream..')
	await exec('git', ['push', '-u', 'origin', 'main'])
	/* Update the tracking branch */
	log('Updating the tracking branch..')
	await exec('git', ['branch', '-u', 'origin/main', 'main'])

	const { deleteMaster } = await inquirer.prompt({
		type: 'confirm',
		name: 'deleteMaster',
		message:
			'Success! You now have an up to date "main" branch. Would you like to delete your local master branch?',
	})
	/* End here if they do not want to delete the master branch */
	if (deleteMaster === true) {
		log('Deleting the local master branch..')
		await exec('git', ['branch', '-d', 'master'])
		log('Successfully deleted the local master branch.')
	}

	const { updateRemote } = await inquirer.prompt({
		type: 'confirm',
		name: 'updateRemote',
		message: 'Do you want to update your remote\'s default branch to "main"?',
	})

	if (updateRemote === true) {
		await updateRemoteDefault()
	}
	successMessage()
}

main()
