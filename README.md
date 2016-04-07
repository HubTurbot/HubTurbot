
# HubTurbot :speech_balloon: ![](https://travis-ci.org/HubTurbot/HubTurbot.svg)

I am a fork of [mention-bot](https://github.com/facebook/mention-bot). My purpose is to ~~pass butter~~ help run open source projects.

I can do many clever things:

- Respond to comments by toggling PR status labels

## Things I know how to do

**Respond to comments by toggling PR status labels**

When a comment is made mentioning me and containing a label name, I'll toggle the corresponding label.

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
