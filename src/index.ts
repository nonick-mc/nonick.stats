import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

import { ActivityType, Client, Events, GatewayIntentBits } from 'discord.js';
import { DiscordInteractions, DiscordInteractionsErrorCodes } from '@akki256/discord-interaction';
import mongoose, { version } from 'mongoose';
import { guildId } from '../config.json';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const interactions = new DiscordInteractions(client);
interactions.loadInteractions(path.resolve(process.argv[1], '../commands'));

client.once(Events.ClientReady, (): void => {
  console.log('[INFO] BOT ready!');
  console.table({
    'Bot User': client.user?.tag,
    'Guild(s)': `${client.guilds.cache.size} Servers`,
    'Watching': `${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)} Members`,
    'Discord.js': `v${version}`,
    'Node.js': process.version,
    'Platform': `${process.platform} | ${process.arch}`,
    'Memory': `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB | ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB`,
  });

  interactions.registerCommands({ guildId, deleteNoLoad: true });
  reloadActivity();
});

client.on(Events.GuildCreate, (): void => reloadActivity());
client.on(Events.GuildDelete, (): void => reloadActivity());

client.on(Events.InteractionCreate, (interaction): void => {
  if (!interaction.isRepliable()) return;

  interactions.run(interaction)
    .catch(({ error }) => {
      if (error.code == DiscordInteractionsErrorCodes.CommandHasCoolTime) {
        interaction.reply({ content: '`⌛` コマンドはクールダウン中です', ephemeral: true });
        return;
      }
      console.log(error);
    });
});

function reloadActivity(): void {
  client.user?.setActivity({ name: `${client.guilds.cache.size}サーバー`, type: ActivityType.Competing });
}

client.login(process.env.BOT_TOKEN);
mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DBNAME });