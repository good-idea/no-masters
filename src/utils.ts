import execa from 'execa'
import debug from 'debug'

/**
 * Logging
 */
debug.enable('no-masters:*')
export const log = debug('no-masters:log')
export const warn = debug('no-masters:warn')
export const stdout = debug('no-masters:stdout')

/**
 * End the process with a message
 */
export function end(message: string, warning?: boolean) {
	if (warning) {
		warn(`⚠️  ${message}`)
	} else {
		log(message)
	}
	process.exit()
}

/**
 * A simple wrapper for `execa` that optionally logs to stdout
 */
export async function exec(
	cmd: string,
	args: string[],
	log: boolean = true,
	suppressErrors: boolean = false,
) {
	try {
		if (log) stdout(`executing: ${cmd} ${args.join(' ')}`)
		const result = await execa(cmd, args, { shell: '/bin/sh' })
		if (log) stdout(result.stdout)

		return result
	} catch (err) {
		if (suppressErrors) {
			if (log) warn(err)
			return {
				stdout: '',
			}
		}
		throw err
	}
}

export const branchExists = async (branchName: string): Promise<boolean> => {
	const cmd = await execa('git', ['branch', '--list', branchName])
	const rgxp = new RegExp('^\\*?\\s+' + branchName + '$')
	const exists = rgxp.test(cmd.stdout)
	return exists
}

export const getLocalBranches = async (): Promise<string[]> => {
	const { stdout: gitBranches } = await execa('git', ['branch', '--list'])
	const branchNames = gitBranches
		.split('\n')
		.map((n) => n.replace(/^\*?\s+/, ''))
	return branchNames
}

export const getCurrentBranch = async (): Promise<string> => {
	const gitBranch = await execa('git', ['branch', '--show-current'])
	return gitBranch.stdout
}
