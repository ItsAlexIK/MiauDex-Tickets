const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { setupDatabase } = require('./database/database');
const { registerButtonHandlers } = require('./handlers/button-handler');
const { handleInteraction } = require('./handlers/interaction-handler');
const { commands, handleSlashCommand } = require('./handlers/slash-commands');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

setupDatabase();
client.buttonHandlers = new Collection();
registerButtonHandlers(client);

async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands.map(command => command.toJSON()) }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
}

client.once('ready', async () => {
  console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
  
  await deployCommands();
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction);
  } else {
    await handleInteraction(interaction, client);
  }
});

client.login(process.env.DISCORD_TOKEN);