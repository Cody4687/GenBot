const mineflayer = require('mineflayer');
const navigatePlugin = require('mineflayer-navigate')(mineflayer);
const vec3 = require('vec3')
var colors = require('colors');
var config = require("./config.json")
var prefix = config.prefix
var express = require('express');
const opn = require('opn');
var fs = require('fs');
const Discord = require("discord.js");
/* 
0b0t Chat Colors (ignore)
! yellow, # pink, > green, < red, , orange, ; dark blue, : light blue, [ gray, ] black
*/
function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

var options = {
    host: "0b0t.org",
    port: 25565,
    username: config.email,
    version: "1.12.2",
    verbose: "true",
    password: config.password
};

setTimeout(() => {
    opn('http://localhost:3000')
}, 5000);

var bot = mineflayer.createBot(options);
bindEvents(bot);

function bindEvents(bot) {

    navigatePlugin(bot);
    bot.chatAddPattern(/^([a-zA-Z0-9_]{3,16}) wants to teleport to you\.$/, "tpRequest", "tpa request");

    const discord = new Discord.Client({
        disableEveryone: true
    });
    discord.commands = new Discord.Collection();
    discord.on("ready", () => {
        console.log('Bridge online!');
    });
    discord.on("message", message => {
        if (message.author.id === config.botId) return;
        if (message.channel.id != config.channelId) return;
        console.log(`[${message.author.tag}] ${message}`)
        bot.chat(`[${message.author.tag}] ${message}`)
    })
    bot.on('chat', (username, message) => {
        if (message.includes('@everyone')) return;
        if (message.includes('@here')) return;
        discord.channels.cache.get(config.channelId).send(`<${username}> ${message}`)
    })
    discord.login(config.token)

    var app = express();
    var server = require('http').createServer(app);
    var io = require('socket.io')(server);

    app.use(express.static(__dirname + '/views'));
    app.get('/', function (req, res, next) {
        res.sendFile(__dirname + '/views/index.html');
    });

    io.on('connection', function (client) {

        client.on('chat', function (data) {
            io.sockets.emit('chat', data);
            bot.chat(data.message)
        });

        client.on('activateKill', function () {
            console.log('Bot has been killed.'.red)
            bot.chat('/kill')
        })

        client.on('chatt', (data) => {
            let msg = JSON.stringify(data.data)
            console.log(`You said, ${msg.slice(1,-1)}.`.grey)
            bot.chat(msg.slice(1, -1))
        })

        client.on('up', function () {
            bot.navigate.to(bot.entity.position.offset(1, 0, 0))
        })
        client.on('down', function () {
            bot.navigate.to(bot.entity.position.offset(-1, 0, 0))
        })
        client.on('left', function () {
            bot.navigate.to(bot.entity.position.offset(0, 0, -1))
        })
        client.on('right', function () {
            bot.navigate.to(bot.entity.position.offset(0, 0, 1))
        })
        client.on('add', (x) => {
            let msg = JSON.stringify(x.name)
            let arra = requireUncached('./allowed.json')
            if (arra.allowed.includes(msg.slice(1, -1))) {
                return console.log('Already on list.')
            } else {
                console.log("Added " + msg.slice(1, -1) + " to list.")
                fs.writeFileSync(`./allowed.json`, `{"allowed":${JSON.stringify(arra.allowed).slice(0,-1)},${msg}]}`)
            }


        })

        client.on('remove', (x) => {
            let msg = JSON.stringify(x.name)
            let array = requireUncached('./allowed.json')
            if (!array.allowed.includes(msg.slice(1, -1))) {
                return console.log('Not on the list.')
            } else {
                var index = array.allowed.indexOf(msg.slice(1, -1));
                if (index > -1) {
                    let arr = array.allowed.splice(index, 1);
                    fs.writeFileSync(`./allowed.json`, JSON.stringify(array))
                    console.log("Removed " + msg.slice(1, -1) + " from list.")

                }
            }
        })

    })
    server.listen(3000, function () {
        console.log('listening on *:3000');
    });


    function RussianRoulette() {
        let math = Math.floor(Math.random() * 7)
        if (math < 1) {
            return ('< You died!')
        } else {
            return ('> You lived!')
        }

    }

    let responses = ['# Yes.', '# No.', '# Not Likely.', '# Very Likely.', '# Unsure.', '# It is certain.']

    function Ball() {
        let math = Math.floor(Math.random() * responses.length)
        return (responses[math])
    }

    function chat(b, c, a) {
        bot.chat(b)
        console.log(c)
        discord.channels.cache.get(config.logChannelId).send(a)

    }

    function isAllowed(username) {
        array = requireUncached('./allowed.json').allowed
        if (array.includes(username)) {
            chat(`> Accepted tpa for ${username}.`, `Accepted tpa for ${username}.`.green, `Accepted tpa for ${username}`)
            return (username)
        } else return chat(`< ${username} is not on the list!`, `${username} attempted to tpa.`.red, `${username} attempted to tpa.`)
    }

    bot.on('tpRequest', function (username) {
        return bot.chat(`/tpy ${isAllowed(username)}`)
    });

    bot.on('login', function () {
        console.log(`Minecraft Bot Online!`.rainbow)
    });

    var JFile = require('jfile');
    var loadArray = new JFile("./spam.txt");

    bot.on("ready", () => {
        console.log('bot is online!');
    });

    var phrases = loadArray.lines
    var spammer =
        setTimeout(function () {
            spammer = setInterval(spam, config.spamDelay)
        }, 30000)

    function spam() {
        var phrase = phrases[Math.floor(Math.random() * phrases.length)]
        chat(`[Ad] ${phrase}`, `[Ad] ${phrase}`, `[Ad] ${phrase}`)

    }

    function stopSpam() {
        clearInterval(spammer);
    }

    bot.on('error', function (err) {
        console.log('Error attempting to reconnect: ' + err.errno + '.');
        if (err.code == undefined) {
            console.log('Invalid credentials OR bot needs to wait because it relogged too quickly.');
            console.log('Will retry to connect in 30 seconds. ');
            setTimeout(relog, 30000);
        }
    });


    bot.on('end', function () {
        console.log("Bot has ended");
        server.close();
        discord.destroy()
        stopSpam()
        setTimeout(relog, 30000);
    });


    function relog() {
        console.log("Attempting to reconnect...");
        bot = mineflayer.createBot(options);
        bindEvents(bot);
    }
    bot.on('chat', (username, message) => {
        let msg = message
        let user = username
        if (user != bot.username) {
            return io.emit('chat', {
                message: msg,
                usr: user
            });
        }


    })

    bot.on('chat', (username, message) => {
        const args = message.split(' ')
        const cmd = message.split(' ')[0]



        if (cmd === `${prefix}accept`) {
            bot.chat(`/tpy ${isAllowed(username)}`)
        }

        if (cmd === `${prefix}a`) {
            bot.chat(`/tpy ${isAllowed(username)}`)
        }

        if (cmd === `${prefix}help`) {
            chat(`/w ${username} tiny.cc/CCorpHelp`, `${username} used ${prefix}help.`.magenta, `${username} used ${prefix}help.`)
        }

        if (cmd === `!endtest`) {
            bot.end()
        }

        if (cmd === `${prefix}russianroulette`) {
            chat(`${RussianRoulette()}`, `${username} used ${prefix}russianroulette.`.yellow, `${username} used ${prefix}russianroulette.`)
        }

        if (cmd === `${prefix}8ball`) {
            chat(`${Ball()}`, `${username} used ${prefix}8ball.`.yellow, `${username} used ${prefix}8ball.`)
        }

        if (cmd === `${prefix}tpa`) {
            bot.chat(`/tpa ${config.botOwner}`)
        }

        if (cmd === `${prefix}test`) {
            console.log(bot.players)
        }

        if (cmd === `${prefix}uuid`) {
            chat(`, Your uuid is ${bot.players[username].uuid}!`, `${username} used ${prefix}uuid.`.yellow, `${username} used ${prefix}uuid.`)
        }

        if (cmd === `${prefix}ping`) {
            chat(`, Your ping is ${bot.players[username].ping}!`, `${username} used ${prefix}ping.`.yellow, `${username} used ${prefix}ping.`)
        }

        if (cmd === `${prefix}coinflip`) {
            function coinflip() {
                let math = Math.random()
                if (math < 0.5) {
                    return ('Heads!')
                }
                if (math > 0.5) {
                    return ('Tails!')
                }
            }
            return (chat(`, ${coinflip()}`, `${username} used ${prefix}coinflip.`.yellow, `${username} used ${prefix}coinflip.`))
        }


    })
}