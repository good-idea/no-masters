import { end } from './utils'

export function successMessage() {
	end(`
     ✊🏿✊🏾✊🏽✊🏼✊🏻

    ------------
     No Masters
    ------------

    Success! You have removed your \`master\` branch in favor of \`main\`.

    Next steps:

    [] Donate to a bail fund
    [] Prompt discussions about equality and race in your workplace
    [] Vote

    -------------

    Please share!

    \`npx no-masters\`

    -------------

    Bugs, enhancements, suggestions?
    Please contribute!

    https://www.github.com/good-idea/no-masters

    -------------

    Get in touch!

    joseph@good-idea.studio
    https://www.twitter.com/typeof_goodidea
`)
}
