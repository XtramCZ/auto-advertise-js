const axios = require('axios');
const color = require('colors');
const {readFileSync, readdirSync} = require('fs');
const yaml_config = require('node-yaml-config');

var config = yaml_config.load('config.yml');
var user_id = ''
const headers = {
  headers: {
    'Authorization': config.token,
    'Content-Type': 'application/json'
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function syncReadFile(filename) {
  const content = readFileSync(filename, 'utf-8');
  return content
}

function randomNumber(min, max){
  result = Math.floor(Math.random() * (max - min)) + min
  return result
}

function getWorkHours(){
  if(config.work_hours.enabled){
    global.start_time = new Date()
    global.end_time = new Date()

    // set the work hours
    start_time.setHours(config.work_hours.start_time, randomNumber(0, 59), 0, 0)
    // set the time an hour less but add random minutes
    end_time.setHours(config.work_hours.end_time-1, randomNumber(0, 59), 0, 0)
  }
}

let offline = false
async function checkWorkTime() {
  return new Promise((resolve) => {
    const now = new Date();
    // If time now is before start time or after end time
    if (
      // if the hours now are lower than start time
      now.getHours() < global.start_time.getHours() ||
      // if the hour is the same as start time, but minutes now are lower
      (now.getHours() === global.start_time.getHours() && now.getMinutes() < global.start_time.getMinutes()) ||
      // if the time is after end time
      now.getHours() > global.end_time.getHours() ||
      // if the hours is the same as end time, but minutes are higher
      (now.getHours() === global.end_time.getHours() && now.getMinutes() > global.end_time.getMinutes())
    ) {
      if (!offline) {
        console.log(color.blue(` > Going offline until ${global.start_time.getHours()}:${global.start_time.getMinutes()}`));
        offline = true;
      }
      setTimeout(() => {
        checkWorkTime().then(resolve);
      }, 300000); // Check again after 5 minutes
    } else {
      resolve();
    }
  });
}


async function getChannelInfo(channel_id){
  const channel = await axios.get(`https://discord.com/api/v9/channels/${channel_id}`, headers)
  const guild = await axios.get(`https://discord.com/api/v9/guilds/${channel.data.guild_id}`, headers)

  channel_name = channel && channel.data && channel.data.name ? channel.data.name : channel_id
  guild_name = guild && guild.data && guild.data.name ? guild.data.name : "Unknown guild"

  return {channel_name, guild_name}
}

async function checkDoublePosting(channel_id, number){
  const response = await axios.get(`https://discord.com/api/v9/channels/${channel_id}/messages?limit=${number}`, headers)
  for(let i = 0; i < number; i++){
    // if any of the last x messages are posted by you
    if(response.data[i] && response.data[i].author.id == user_id){
      return false
    }
  }
  return true
}

async function sendToChannel(channel_id, message, channel_name, guild_name){
  // Check if you double-post / spam
  if(config.avoid_spam.enabled){
    amount = randomNumber(config.avoid_spam.maximum_messages, config.avoid_spam.minimum_messages)
    var can_post = await checkDoublePosting(channel_id, amount)
    if (!can_post){
      return config.debug_mode ? console.log(` > Skipping "${channel_name}" in "${guild_name}" because you have "avoid_spam" enabled (${amount} messages)`) : null
    }
  }
  // Post the message to the API
  try {

    // Check if there's multiple messages
    if(Array.isArray(message)){

      // copy the array
      let messages = [...message]
      while(messages.length > 0){
        // Post the message
        await axios.post(`https://discord.com/api/v9/channels/${channel_id}/messages`, {
          content: syncReadFile('messages/' + messages[0])
          }, 
          headers
        )
        // Remove the first item
        messages.shift()
      }

    // else
    } else {
      // Post the message
      await axios.post(`https://discord.com/api/v9/channels/${channel_id}/messages`, {
        content: message
        }, 
        headers
      )
    }
    config.debug_mode ? console.log(` > A message was sent to "${channel_name}" in "${guild_name}"`) : null
  } catch (err) {
    var code = err.response.data.code
    if(code == 50013){ // If the error is "Missing Permissions"
      return console.log(color.red(` > There was a problem sending a message to "${channel_name}" in "${guild_name}" (MUTED)`))
    } else if(code == 20016){ // If the error is because of cooldown
      return
    } else {
     console.log(color.red(` > There was a problem sending a message to "${channel_name}" in "${guild_name}"`))
    }
  }
}

console.clear()

// Don't skid plz thx

process.title = "Auto Advertiser - Made by XtramCZ"
console.log(color.red(`
     â–â–â–â–â–â•— â–â–â•—   â–â–â•—â–â–â–â–â–â–â–â–â•— â–â–â–â–â–â–â•—      â–â–â–â–â–â•— â–â–â–â–â–â–â•— 
    â–â–â•”â•â•â–â–â•—â–â–â•‘   â–â–â•‘â•šâ•â•â–â–â•”â•â•â•ťâ–â–â•”â•â•â•â–â–â•—    â–â–â•”â•â•â–â–â•—â–â–â•”â•â•â–â–â•—
    â–â–â–â–â–â–â–â•‘â–â–â•‘   â–â–â•‘   â–â–â•‘   â–â–â•‘   â–â–â•‘    â–â–â–â–â–â–â–â•‘â–â–â•‘  â–â–â•‘
    â–â–â•”â•â•â–â–â•‘â–â–â•‘   â–â–â•‘   â–â–â•‘   â–â–â•‘   â–â–â•‘    â–â–â•”â•â•â–â–â•‘â–â–â•‘  â–â–â•‘
    â–â–â•‘  â–â–â•‘â•šâ–â–â–â–â–â–â•”â•ť   â–â–â•‘   â•šâ–â–â–â–â–â–â•”â•ť    â–â–â•‘  â–â–â•‘â–â–â–â–â–â–â•”â•ť
    â•šâ•â•ť  â•šâ•â•ť â•šâ•â•â•â•â•â•ť    â•šâ•â•ť    â•šâ•â•â•â•â•â•ť     â•šâ•â•ť  â•šâ•â•ťâ•šâ•â•â•â•â•â•ť 

    `), 'by XtramCZ'
)
var last_message = ""
async function sendMessages() {
  let message;
  if(config.multiple_messages.enabled){
    var message_folder = readdirSync('messages')

    // If the mode is 0 (random messages)
    if(config.multiple_messages.mode == 0){
      if(message_folder.length > 1){
        // remove the last message from the choices to avoid repeating
        message_folder.splice(message_folder.indexOf(last_message), 1)
      }
      // choose a random message file
      let message_file = message_folder[Math.floor(Math.random() * message_folder.length)]
      message = syncReadFile('messages/' + message_file)
      last_message = message_file
      
      // If the mode is 1 (sort messages, send all at once)
    } else if(config.multiple_messages.mode == 1){
      // assing the array to "message" (handled in sendToChannel)
      message = message_folder.sort()
    }
  } else {
    message = syncReadFile("message.txt")
  }

  if(config.work_hours.enabled){
    getWorkHours();
    // check if offline, and if yes, block the code until work hours
    await checkWorkTime()
  }
  for (let i = 0; i < config.channels.length; i++) {
    try {
      // Get the channel info used in logs
      const { channel_name, guild_name } = await getChannelInfo(config.channels[i])
      sendToChannel(config.channels[i], message, channel_name, guild_name)
                    
      if(config.wait_between_messages.enabled){
        // wait between individual messages
        wait_time = randomNumber(config.wait_between_messages.maximum_interval, config.wait_between_messages.minimum_interval)
        await sleep(wait_time * 1000)
      }
      
    } catch {
      console.log(color.red(`> There was a problem sending a message to "${config.channels[i]}"`))
    }
  }

  // Wait the specified time and repeat the function
  var delay = config.interval

  if(config.randomize_interval.enabled){
    // randomize the delay if it's enabled
    if(!(config.randomize_interval.minimum_interval > config.randomize_interval.maximum_interval)){
      delay = randomNumber(config.randomize_interval.maximum_interval, config.randomize_interval.minimum_interval)
      config.debug_mode ? console.log(color.blue(` > Waiting ${delay} minutes...`)) : null
    }
  }
  setTimeout(sendMessages, delay * 60000) // Change 60000 to 1000 for testing (makes the interval seconds instead of minutes)
}


async function start(){
  try {
    var user = await axios.get('https://discord.com/api/v9/users/@me', headers)
  } catch (error) {
    console.log()
    console.error(color.red(' > Token is invalid!'));
    process.exit(1)
  }
  console.log()
  console.log(color.green(' > Token is valid!'))
  user_id = user.data.id
  // Wait before starting
  config.wait_before_start > 0 ? console.log(` > Waiting ${config.wait_before_start} minutes before starting...`) : null
  await sleep(config.wait_before_start * 60000) // Change 60000 to 1000 for testing (makes the interval seconds instead of minutes)
  // Start the loop
  console.log()
  await sendMessages()
}

start()
