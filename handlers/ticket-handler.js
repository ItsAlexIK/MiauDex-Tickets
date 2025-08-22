const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getNextTicketNumber, addTicket, removeTicket, getTicketByChannel, getTicketByUser, isBlacklisted, getAdminRole } = require('../database/database');
const { saveTranscript } = require('../services/transcript-service');

async function handleTicketButton(interaction, client) {
  const guild = interaction.guild;
  const user = interaction.user;

  if (!guild || !interaction.member) {
    return interaction.reply({
      content: '❌ This command can only be used in a server.',
      ephemeral: true
    });
  }

  if (isBlacklisted(guild.id, user.id)) {
    return interaction.reply({
      content: '❌ You are blacklisted from creating tickets.',
      ephemeral: true
    });
  }

  const existingTicket = getTicketByUser(guild.id, user.id);
  if (existingTicket) {
    return interaction.reply({ 
      content: '❌ You already have an open ticket! Please close your existing ticket before opening a new one.', 
      ephemeral: true 
    });
  }

  const ticketNumber = getNextTicketNumber(guild.id);
  const channelName = `ticket-${String(ticketNumber).padStart(4, '0')}`;
  const ticketCategoryId = process.env.TICKET_CATEGORY_ID;

  const adminRoleId = getAdminRole(guild.id);

  try {
    const permissionOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      }
    ];

    if (adminRoleId) {
      const adminRole = guild.roles.cache.get(adminRoleId);
      if (adminRole) {
        permissionOverwrites.push({
          id: adminRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages
          ]
        });
      }
    }

    const membersWithManageChannels = guild.members.cache.filter(member => 
      member.permissions.has(PermissionFlagsBits.ManageChannels)
    );

    membersWithManageChannels.forEach(member => {
      permissionOverwrites.push({
        id: member.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages
        ]
      });
    });

    const channel = await guild.channels.create({
      name: channelName,
      type: 0,
      parent: ticketCategoryId,
      permissionOverwrites: permissionOverwrites,
    });

    addTicket(guild.id, channel.id, user.id);

    const embed = {
      title: '🎫 Support Ticket',
      description: `Hello ${user}! Thank you for creating a support ticket.\n\n` +
                  `**Ticket #${ticketNumber}**\n` +
                  `A staff member will be with you shortly. Please describe your issue in detail.\n\n` +
                  `To close this ticket, click the **Close Ticket** button below.`,
      color: 0x00ff00,
      timestamp: new Date().toISOString(),
      footer: {
        text: `Ticket #${ticketNumber} • ${guild.name}`,
        icon_url: guild.iconURL()
      }
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close-ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒')
    );

    await interaction.reply({ 
      content: `✅ Your ticket has been created: ${channel}`, 
      ephemeral: true 
    });

    await channel.send({ 
      embeds: [embed], 
      components: [row] 
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    await interaction.reply({ 
      content: '❌ Failed to create ticket. Please contact an administrator.', 
      ephemeral: true 
    });
  }
}

async function handleCloseTicket(interaction, client) {
  const channel = interaction.channel;
  const ticket = getTicketByChannel(channel.id);

  if (!ticket) {
    return interaction.reply({ 
      content: '❌ This channel is not a ticket.', 
      ephemeral: true 
    });
  }

  if (!interaction.guild || !interaction.member) {
    return interaction.reply({
      content: '❌ This command can only be used in a server.',
      ephemeral: true
    });
  }

  const user = interaction.user;
  const member = interaction.member;
  const hasManageChannels = member.permissions.has(PermissionFlagsBits.ManageChannels);
  
  const adminRoleId = getAdminRole(interaction.guild.id);
  const hasAdminRole = adminRoleId && member.roles.cache.has(adminRoleId);

  if (!hasManageChannels && !hasAdminRole) {
    return interaction.reply({
      content: '❌ Only administrators can close tickets.',
      ephemeral: true
    });
  }

  try {
    await interaction.reply('🔄 Closing ticket and saving transcript...');

    await saveTranscript(channel, client);

    removeTicket(channel.id);

    setTimeout(async () => {
      try {
        await channel.delete('Ticket closed');
      } catch (error) {
        console.error('Error deleting ticket channel:', error);
      }
    }, 3000);

  } catch (error) {
    console.error('Error closing ticket:', error);
    await interaction.followUp({ 
      content: '❌ An error occurred while closing the ticket.', 
      ephemeral: true 
    });
  }
}

module.exports = {
  handleTicketButton,
  handleCloseTicket
};