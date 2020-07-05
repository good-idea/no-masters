#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import inquirer from 'inquirer'
import {
	end,
	log,
	exec,
	getLocalBranches,
	getCurrentBranch,
	branchExists,
} from './utils'
import { hasRemote, getRemoteBranchNames, updateRemoteDefault } from './remote'
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
			const branches = await getRemoteBranchNames()
			if (branches.includes('master')) {
				await exec('git', ['checkout', '-b', 'master', 'origin/master'])
			} else {
				log('Your remote does not have a master branch. Skipping..')
			}
		}
	}

	/* Make sure we are on the master branch */
	let currentBranch = await getCurrentBranch()
	const branchNames = await getLocalBranches()
	const localHasMaster = branchNames.includes('master')
	const hasRemoteOrigin = await hasRemote('origin')
	const remoteBranchNames = await getRemoteBranchNames()
	const remoteHasMaster = remoteBranchNames.includes('master')

	if (localHasMaster) {
		if (currentBranch !== 'master') {
			log('Switching to the master branch')
			await exec('git', ['checkout', 'master'], false)
		}

		if (hasRemoteOrigin && remoteHasMaster) {
			/* Do a pull & push to make sure we are in sync with the remote */
			log('Pulling latest changes from remote..')
			await exec('git', ['pull', 'origin', 'master'])
			log('Successfully pulled changes.')
			log('Pushing local changes to remote..')
			await exec('git', ['push'])
			log('Successfully pushed changes.')
		}
	}

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
		if (localHasMaster && !masterIsMerged) {
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

	if (hasRemoteOrigin) {
		/* Set the upstream */
		log('Setting the upstream..')
		await exec('git', ['push', '-u', 'origin', 'main'])
		/* Update the tracking branch */
		log('Updating the tracking branch..')
		await exec('git', ['branch', '-u', 'origin/main', 'main'])
	}
	log('Success! You now have an up to date "main" branch.')

	if (localHasMaster) {
		const { deleteMaster } = await inquirer.prompt({
			type: 'confirm',
			name: 'deleteMaster',
			message: 'Would you like to delete your local master branch?',
		})
		/* End here if they do not want to delete the master branch */
		if (deleteMaster === true) {
			log('Deleting the local master branch..')
			await exec('git', ['branch', '-d', 'master'])
			log('Successfully deleted the local master branch.')
		}
	}

	if (hasRemoteOrigin) {
		const { updateRemote } = await inquirer.prompt({
			type: 'confirm',
			name: 'updateRemote',
			message: 'Do you want to update your remote\'s default branch to "main"?',
		})

		if (updateRemote === true) {
			await updateRemoteDefault()
		}
	}

	/* Prompt to update the user's default configuration */
	const { updateInitDefault } = await inquirer.prompt({
		type: 'confirm',
		name: 'updateInitDefault',
		message:
			'Would you like to change the name of the default branch when you run `git init`? (This will create a hidden directory in your user folder named ".git_template")',
	})

	if (updateInitDefault) {
		const { stdout: existingTemplateDir } = await exec(
			'git',
			['config', '--get', 'init.templateDir'],
			false,
			true,
		)
		if (existingTemplateDir) {
			const headLocation = path.resolve(existingTemplateDir, 'HEAD')
			const headExists = fs.existsSync(headLocation)

			if (headExists) {
				const contents = fs.readFileSync(headLocation, 'utf-8')
				const newContents = contents.replace(
					/^ref:.*$/gm,
					'ref: ref/heads/main',
				)
				fs.writeFileSync(headLocation, newContents)
			} else {
				await exec('echo', ['"ref: refs/heads/main"', '>>', headLocation])
			}
		} else {
			const { stdout: HOME } = await exec('echo', ['"$HOME"'], false)
			const templateDir = path.resolve(HOME, '.git_template/template')
			log('Creating template..')
			await exec('mkdir', ['-p', templateDir])
			await exec('cp', [
				'-r',
				path.resolve(__dirname, '../git-template/*'),
				templateDir,
			])
			await exec('git', ['config', '--global', 'init.templateDir', templateDir])
		}
		log(
			'Success! Now when you create new repositories, the default branch will be "main"',
		)
	}

	successMessage()
}

main()
