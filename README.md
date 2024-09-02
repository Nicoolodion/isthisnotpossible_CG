# Game Status Bot

A Discord bot that checks on if a game can be cracked or not, including checking their crack status, adding new games, and reviewing pending submissions. This bot utilizes Discord.js v14 and provides functionality for role-based access control and interactive command handling.

## Features

- **Check if a game can be cracked**: `/request-blacklist-info <Name of the Game>`
- **Add new games with reasons**: `/new-games-add <Name of the Game> <Reason>`
- **Submit games for review**: `/new-games <Name of the Game> <Reason>`
- **Review pending games**: `/review-games`

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

- **//request-blacklist-info <Name of the Game>**: Checks if the specified game can be cracked and provides details. Supports partial matches and lists up to 3 results.
- **/new-games-add <Name of the Game> <Reason>**: Adds a new game with a reason. Accessible by users with `@uploader` or `@admin` roles.
- **/new-games <Name of the Game> <Reason>**: Submits a new game for review. Accessible by users with the `@team` role.
- **/review-games**: Lists pending games and provides options to approve or remove them. Requires `@admin` or `@uploader` role for access.

## Running the Bot

After you edit Code you'll need to , first compile it to javascript:

```bash
npm run build
```

afterwards start it:

```bash
npm start
```

## Contribution

1. **Fork the Repository**: Click the "Fork" button on GitHub to create your copy of the repository.
2. **Clone Your Fork**:

   ```bash
   git clone https://github.com/Nicoolodion/isthisnotpossible_CG.git
   cd isthisnotpossible_CG
   ```

3. **Create a Branch**:

   ```bash
   git checkout -b feature-branch
   ```

4. **Make Changes**: Implement your changes or new features.
5. **Commit and Push**:

   ```bash
   git add .
   git commit -m "Add your commit message"
   git push origin feature-branch
   ```

6. **Create a Pull Request**: Go to the original repository and create a pull request from your fork.

## Contact

For any questions or issues, please open an issue on the [GitHub repository](https://github.com/Nicoolodion/isthisnotpossible_CG/issues).

Happy coding!

```

- [x] Upload to GitHub
- [x] Detect Duplicates and still has a force add
- [x] clean up and improve security -- Very Important
- [~] Add a moderation system (like force remove and force admin specific users) - Partly added in a janky way. Only admin privileges possible in a badly coded way
- [ ] simplify the commands?
- [x] fix "undefined" showing up when force adding new-games.add
- [x] Add logs
- [x] Make the input not visible if there is none. (embed logging)
- [ ] Automaticlly writes in a Request Thread or maybe even a Ticket when it detects a Gamename that can't be cracked.
- [ ] Make it possible to delete games from the main file.
- [ ] make it show the gamename in the log when removing it using game-review