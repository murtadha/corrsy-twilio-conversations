const USERNAME = process.env.TWILIO_USERNAME;
const PASSWORD = process.env.TWILIO_PASSWORD;

const headers = new Headers();
headers.set('Authorization', 'Basic ' + Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64'))
const IDENTITY = 'user00';

async function main() {
  let url = 'https://conversations.twilio.com/v1/Conversations';
  while (url) {
    const res = await fetch(url, {headers})
    const json = await res.json();
    await Promise.all(json.conversations.map(syncConversation));
    console.log(`Finished page ${json.meta.page} with ${json.conversations.length} conversations`);
    url = json.meta.next_page_url;
  }
}

async function syncConversation(conversation) {
  const url = `https://conversations.twilio.com/v1/Conversations/${conversation.sid}/Participants`;
  const res = await fetch(url, {headers})
  const json = await res.json();
  for (let p of json.participants) {
    if (p.identity === IDENTITY) {
      console.log(`Found user in ${conversation.sid}, skipping.`);
      return;
    }
  }

  const body = new URLSearchParams({Identity: IDENTITY});
  const send = await fetch(url, {headers, method: 'post', body});
  if (!send.ok) {
    console.error(`Failed for ${conversation.sid}:`, send.status, send.statusText, await send.text());
  }
}

main();
