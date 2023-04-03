const { Client } = require('discord.js-selfbot-v13');
const axios = require('axios');
const client = new Client({checkUpdate: false});
const color = require('colors');
const {readFileSync} = require('fs');
const yaml_config = require('node-yaml-config');

var config = yaml_config.load('config.yml');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function syncReadFile(filename) {
  const content = readFileSync(filename, 'utf-8');
  return content
}

async function sendToChannel(channel_id, message){
  req = await axios.post(`https://discord.com/api/v9/channels/${channel_id}/messages`, {
    content: message
    }, {
    headers: {
      'Authorization': config.token,
      'Content-Type': 'application/json'
    }
    })
}

console.clear()
process.title = "Made by XtramCZ"
console.log(color.red(`
     █████╗ ██╗   ██╗████████╗ ██████╗      █████╗ ██████╗ 
    ██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗    ██╔══██╗██╔══██╗
    ███████║██║   ██║   ██║   ██║   ██║    ███████║██║  ██║
    ██╔══██║██║   ██║   ██║   ██║   ██║    ██╔══██║██║  ██║
    ██║  ██║╚██████╔╝   ██║   ╚██████╔╝    ██║  ██║██████╔╝
    ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝     ╚═╝  ╚═╝╚═════╝ 

`))

const message = syncReadFile('./message.txt')
async function sendMessage() {
  for (let i = 0; i < config.channels.length; i++) {
    const channel = client.channels.cache.get(config.channels[i])
    try {
      await sendToChannel(config.channels[i], message).then(() => {
      config.debug_mode == 'true' ? console.log(` > A message was sent to "${channel.name ? channel.name : "Unknown channel"}" in "${channel.guild.name ? channel.guild.name : "Unknown guild"}"`) : null
      })
    } catch (err) {
      var code = err.response.data.code
      if(code == 50013){ // If the error is "Missing Permissions"
        console.log(color.red(` > There was a problem sending a message to "${channel.name ? channel.name : "Unknown channel"}" in "${channel.guild.name ? channel.guild.name : "Unknown guild"}" (MUTED)`))
      } else if(code == 20016){ // If the error is because of cooldown
        continue
      } else {
      console.log(color.red(` > There was a problem sending a message to "${channel.name ? channel.name : "Unknown channel"}" in "${channel.guild.name ? channel.guild.name : "Unknown guild"}"`))
      }
      continue
    }
    await sleep(1000)
  }
  setTimeout(sendMessage, config.interval * 60000)
}

client.on('ready', async () => {
  console.log()
  console.log(color.green(` > Logged in`));
  console.log('') 

console.log(color.blue(' > Sending first batch of messages...'))
sendMessage()
})

client.login(config.token)
