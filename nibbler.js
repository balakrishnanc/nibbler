#!/usr/bin/env node
// -*- coding: utf-8; fill-column: 80; -*-
// nibbler.js
// Created by Balakrishnan Chandrasekaran on 2017-11-29 09:49 +0100.
// Copyright (c) 2017 Balakrishnan Chandrasekaran <balakrishnan.c@gmail.com>.
//
// Based on Mike Bostock's gist [1].
// [1] "The Gist to Clone All Gists", Mike Bostock,
//     https://gist.github.com/mbostock/3883098
//
"use strict";

import chalk from 'chalk';
import cp from 'child_process';
import fs from 'fs';
import https from 'https';
import path from 'path';

const NONE = null;
const UNDEF = undefined;


function makeReqParams(username, apiToken) {
    const user = encodeURIComponent(username);
    return function(page) {
        return {
            next: function () {
                return {
                    hostname: "api.github.com",
                    port: 443,
                    path: "/users/" + user  + "/gists?page=" + page++,
                    method: "GET",
                    headers: {
                        "Accept": "application/vnd.github.v3+json",
                        "Authorization": "token " + apiToken,
                        "User-Agent": "node" + process.version
                    }
                };
            }
        };
    };
}


function queryGists(params, callback) {
    var req = https.request(params, function (res) {
        var chunks = [];
        res.setEncoding("utf-8");
        res.on("data", function(chunk) {chunks.push(chunk); });
        res.on("end", function() {
            callback(NONE, JSON.parse(chunks.join(""))); });
    });
    req.on("error", callback);
    req.end();
    return UNDEF;
}

function gistName(file) {
    return path.parse(file).name;
}


function pickGistName(gFiles) {
    // Use the name of the first file in the gist as the directory name.
    gFiles.sort();
    return gistName(gFiles[0]);
}


function isDir(path) {
    try {
        return fs.lstatSync(path).isDirectory();
    } catch (err) {
        return false;
    }
}


function localPath(files) {
    if (!files.length) {
        return UNDEF;
    }

    const PATH = gistName(files.pop());
    if (isDir(PATH)) {
        return PATH;
    }
    return localPath(files);
}


function pullGist(gName, alias, callback) {
    const CWD = process.cwd();
    process.chdir(gName);

    const CMD = "git pull --rebase";
    // console.log("##> updating using `" + CMD + "` ...");
    cp.exec(CMD, function (error, stdout, stderr) {
        process.chdir(CWD);
        if (error) callback(error);
        callback(NONE);
    });
    return UNDEF;
}


function cloneGist(gID, gName, alias, callback) {
    const CMD = "git clone " + alias + ":" + gID + ".git " + gName;
    // console.log("##> cloning using `" + CMD + "` ...");
    cp.exec(CMD,
         function (error, stdout, stderr) {
             if (error) callback(error);
             callback(NONE);
         });
    return UNDEF;
}

const warn = chalk.hex('#FFA500');
const info = chalk.green;
const popout = chalk.blue.bold;
const subtle = chalk.gray;


function cloneGists(gists, alias, callback) {
    if (!gists) return callback(NONE);

    const gist = gists.pop();
    if (!gist) return callback(NONE);

    const contn = function(error) {
        if (error) return callback(error);
        return cloneGists(gists, alias, callback);
    };

    const gID      = gist.id;
    const shortID  = gID.slice(0, 8);
    const gFiles   = Object.keys(gist.files);
    const gName    = pickGistName(gFiles);
    const gistPath = localPath(Array.from(gFiles));

    // Strings in color.
    const cgName   = popout(gName);
    const cshortID = subtle(shortID);

    if (gistPath) {
        console.log(warn("-> updating ") +
                    cgName + "<" + cshortID + ">");
        return pullGist(gistPath, alias, contn);
    } else {
        console.log(info("-> cloning ") +
                    cgName + "<" + cshortID + ">");
        return cloneGist(gID, gName, alias, contn);
    }
}


function fetchPageOfGists(params, alias, callback) {
    return queryGists(params.next(), function(error, gists) {
        if (error) return callback(error);

        if (typeof gists.length == 'undefined') {
            var msg;
            if (typeof gists.message != 'undefined') {
                msg = gists.message;
            } else {
                msg = 'Failed to retrieve gists!';
            }
            return callback(msg);
        }

        var next;
        if (typeof gists.length != 'undefined' && gists.length) {
            next = params;
        } else {
            next = NONE;
        }

        return cloneGists(gists, alias, function(error) {
            if (error) return callback(error, NONE);
            return callback(NONE, next);
        });
    });
}


function showUsage() {
    console.log("Usage: " + process.argv[1] +
                " <user> <token> <output-path> [<alias>]");
}


// Expected number of arguments.
const MIN_ARGS = 5;
const MAX_ARGS = 6;

var numArgs = process.argv.length;
if (( numArgs < MIN_ARGS) || (numArgs > MAX_ARGS)) {
    showUsage();
    process.exit(1);
}

var _alias;
if (numArgs == MAX_ARGS) {
    _alias = process.argv[--numArgs];
} else {
    _alias = "git@gist.github.com";
}
const alias  = _alias;
const outdir = process.argv[--numArgs];
const token  = process.argv[--numArgs];
const user   = process.argv[--numArgs];

if (!isDir(outdir)) {
    console.log("Error: output path is invalid!");
    process.exit(2);
}

process.chdir(outdir);
fetchPageOfGists(makeReqParams(user, token)(1), alias,
                 function callback(error, next) {
                     if (error) throw error;
                     if (next) fetchPageOfGists(next, alias, callback);
                 });
