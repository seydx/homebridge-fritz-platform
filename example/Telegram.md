# Telegram - First steps

## Create Bot and obtain token

- Talk to BotFather, grap your phone where telegram is installed and goto @BotFather in Telegram or goto: https://telegram.me/botfather

- Create a new Bot: /newbot

- Enter name of your Bot: FirstWarningBot

- Enter username for Bot: FirstWarningBot

- Then you will see a token, something like this: 110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw - Copy token 

- In Telegram write: /setjoingroups

- Select the Bot that should join the Alarm group: Click the Bot and Click Enable

- Add the Bot to the group, the same procedure as when adding a normal person to a group.

- You and the Bot should now be members of the Alarm group.

## Obtain chatID

- Now you need to get the ChatID for the group

- Then go to url: https://api.telegram.org/botYOUR_BOT_TOKEN_THAT_YOU COPIED_ABOVE/getUpdates
Replace YOUR_BOT_TOKEN_THAT_YOU COPIED_ABOVE with your bot token. Remember to write bot just before your token in the url

- Look for "chat":{"id":-yyyyyyyyy,
-yyyyyyyyy is the groups chatid(it should have a negative sign)

Now you have both the Bot's token and Group's chatid. Have Fun.
