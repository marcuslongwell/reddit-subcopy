const dotenv = require('dotenv');
const Reddit = require('reddit');
const prompt = require('prompt');
const fs = require('fs-extra');
const readline = require('readline');

dotenv.config();

prompt.start();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// REDDIT_APP_ID
// console.log(process.env.REDDIT_APP_SECRET);

const input = (message = '') => {
  return new Promise((resolve, reject) => {
    rl.question(message, (reply) => {
      resolve(reply);
    });
  });
}

const redditLogin = async (isSource = true) => {
  const defaultReddit = {
    username: 'redditor',
    password: 'passphrase',
    appId: process.env.REDDIT_APP_ID,
    appSecret: process.env.REDDIT_APP_SECRET,
    userAgent: 'subcopy (http://localhost:3000)'
  };

  let reddit = new Reddit(defaultReddit);
  let hasTriedEnv = false;

  while (true) {
    let username = (isSource ? process.env.REDDIT_USER_FROM : process.env.REDDIT_USER_TO) || '';
    let password = (isSource ? process.env.REDDIT_PASSWORD_FROM : process.env.REDDIT_PASSWORD_TO) || '';

    if (hasTriedEnv || username.length < 1 || password.length < 1) {
      let answer = await prompt.get([
        { name: 'username', description: `User you are copying ${isSource ? 'FROM' : 'TO'}` },
        { name: 'password', description: `${username}'s password`, hidden: true, replace: '*' }
      ]);

      username = answer.username;
      password = answer.password;
    } else {
      hasTriedEnv = true;
    }

    reddit.username = username;
    reddit.password = password;
    

    try {
      console.log(`Testing API for ${reddit.username}...`);
      await reddit.get('/api/v1/me');
      return reddit;
    } catch (err) {
      console.warn(err);
      console.log('Unable to sign you in. Please verify your credentials are correct.');
    }
  }
}

const mapSubs = async (fromReddit = new Reddit(), toReddit = new Reddit()) => {
  console.log(`\n\n\n-----------------\nMAPPING SUBS\n-----------------\n\tFrom: u/${fromReddit.username}\n\tTo: u/${toReddit.username}`);

  console.log(`Fetching subs from u/${fromReddit.username}`);
  let lastSubId = '';
  let fromSubs = [];
  const mappedEachIteration = 100;
  while (true) {
    console.log(`Fetching subs ${fromSubs.length + 1}-${fromSubs.length + mappedEachIteration} from u/${fromReddit.username}...`);

    let res = await fromReddit.get('/subreddits/mine/subscriber', { limit: mappedEachIteration, after: 't5_' + lastSubId });
    let subs = res.data.children.map(child => child.data);
    fromSubs = fromSubs.concat(subs);

    if (subs.length < mappedEachIteration) break;


    lastSubId = subs[subs.length - 1].id;
  }

  console.log(`Fetched ${fromSubs.length} subs from u/${fromReddit.username}...`);
  for (let sub of fromSubs) {
    console.log(`\t- ${sub.display_name_prefixed} (t5_${sub.id})`);
  }

  let choice = await input(`Are you sure you want to copy ${fromSubs.length} subs from u/${fromReddit.username} to u/${toReddit.username}? (y/N) `)
  if (choice.toLowerCase() == 'y') {
    console.log(`Subscribing to fetched subs for u/${toReddit.username}...`);
    await toReddit.post('/api/subscribe', { action: 'sub', skip_initial_defaults: true, sr: fromSubs.map(s => 't5_' + s.id).join(',') });

    console.log(`Subscriptions mapped from u/${fromReddit.username} to u/${toReddit.username}`);
  } else {
    console.log('Subscriptions were NOT mapped');
  }
}

(async () => {
  try {
    const fromReddit = await redditLogin(true);
    const toReddit = await redditLogin(false);
    await mapSubs(fromReddit, toReddit);

    console.log('Exiting...');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();




