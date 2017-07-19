'use strict';
var inquirer = require('inquirer');
var request = require('request');
var term = require('terminal-kit').terminal;
const devRant = require('devrant');
var requestState = false;
var rants, rantIndex, pageNo;

function showSettings() {

}

function showProfile() {

}

function showAbout() {

}

function logout() {

}

function displayRantsPager() {
    term.clear();
    let rant = rants[rantIndex];
    let divider = new Array(term.width - 1).fill('-').join('');

    let rantHeader = `
Showing Rant ${rantIndex+1} / ${rants.length}
${divider}
`;
    let rantBody = `

${ rant.text }

${divider}`;

    function showRantBody() {
        console.log("\n");
        term.bold.underline.green(rant.user_username + ' ').bgBlue().brightWhite('[' + rant.score + ']').bgDefaultColor();
        console.log(rantBody);

        if (rant.attached_image !== "") {
            showImgAsync(
                rant.attached_image.url, {
                    shrink: {
                        width: 100,
                        height: 100
                    }
                }).then(() => {
                let comments = rant.comments || false;
                if (comments) {
                    renderComments();
                }
                showRantMenu();
            });
        } else {
            let comments = rant.comments || false;
            if (comments) {
                renderComments();
            }
            showRantMenu();
        }
    }

    console.log(rantHeader);
    if (rant.user_avatar.i !== "" && rant.user_avatar.i !== undefined) {
        showImgAsync(
            'https://avatars.devrant.io/' + rant.user_avatar.i, {
                shrink: {
                    width: 10,
                    height: 10
                }
            }).then(showRantBody);

    } else {
        showRantBody();
    }
}

function renderComments() {
    let rant = rants[rantIndex];
    let comments = rant.comments || false;
    let divider = new Array(term.width - 1).fill('=').join('');
    console.log(
        "\n",
        divider,
        'Comments',
        "\n",
        divider
    );
    comments.map(function(comment) {
        let divider = new Array(term.width - 1).fill('-').join('');
        term.bold.underline.green(comment.user_username + ' ').bgBlue().brightWhite('[' + comment.score + ']').bgDefaultColor();
        console.log(
            "\n",
            comment.body,
            "\n",
            divider
        );
    });
    rants[rantIndex].comments_shown = true;
}

function showRantComments() {
    var rant_id = rants[rantIndex].id;
    devRant
        .rant(rant_id)
        .then(function receiveRant(rantRes) {
            rants[rantIndex] = rantRes.rant;
            rants[rantIndex].comments = rantRes.comments;
            displayRantsPager();
        })
        .catch(function errorHandler(err) {
            console.log(JSON.stringify('err: ' + err.message, null, '  '));
            close();
        });
}

function showRantMenu() {
    var items = [];
    let rant = rants[rantIndex];
    if (!rant.comments_shown) {
        items.push('Show Comments');
    }
    items.push('Next Rant');
    items.push('Prev Rant');
    items.push('Menu', 'Exit');
    var options = {
        style: term.inverse,
        selectedStyle: term.dim.blue.bgGreen
    };

    term.singleLineMenu(items, options, function(error, response) {
        switch (response.selectedText) {
            case 'Next Rant':
                if (rantIndex === rants.length - 1) {
                    pageNo++;
                    showRantFeed(pageNo);
                } else {
                    rantIndex++;
                    displayRantsPager();
                }
                break;
            case 'Prev Rant':
                if (rantIndex === 0) {
                    pageNo--;
                    showRantFeed(pageNo, rants.length - 1);
                } else {
                    rantIndex--;
                    displayRantsPager();
                }
                break;
            case 'Exit':
                close();
                break;
            case 'Menu':
                showMenu();
                break;
            case 'Show Comments':
                showRantComments();
                break;
            default:
                showRantMenu();
        }
    });
}


function showRantFeed(pageNo, rantInd, sort, limit) {
    rantInd = rantInd | 0;
    pageNo = pageNo || 0;
    let options = {};
    options.sort = sort || 'algo';
    options.limit = limit || 10;
    options.skip = limit * pageNo;

    devRant.rants(options)
        .then(function receiveRants(rants) {
            updateRantIndex(rants, rantInd);
            displayRantsPager();
        })
        .catch(function errorHandler(err) {
            console.log('err: ', err.message);
        });
}

function updateRantIndex(rantArray, index) {
    rants = rantArray;
    rantIndex = index;
}

function close() {
    console.log("\nBye bye! Thanks for trying devRantCLI\n</rant>\n");
    process.exit();
}

function showMenu() {
    term.clear();
    term.windowTitle('devRantCLI');
    let appName = ' Welcome to devRantCLI! :/';
    let hr = new Array(appName.length).fill('=').join('');
    console.log(hr + '==');
    term.bold(appName);
    console.log("\n", hr, "\n");

    inquirer.prompt([{
        type: 'list',
        name: 'location',
        message: 'Main Menu' + "\n",
        choices: [
            new inquirer.Separator(),
            {
                name: 'Rant Feed',
                value: showRantFeed
            },
            {
                name: 'Settings',
                value: showSettings
            },
            {
                name: 'About devRantCLI',
                value: showAbout
            },
            {
                name: 'Exit',
                value: close
            },
            new inquirer.Separator(),
        ]
    }]).then(function(response) {
        response.location();
    });
}

function showImgAsync(image, opts) {
    return new Promise(function(resolve, reject) {
        opts = opts || {};
        let options = {
            shrink: {
                width: term.width,
                height: term.height * 2
            }
        };
        Object.getOwnPropertyNames(opts).forEach(prop => options[prop] = opts[prop]);

        term.drawImage(image, options, function(error) {
            if (error) return reject(error);
            resolve(true);
        });
    });
}

//Start the app
showMenu();
