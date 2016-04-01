
# HubTurbot :speech_balloon:

I am a fork of [mention-bot](https://github.com/facebook/mention-bot). My purpose is to ~~pass butter~~ help run open source projects.

I can do many clever things:

- Notify a reviewer when a PR is ready for review
- Respond to comments by toggling PR status labels
- Create status labels automatically
- Automatically identify potential reviewers for new PRs (see [mention-bot's documentation](https://github.com/facebook/mention-bot))
- Make inappropriate jokes

## Things I know how to do

**Notify a reviewer when a PR is ready for review**

When a `toReview` label is applied, I'll comment on the PR, mentioning a reviewer, or someone who will assign a reviewer.

**Respond to comments by toggling PR status labels**

When a comment with the phrase "ready for review" is made, I'll toggle the status label to `toReview`.

**Create status labels automatically**

When a comment with the phrase "@HubTurbot create all labels please" is made, I'll create all the necessary status labels.

## How to get in touch

- Go to
 - your project on GitHub > Settings > Webhooks & services > Add Webhook or
 - your organization on GitHub > Settings > Webhooks > Add Webhook
- Payload URL: `https://hubturbot.herokuapp.com/`
- Check `Everything`
- Add Webhook
- Optionally, add [**@HubTurbot**](https://github.com/HubTurbot) as a collaborator to your project (for more features, like changing issue labels)

## License

I am [BSD-licensed](https://github.com/HubTurbot/HubTurbot/blob/master/LICENSE), like mention-bot.
