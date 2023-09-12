const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
require('dotenv').config();

const clientId = '769412944256958464';
const guildId = '727594699698733083';
const token = process.env.DISCORD_BOT_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
  console.log('Logged in as', client.user.tag);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'search') {
    const playerName = interaction.options.getString('playername');
    const gameMode = interaction.options.getString('gamemode'); // Assuming you have a gamemode option

    // Fetch data using playerName
    const fetch = await import('node-fetch');
    const profileURL = `https://stats.pika-network.net/api/profile/${playerName}`;
    const gameModeURL = `https://stats.pika-network.net/api/profile/${playerName}/leaderboard?type=${gameMode}&interval=total&mode=ALL_MODES`;

    try {
        const profileResponse = await fetch.default(profileURL);
        const profileData = await profileResponse.json();

        const gameModeResponse = await fetch.default(gameModeURL);
        const gameModeData = await gameModeResponse.json();

        // Extracting the required data
        const username = profileData.username;
        const rank = profileData.rank ? profileData.rank.rankDisplay.replace(/&[0-9a-fk-or]/g, '') : "N/A"; // Stripping out Minecraft color codes
        const level = profileData.rank ? profileData.rank.level : "N/A";
        const guild = profileData.clan ? profileData.clan.name : "N/A";
        const guildOwner = profileData.clan ? profileData.clan.owner.username : "N/A";
        const guildMembersCount = profileData.clan ? profileData.clan.members.length : "N/A";

        // Extracting game mode specific data
        const kills = gameModeData.Kills ? gameModeData.Kills.entries[0].value : "N/A";
        const finalKills = gameModeData["Final kills"] ? gameModeData["Final kills"].entries[0].value : "N/A";
        const deaths = gameModeData.Deaths ? gameModeData.Deaths.entries[0].value : "N/A";
        const wins = gameModeData.Wins ? gameModeData.Wins.entries[0].value : "N/A";
        const losses = gameModeData.Losses ? gameModeData.Losses.entries[0].value : "N/A";
        const wlr = (wins && losses) ? (parseInt(wins) / (parseInt(losses) || 1)).toFixed(2) : "N/A"; // Win/Lose Rate
        const kdr = (kills && deaths) ? (parseInt(kills) / (parseInt(deaths) || 1)).toFixed(2) : "N/A"; // Kill/Death Rate
        const highestWinStreak = gameModeData["Highest winstreak reached"] ? gameModeData["Highest winstreak reached"].entries[0].value : "N/A";

        let statsContent = "";

        if (gameMode === "skywars") {
            statsContent = `
        - **Stats (Skywars):**
          - **Kills:** ${kills}
          - **Deaths:** ${deaths}
          - **Wins:** ${wins}
          - **Losses:** ${losses}
          - **Win/Lose Rate:** ${wlr}
          - **Kill/Death Rate:** ${kdr}
          - **Highest Win Streak:** ${highestWinStreak}
        `;
        } else if (gameMode === "bedwars") {
            const bedsDestroyed = gameModeData["Beds destroyed"] ? gameModeData["Beds destroyed"].entries[0].value : "N/A";
            const bedBreakRate = (bedsDestroyed && wins) ? (parseInt(bedsDestroyed) / parseInt(wins)).toFixed(2) : "N/A";
            const bedLoseRate = (bedsDestroyed && losses) ? (parseInt(bedsDestroyed) / parseInt(losses)).toFixed(2) : "N/A";
        
            statsContent = `
        - **Stats (Bedwars):**
          - **Kills:** ${kills}
          - **Final Kills:** ${finalKills}
          - **Deaths:** ${deaths}
          - **Wins:** ${wins}
          - **Losses:** ${losses}
          - **Win/Lose Rate:** ${wlr}
          - **Kill/Death Rate:** ${kdr}
          - **Beds Destroyed:** ${bedsDestroyed}
          - **Bed Break Rate:** ${bedBreakRate}
          - **Bed Lose Rate:** ${bedLoseRate}
          - **Highest Win Streak:** ${highestWinStreak}
        `;
        }        

        // Send data to Discord channel
        interaction.reply(statsContent);
    } catch (error) {
        interaction.reply('Error fetching data.');
    }
}

});

client.login(token);

// Registering the command
const commands = [
    {
      name: 'search',
      description: 'Search for a player on PikaNetwork',
      options: [
        {
          name: 'playername',
          type: 3, // STRING type
          description: 'Name of the player',
          required: true,
        },
        {
          name: 'gamemode',
          type: 3, // STRING type
          description: 'Game mode to search for',
          required: true,
          choices: [
            {
                name: 'Skywars',
                value: 'skywars'
            },
            {
                name: 'Bedwars',
                value: 'bedwars'
            }
          ]
        },
      ],
    },
  ];
  
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
