
# HubTurbot :speech_balloon:

I am a fork of [mention-bot](https://github.com/facebook/mention-bot). My purpose is to ~~pass butter~~ help run open source projects.

I can do many clever things:

- Notify a reviewer when a PR is ready for review (by inspecting status labels)
- Respond to comments by toggling PR status labels
- Automatically identify potential reviewers for new PRs (see [mention-bot's documentation](https://github.com/facebook/mention-bot))
- Make inappropriate jokes

## Usage

- Go to
 - your project on GitHub > Settings > Webhooks & services > Add Webhook or
 - your organization on GitHub > Settings > Webhooks > Add Webhook
- Payload URL: `https://hubturbot.herokuapp.com/`
- Check `Everything`
- Add [**@HubTurbot**](https://github.com/HubTurbot) as a collaborator to your project (for more features, like changing issue labels)
- Add Webhook

## License

I am [BSD-licensed](https://github.com/facebook/mention-bot/blob/master/LICENSE), like mention-bot.
