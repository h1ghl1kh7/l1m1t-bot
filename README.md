<h1 align="center">
  <br>
  <a href="https://github.com/h1ghl1kh7"><img src="https://h1ghl1kh7.github.io/assets/images/profile.png" height="200" alt="l1m1t-bot"></a>
  <br>
  L1m1t-bot
  <br>
</h1>

l1m1t-bot is a Discord bot that streamlines your CTF participation.

# Features

## CTF Management

All things managed in the database, So you can use the bot without any additional settings.  
CTF events and other information are stored in the database referenced by the channel ID.

There's no need to worry about deleting channels and threads.  
The bot automatically deletes the channels and threads when the CTF event is deleted.

## Scheduler

The bot automatically sends a message to the announcement channel.  
The scheduler operates at the following times

- 1 hour before the start of the CTF event
- the start of the CTF event
- 1 hour before the end of the CTF event
- 10 minutes before the end of the CTF event
- the end of the CTF event

## Challenge Management

This bot use the flag to check the challenge is solved.  
So, you can get all flags of the challenges at once.  
Also, you can get the number of challenges solved and unsolved.

# Commands

## CTF

`/addctf <event name> <start date> <end date>`  
Register a CTF event.
Automatically creates a channel for the event.
Send useful information to announcement channel.
Date follows the format `YY/MM/DD:HH`

`/delctf <event name>`  
Delete the CTF event.
Automatically delete subordinate channels and threads.

`/ctfs`  
List all CTF events.
Show the start and end dates of the event.
And show challenge information that count of challenges unsolved and solved.

## Challenge

`/addchall <category> <name>`  
Add a challenge to the category.  
This command is only available in the CTF event channel.

`/delchal`  
Delete the challenge.  
This command is only available in the challenge thread.

`/solved <flag>`  
Mark the challenge as solved.  
This command is only available in the challenge thread.

`/chals`  
List all challenges in the category.  
Show the name of the challenges and solving state.  
If this command is executed in the category channels, it will show the information of the challenges within the category.  
If this command is executed in the other channels, it will show the information of the all challenges.

# Project Layout

## Source Code Layout

```plaintext
├── app.ts
├── command                Command Registry
│   ├── challenge.ts
│   ├── ctf.ts
│   ├── healthcheck.ts
│   └── index.ts
├── db                     Database Management
│   ├── database.sqlite
│   ├── database.ts
│   └── index.ts
├── type                   Type definition
│   ├── channel.ts
│   ├── command.ts
│   ├── database.ts
│   └── index.ts
└── util                   Utility functions
    ├── channel.ts
    ├── index.ts
    ├── notify.ts
    ├── thread.ts
    ├── time.ts
    └── tool.ts

```

## Database Layout

```plaintext
Server
├── id (TEXT, PRIMARY KEY)
└── name (TEXT)

CTF
├── id (TEXT, PRIMARY KEY)
├── announcementId (TEXT)
├── name (TEXT)
├── start (TEXT)
├── end (TEXT)
└── serverId (TEXT, FOREIGN KEY -> Server.id)

Category
├── id (TEXT, PRIMARY KEY)
├── name (TEXT)
├── ctfId (TEXT, FOREIGN KEY -> CTF.id)
└── serverId (TEXT, FOREIGN KEY -> Server.id)

Challenge
├── id (TEXT, PRIMARY KEY)
├── name (TEXT)
├── flag (TEXT)
├── categoryId (TEXT, FOREIGN KEY -> Category.id)
├── ctfId (TEXT, FOREIGN KEY -> CTF.id)
├── serverId (TEXT, FOREIGN KEY -> Server.id)
└── solved (INTEGER, DEFAULT 0)

Indexes:
├── idx_category_ctfId on Category(ctfId)
├── idx_challenge_categoryId on Challenge(categoryId)
├── idx_challenge_ctfId on Challenge(ctfId)
├── idx_ctf_serverId on CTF(serverId)
├── idx_category_serverId on Category(serverId)
└── idx_challenge_serverId on Challenge(serverId)
```
