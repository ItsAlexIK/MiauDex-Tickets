const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { addToBlacklist, removeFromBlacklist, isBlacklisted, getBlacklistedUsers, setAdminRole, getAdminRole } = require('../database/database');

const commands = [
  new SlashCommandBuilder()
    .setName('setuptickets')
    .setDescription('Setup the ticket panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  new SlashCommandBuilder()
    .setName('setadminrole')
    .setDescription('Set the admin role for ticket management')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role that can manage tickets')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Blacklist a user from creating tickets')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to blacklist')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for blacklisting')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  new SlashCommandBuilder()
    .setName('unblacklist')
    .setDescription('Remove a user from the blacklist')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to unblacklist')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  new SlashCommandBuilder()
    .setName('blacklistcheck')
    .setDescription('Check if a user is blacklisted')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  new SlashCommandBuilder()
    .setName('blacklistlist')
    .setDescription('List all blacklisted users')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
];

async function handleSlashCommand(interaction) {
  try {
    const { commandName } = interaction;

    if (!interaction.guild) {
      return interaction.reply({ 
        content: '❌ This command can only be used in a server.', 
        ephemeral: true 
      });
    }

    if (!interaction.member) {
      try {
        await interaction.guild.members.fetch(interaction.user.id);
      } catch (error) {
        return interaction.reply({ 
          content: '❌ Unable to verify your permissions. Please try again.', 
          ephemeral: true 
        });
      }
    }

    if (commandName === 'setuptickets') {
      if (process.env.BOT_OWNER_ID && interaction.user.id !== process.env.BOT_OWNER_ID) {
        return interaction.reply({ content: '❌ Only the bot owner can use this command.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('🎫 Support Tickets')
        .setDescription('Need help? Click the button below to create a support ticket.')
        .setColor('#5865F2')
        .setFooter({ text: 'Our support team will assist you shortly.' });

      const button = new ButtonBuilder()
        .setCustomId('open-ticket')
        .setLabel('Create Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫');

      const row = new ActionRowBuilder().addComponents(button);

      await interaction.channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: '✅ Ticket panel has been created!', ephemeral: true });
      return;
    }

    if (commandName === 'setadminrole') {
      if (!interaction.member || !interaction.member.permissions || !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ 
          content: '❌ You need Administrator permission to use this command.', 
          ephemeral: true 
        });
      }

      const role = interaction.options.getRole('role');
      
      setAdminRole(interaction.guild.id, role.id);
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Admin Role Set')
        .setDescription(`Admin role has been set to ${role}`)
        .setColor('#00ff00')
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (['blacklist', 'unblacklist', 'blacklistcheck', 'blacklistlist'].includes(commandName)) {
      let hasAdminPerms = false;
      if (interaction.member && interaction.member.permissions) {
        hasAdminPerms = interaction.member.permissions.has(PermissionFlagsBits.Administrator) || 
                        interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);
      }
      
      const adminRoleId = getAdminRole(interaction.guild.id);
      let hasAdminRole = false;
      if (adminRoleId && interaction.member && interaction.member.roles) {
        hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
      }

      if (!hasAdminPerms && !hasAdminRole) {
        return interaction.reply({ 
          content: '❌ You need Administrator/Manage Channels permission or the admin role to use this command.', 
          ephemeral: true 
        });
      }
    }

    if (commandName === 'blacklist') {
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      if (targetUser.id === interaction.user.id) {
        return interaction.reply({ content: '❌ You cannot blacklist yourself.', ephemeral: true });
      }

      const success = addToBlacklist(interaction.guild.id, targetUser.id, interaction.user.id, reason);
      
      if (!success) {
        return interaction.reply({ content: `❌ ${targetUser.tag} is already blacklisted from creating tickets.`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('🚫 User Blacklisted')
        .setDescription(`**User:** ${targetUser.tag} (${targetUser.id})\n**Reason:** ${reason}\n**Added by:** ${interaction.user.tag}`)
        .setColor('#ff0000')
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'unblacklist') {
      const targetUser = interaction.options.getUser('user');

      const success = removeFromBlacklist(interaction.guild.id, targetUser.id);
      
      if (!success) {
        return interaction.reply({ content: `❌ ${targetUser.tag} is not blacklisted.`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ User Unblacklisted')
        .setDescription(`**User:** ${targetUser.tag} (${targetUser.id})\n**Removed by:** ${interaction.user.tag}`)
        .setColor('#00ff00')
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'blacklistcheck') {
      const targetUser = interaction.options.getUser('user');
      const blacklisted = isBlacklisted(interaction.guild.id, targetUser.id);
      
      const embed = new EmbedBuilder()
        .setTitle('🔍 Blacklist Check')
        .setDescription(`**User:** ${targetUser.tag} (${targetUser.id})\n**Status:** ${blacklisted ? '🚫 Blacklisted' : '✅ Not Blacklisted'}`)
        .setColor(blacklisted ? '#ff0000' : '#00ff00')
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'blacklistlist') {
      const blacklistedUsers = getBlacklistedUsers(interaction.guild.id);

      if (blacklistedUsers.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('📋 Blacklisted Users')
          .setDescription('No users are currently blacklisted.')
          .setColor('#5865F2')
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      let description = '';
      for (const entry of blacklistedUsers.slice(0, 10)) {
        try {
          const user = await interaction.client.users.fetch(entry.user_id);
          const addedBy = await interaction.client.users.fetch(entry.added_by);
          const date = new Date(entry.added_at).toLocaleDateString();
          
          description += `**${user.tag}** (${user.id})\n`;
          description += `Reason: ${entry.reason || 'No reason provided'}\n`;
          description += `Added by: ${addedBy.tag} on ${date}\n\n`;
        } catch (error) {
          description += `**Unknown User** (${entry.user_id})\n`;
          description += `Reason: ${entry.reason || 'No reason provided'}\n`;
          description += `Added on: ${new Date(entry.added_at).toLocaleDateString()}\n\n`;
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Blacklisted Users')
        .setDescription(description)
        .setColor('#ff0000')
        .setTimestamp();

      if (blacklistedUsers.length > 10) {
        embed.setFooter({ text: `Showing 10 of ${blacklistedUsers.length} blacklisted users` });
      }

      return interaction.reply({ embeds: [embed] });
    }

  } catch (error) {
    console.error('Error in handleSlashCommand:', error);
    
    try {
      if (!interaction.replied) {
        await interaction.reply({ 
          content: '❌ An error occurred while processing your command.', 
          ephemeral: true 
        });
      }
    } catch (replyError) {
      console.error('Error sending error reply:', replyError);
    }
  }
}

module.exports = {
  commands,
  handleSlashCommand
};