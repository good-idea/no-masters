# ✊🏿✊🏾✊🏽✊🏼✊🏻

## No Masters

The word "master" has become the most-used name for a default or "root" branch. Most of us in the mostly-white development world have not questioned this, until recently. Recently, [Github has begun discussions around moving away from this term](https://www.zdnet.com/article/github-to-replace-master-with-alternative-term-to-avoid-slavery-references/).

See also [this twitter thread](https://twitter.com/mislav/status/1270388510684598272) by [@mislav](https://twitter.com/mislav).

`no-masters` is a simple command line script that will rename your `master` branch to `main`, and optionally:

- Delete the local `master` branch
- Update the origin's default branch to `main`
- Delete the origin's `master` branch

## Usage

`npx no-masters`

### Caveats

- Your remote must be named `origin`
- Updating the origin only works with Github and requires [`gh`](https://cli.github.com/manual/installation) to be installed
- If you are using CI or some kind of deployment script, it probably defaults to using the `master` branch. You may need to update your scripts or other services to look for the `main` branch instead (See an example of a travis config [right here in this repo](./.travis.yml)).

### Thanks

Inspired in part by [@laferrerra](https://www.twitter.com/laferrerra), thank you to [@sanctucompu](https://www.twitter.com/sanctucompu) for bringing it to my attention.

https://www.instagram.com/p/CBn5KrMFEhA/?igshid=8sgzdo3eoba1

> hello and happy juneteenth. a friendly
> reminder that language matters and there's
> no better day to change your default branch
> from master to main.

### Contribute

Bugs, enhancements, suggestions?
Please contribute!

https://www.github.com/good-idea/no-masters/issues

### Get In Touch

joseph@good-idea.studio

https://www.good-idea.studio

https://www.twitter.com/typeof_goodidea
