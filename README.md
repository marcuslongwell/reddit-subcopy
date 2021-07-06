# reddit-subcopy

a simple script to copy subreddits from one account to another

## setup

Copy the example.env file to a .env file to the root of this source.

Create a new script application:
https://www.reddit.com/prefs/apps

In that script application, make sure both the account you're going to and the one you're moving from are developers in the application. You can specify localhost as the redirect (no oauth required for this app).

Copy the personal use script token and secret from the app you created into the .env file you created.

Optionally, if you want to not be prompted for a username and password for either the account you're going to or the one your'e coming from (or both), you can in .env as well. If you don't specify them, you'll be prompted to type them in the console. This is mostly handle for dev/testing.

Install dependencies:
```
npm install
```

## run the script

If you have everything set up, you're good to run the script:
```
npm start
```

