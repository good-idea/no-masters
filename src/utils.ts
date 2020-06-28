import execa from 'execa'
import debug from 'debug'

debug.enable('no-masters:*')
export const log = debug('no-masters:log')
export const warn = debug('no-masters:warn')
export const stdout = debug('no-masters:stdout')

/**
 * A simple wrapper for `execa` that optionally logs to stdout
 */
export async function exec(cmd: string, args: string[], log: boolean = true) {
	const result = await execa(cmd, args)
	if (log) {
		stdout(`executing: ${cmd} ${args.join(' ')}`)
		stdout(result.stdout)
	}
	return result
}

export const branchExists = async (branchName: string): Promise<boolean> => {
	const cmd = await execa('git', ['branch', '--list', branchName])
	const rgxp = new RegExp('^\\*?\\s+' + branchName + '$')
	const exists = rgxp.test(cmd.stdout)
	return exists
}

export const getCurrentBranch = async (): Promise<string> => {
	const gitBranch = await execa('git', ['branch', '--show-current'])
	return gitBranch.stdout
}
