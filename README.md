# 🎫 Discord Ticket Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive Discord bot designed to handle support tickets with ease. Features automated ticket creation, blacklist system, transcript saving, and a clean, user-friendly interface. Perfect for Discord servers that need organized customer support or help desk functionality.

## ✨ Features

- **Automated Ticket System** with sequential numbering
- **Slash Commands** for setup and management
- **Blacklist System** to block abusive users from opening tickets
- **Permission-based Access Control** with custom admin role
- **Transcript Generation** - automatically saves conversation history
- **Database Integration** with SQLite for persistent storage
- Details include:
  - 🎟️ Unique ticket numbering system
  - 🔒 Secure channel permissions (only ticket creator + staff can view)
  - 📋 Automatic transcript saving to designated channel
  - 🚫 Blacklist management (`/blacklist`, `/unblacklist`, `/blacklistcheck`, `/blacklistlist`)
  - 🛡️ Admin role assignment (`/setadminrole`)
  - ⚡ Easy setup with `/setuptickets`

## 🎯 How It Works

1. **Setup**: Admin runs `/setuptickets` to create the ticket panel
2. **Create Ticket**: Users click "Create Ticket" button
3. **Support**: Staff members can view and respond in private ticket channels
4. **Close Ticket**: Staff with `Manage Channels` permission or the **Admin Role** can close
5. **Archive**: Transcript is automatically saved and channel is deleted
6. **Blacklist**: Admins can restrict specific users from creating tickets

## 🛡️ Permission System

The bot uses a secure permission system:

- **Ticket Creation**: Any non-blacklisted member can create tickets
- **Ticket Access**: Only the ticket creator, staff, and admins can view ticket channels
- **Ticket Closing**: Only staff with `Manage Channels` permission or the assigned **Admin Role**
- **Setup Command**: Requires Administrator permission (optionally restricted to Bot Owner)
- **Blacklist Commands**: Require `Manage Channels` / `Administrator` or the Admin Role

## 📦 Requirements

- Node.js 18 or higher
- A Discord bot token
- Discord.js v14
- better-sqlite3 for database
- Message Content Intent (for full functionality)

## 🔧 Setup

1. Clone the repository:

```bash
git clone https://github.com/ItsAlexIK/MiauDex-Tickets.git
cd MiauDex-Tickets
npm install
```

2. Create a `.env` file in the project root with the following content:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here

# Ticket System Configuration
TICKET_CATEGORY_ID=your_category_id_here
TRANSCRIPT_CHANNEL_ID=your_transcript_channel_id_here

# Bot Owner (Optional - for additional security on setup command)
BOT_OWNER_ID=your_user_id_here
```

3. Set up your Discord server:
   - Create a **category** for tickets
   - Create a **channel** for transcripts
   - Add the category and transcript channel IDs to your `.env` file

4. Run the bot:

```bash
node bot.js
```

5. In your Discord server, run `/setuptickets` to create the ticket panel

## 🗂️ Project Structure

```
MiauDex-Tickets/
├── bot.js                            # Main application file
├── .env                              # Environment configuration
├── .gitignore                        # Git ignore rules
├── package.json                      # Dependencies and scripts
├── README.md                         # Project documentation
├── database/
│   ├── database.js                   # Database operations
│   └── tickets.db                    # SQLite database (auto-created)
├── services/
│   └── transcript-service.js         # Transcript generation
└── handlers/
    ├── button-handler.js             # Button interaction registry
    ├── ticket-handler.js             # Ticket creation/closing logic
    ├── interaction-handler.js        # Interaction handling
    └── slash-commands.js             # Slash command
```

## ⚙️ Configuration Options

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | ✅ | Your Discord bot token |
| `TICKET_CATEGORY_ID` | ✅ | Category ID where ticket channels will be created |
| `TRANSCRIPT_CHANNEL_ID` | ✅ | Channel ID where transcripts will be saved |

### Bot Permissions

Your bot needs these permissions:
- `Manage Channels` (create/delete ticket channels)
- `View Channels`
- `Send Messages`
- `Embed Links`
- `Attach Files` (for transcripts)
- `Read Message History`
- `Use Slash Commands`

## 📬 Connect 

- [Discord](https://discord.com/users/551023598203043840)
- [GitHub](https://github.com/ItsAlexIK)

---

> Made with ❤️ by ItsAlexIK