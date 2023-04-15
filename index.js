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
  // Post the message to the API
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

// Don't skid plz thx

process.title = "Made by XtramCZ"
console.log(color.red(`
     █████╗ ██╗   ██╗████████╗ ██████╗      █████╗ ██████╗ 
    ██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗    ██╔══██╗██╔══██╗
    ███████║██║   ██║   ██║   ██║   ██║    ███████║██║  ██║
    ██╔══██║██║   ██║   ██║   ██║   ██║    ██╔══██║██║  ██║
    ██║  ██║╚██████╔╝   ██║   ╚██████╔╝    ██║  ██║██████╔╝
    ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝     ╚═╝  ╚═╝╚═════╝ 

    `), 'by XtramCZ'
)

const message = syncReadFile('./message.txt')
async function sendMessage() {
  for (let i = 0; i < config.channels.length; i++) {
    // Get the channel info used in logs
    const channel = client.channels.cache.get(config.channels[i])
    try {
      await sendToChannel(config.channels[i], message).then(() => {
      config.debug_mode ? console.log(` > A message was sent to "${channel && channel.name ? channel.name : config.channels[i]}" in "${channel && channel.guild && channel.guild.name ? channel.guild.name : "Unknown guild"}"`) : null
      })
    } catch (err) {
      var code = err.response.data.code
      if(code == 50013){ // If the error is "Missing Permissions"
        console.log(color.red(` > There was a problem sending a message to "${channel && channel.name ? channel.name : config.channels[i]}" in "${channel && channel.guild && channel.guild.name ? channel.guild.name : "Unknown guild"}" (MUTED)`))
      } else if(code == 20016){ // If the error is because of cooldown
        continue
      } else {
      console.log(color.red(`> There was a problem sending a message to "${channel && channel.name ? channel.name : config.channels[i]}" in "${channel && channel.guild && channel.guild.name ? channel.guild.name : "Unknown guild"}"`));
      }
      continue
    }
    // Wait so you won't get rate limited
    await sleep(1000)
  }

  // Wait the specified time and repeat the function
  var delay = config.interval

  if(config.randomize_delay.enabled){
    if(!(config.randomize_delay.minimum_delay > config.randomize_delay.maximum_delay)){
      delay = Math.floor(Math.random() * (config.randomize_delay.maximum_delay - config.randomize_delay.minimum_delay)) + config.randomize_delay.minimum_delay;
      config.debug_mode ? console.log(`Waiting ${delay} minutes...`) : null
    }
  }
  setTimeout(sendMessage, delay * 60000) // Change 60000 to 1000 for testing (makes the delay seconds instead of minutes)
}

client.on('ready', async () => {
  console.log()
  console.log(color.green(` > Logged in`));
  console.log('') 

  // Wait before starting
  await sleep(config.wait_before_start * 60000) // Change 60000 to 1000 for testing (makes the delay seconds instead of minutes)

  // Start the loop
  console.log(color.blue(' > Sending first batch of messages...'))
  sendMessage()
})

client.login(config.token)
