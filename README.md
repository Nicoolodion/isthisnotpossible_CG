# Game Status Bot

A Discord bot that checks on if a game can be cracked or not, including checking their crack status, adding new games, and reviewing pending submissions. This bot utilizes Discord.js v14 and provides functionality for role-based access control and interactive command handling.

## Features

- **Check if a game can be cracked**: `/request-blacklist-info <Name of the Game>`
- **Add new games with reasons or submit for review**: `/new-games-add <Name of the Game> <Reason>`
- **Review pending games**: `/review-games`
- **Delete games**: `/delete-games <Name of the Game>`
- **Included logs and easy to use**
- **Duplicate Detection**
- **Easy to use Permission Management**

## Prerequisites

- Node.js v18.0.0 or later
- Discord.js v14 or later

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Nicoolodion/isthisnotpossible_CG.git
   cd isthisnotpossible_CG
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Create a Configuration File**

   Create a `.env` file in the root directory of the project with all the IDs and the discord token stored there.

   The bot will use the `discord_bot_token`, `uploader`, `admin`, `team`, `expection_admin_userID`and `loggingChannel` environment variables from a `.env` file in the root directory. The structure of the file should be as follows:

## Configuration

1. **JSON Files**: Ensure the `data` folder contains the following files:
   - `games.json` (List of games with their crack status and reasons)
   - `pending-games.json` (pending Games that need to be reviewed by Uploaders or Admins review)

   Example structure:

   ```json
   [
       {
         "name": "Fortnite",
         "cracked": false,
         "reason": "Online only"
       }
   ]
   ```

## Commands

- **/request-blacklist-info <Name of the Game>**: Checks if the specified game can be cracked and provides details. Supports partial matches and lists up to 3 results.
- **/new-games-add <Name of the Game> <Reason>**: Adds a new game with a reason. users with `@uploader` or `@admin` roles directly add it to the list. `@team` adds it to pending.
- **/review-games**: Lists pending games and provides options to approve or remove them. Requires `@admin` or `@uploader` role for access.
- **/delete-games <Name of the Game>**: Deletes a game in the list. Requires `@admin` or `@uploader` role for access.

## Running the Bot

After you edit Code you'll need to , first compile it to javascript:

```bash
npm run build
```

afterwards start it:

```bash
npm start
```

## Contact

For any questions or issues, please open an issue on the [GitHub repository](https://github.com/Nicoolodion/isthisnotpossible_CG/issues).

Happy coding!

```

- [x] Upload to GitHub
- [x] Detect Duplicates and still has a force add
- [x] clean up and improve security -- Very Important
- [x] Add a moderation system (like force remove and force admin specific users)
- [x] Add logs
- [x] Make it possible to delete games from the main file.
- [x] fix "undefined" showing up when force adding new-games.add
- [x] Make the input not visible if there is none. (embed logging)
- [x] simplify the commands?
- [ ] Automaticlly writes in a Request Thread or maybe even a Ticket when it detects a Gamename that can't be cracked. Mor join it with the request bot
- [ ] make it show the gamename in the log when removing it using game-review
- [!] ForceAdd doesn't work using the command for uploaders and Admins (and maybe normal two?) - Removed
- [ ] improve logs

-- Development stopped due to not needing it anymore and already being to a satisfactory state --