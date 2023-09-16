const { Client, GatewayIntentBits, REST, EmbedBuilder, Routes } = require('discord.js');
require('dotenv').config();

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
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
    const gameMode = interaction.options.getString('gamemode');

    const fetch = await import('node-fetch');
    const profileURL = `https://stats.pika-network.net/api/profile/${playerName}`;

    const timePeriod = interaction.options.getString('timeperiod');
    let interval = 'total'; // default to all time
    if (timePeriod === 'weekly') interval = 'weekly';
    else if (timePeriod === 'monthly') interval = 'monthly';

    const gameModeURL = `https://stats.pika-network.net/api/profile/${playerName}/leaderboard?type=${gameMode}&interval=${interval}&mode=ALL_MODES`;

    try {
      const profileResponse = await fetch.default(profileURL);
      const profileData = await profileResponse.json();

      const gameModeResponse = await fetch.default(gameModeURL);
      const gameModeData = await gameModeResponse.json();

      // Extracting the required data
      const username = profileData.username;
      const rank = profileData.ranks && profileData.ranks[0] && profileData.ranks[0].displayName ? profileData.ranks[0].displayName.replace(/&[0-9a-fk-or]/g, '') : "";
      const level = profileData.rank ? profileData.rank.level : "N/A";
      const guild = profileData.clan ? profileData.clan.name : "N/A";
      const guildOwner = profileData.clan ? profileData.clan.owner.username : "N/A";
      const guildMembersCount = profileData.clan ? profileData.clan.members.length : "N/A";

      // Extracting game mode specific data
      const kills = gameModeData.Kills ? gameModeData.Kills.entries[0].value : "N/A";
      const killsPosition = gameModeData.Kills ? gameModeData.Kills.entries[0].place : "N/A";

      const finalKills = gameModeData["Final kills"] ? gameModeData["Final kills"].entries[0].value : "N/A";
      const finalKillsPosition = gameModeData["Final kills"] ? gameModeData["Final kills"].entries[0].place : "N/A";

      const deaths = gameModeData.Deaths ? gameModeData.Deaths.entries[0].value : "N/A";
      const deathsPosition = gameModeData.Deaths ? gameModeData.Deaths.entries[0].place : "N/A";

      const wins = gameModeData.Wins ? gameModeData.Wins.entries[0].value : "N/A";
      const winsPosition = gameModeData.Wins ? gameModeData.Wins.entries[0].place : "N/A";

      const losses = gameModeData.Losses ? gameModeData.Losses.entries[0].value : "N/A";
      const lossesPosition = gameModeData.Losses ? gameModeData.Losses.entries[0].place : "N/A";

      const highestWinStreak = gameModeData["Highest winstreak reached"] ? gameModeData["Highest winstreak reached"].entries[0].value : "N/A";
      const highestWinStreakPosition = gameModeData["Highest winstreak reached"] ? gameModeData["Highest winstreak reached"].entries[0].place : "N/A";

      const kdr = (kills && deaths) ? (parseInt(kills) / parseInt(deaths)).toFixed(2) : "N/A";
      const wlr = (wins && losses) ? (parseInt(wins) / parseInt(losses)).toFixed(2) : "N/A";
      const fkdr = (finalKills && deaths) ? (parseInt(kills) / parseInt(deaths)).toFixed(2) : "N/A";


      let statsContent = "";

      if (gameMode === "skywars") {
        statsContent = `
        **Skywars Stats:**
        
        **Kills:** ${kills} (Rank: #${killsPosition})
        **Deaths:** ${deaths} (Rank: #${deathsPosition})
        **KDR:** ${kdr}
        
        **Wins:** ${wins} (Rank: #${winsPosition})
        **Losses:** ${losses} (Rank: #${lossesPosition})
        **WLR:** ${wlr}
        
        **Highest Win Streak:** ${highestWinStreak} (Rank: #${highestWinStreakPosition})
        `;
      } else if (gameMode === "bedwars") {
        const bedsDestroyed = gameModeData["Beds destroyed"] ? gameModeData["Beds destroyed"].entries[0].value : "N/A";
        const bedsDestroyedPosition = gameModeData["Beds destroyed"] ? gameModeData["Beds destroyed"].entries[0].place : "N/A";

        const bedBreakRate = (bedsDestroyed && wins) ? (parseInt(bedsDestroyed) / parseInt(wins)).toFixed(2) : "N/A";

        statsContent = `
        **Bedwars Stats:**
        
        **Kills:** ${kills} (Rank: #${killsPosition})
        **Deaths:** ${deaths} (Rank: #${deathsPosition})
        **KDR:** ${kdr}
        
        **Final Kills:** ${finalKills} (Rank: #${finalKillsPosition})
        **Final KDR:** ${fkdr}

        **Wins:** ${wins} (Rank: #${winsPosition})
        **Losses:** ${losses} (Rank: #${lossesPosition})
        **WLR:** ${wlr}
        
        **Beds Destroyed:** ${bedsDestroyed} (Rank: #${bedsDestroyedPosition})
        **Bed Break Rate:** ${bedBreakRate}
        
        **Highest Win Streak:** ${highestWinStreak} (Rank: #${highestWinStreakPosition})
        `;
      }

      // Fetching UUID from Mojang API
      const mojangResponse = await fetch.default(`https://api.mojang.com/users/profiles/minecraft/${playerName}`);
      const mojangData = await mojangResponse.json();
      const uuid = mojangData.id;

      // Constructing the avatar URL
      const avatarURL = `https://crafatar.com/avatars/${uuid}?overlay`;

      const lastSeen = profileData.lastSeen;
      const lastSeenDate = new Date(lastSeen); // Convert the Unix timestamp to a JavaScript Date object

      // Creating the embed
      // Constructing the embed data as an object

      const playerURL = `https://stats.pika-network.net/player/${username}`;

      const embed = new EmbedBuilder()
        .setAuthor({
          name: username,
          url: playerURL,
          iconUrl: avatarURL,
        })
        .setTitle(rank ? `${username} [${rank}]` : username)
        .setURL(playerURL)
        .setDescription(statsContent)
        .setThumbnail(avatarURL)
        .addFields(
          {
            name: 'Guild',
            value: guild,
            inline: true
          },
          {
            name: 'Guild Member Count',
            value: guildMembersCount.toString(),
            inline: true
          },
          {
            name: 'Level',
            value: level.toString(),
            inline: true
          }
        )
        .setFooter({
          text: 'Last Seen',
          iconUrl: "https://img.icons8.com/material-outlined/24/FFFFFF/clock--v1.png"
        })
        .setTimestamp(lastSeenDate)
        .setColor(0xFFFFFF);

      interaction.reply({ embeds: [embed] });

    } catch (error) {
      interaction.reply('Error fetching data or the user may not have played on the server.');
      console.log(error);
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
      {
        name: 'timeperiod',
        type: 3, // STRING type
        description: 'Time period for stats',
        required: true,
        choices: [
          {
            name: 'Weekly',
            value: 'weekly'
          },
          {
            name: 'Monthly',
            value: 'monthly'
          },
          {
            name: 'All Time',
            value: 'alltime'
          }
        ]
      }
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