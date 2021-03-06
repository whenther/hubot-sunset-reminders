'use strict';

// Description
//   Set a sunset alert for a channel.
//
// Commands:
//  hubot remind us about sunset - Set a sunset alert for the channel.
//  hubot remind us about sunset at <address> - Set a sunset alert for the channel at the address.
//  hubot when is sunset - Reply's with today's sunset time at the default address.
//  hubot when is sunset at <address> - Reply's with today's sunset time at the address.
//
// Configuration:
//  HUBOT_SUNSET_DEFAULT_ADDRESS: required
//
// Author:
//  Will Lee-Wagner <will@assetavenue.com>

const DEFAULT_ADDRESS = process.env.HUBOT_SUNSET_DEFAULT_ADDRESS || '1100 Glendon Ave, Los Angeles, CA 90024';

const SunsetBrain = require('../lib/SunsetBrain');
const SunsetPlace = require('../lib/SunsetPlace');
const SunsetTime = require('../lib/SunsetTime');
const sunsetMessages = require('../lib/sunsetMessages');

module.exports = (robot) => {
  // Initialize the SunsetBrain for data access.
  const sunsetBrain = new SunsetBrain(robot);

  robot.respond(/when is sunset(?: at (.*))?\??$/i, (res) => {
    const address = res.match[1] || DEFAULT_ADDRESS;
    const sunsetPlace = new SunsetPlace(address);
    let sunsetTime;

    sunsetPlace.promise
    .then((place) => {
      sunsetTime = new SunsetTime(robot, place);
      return sunsetTime.promise;
    })
    .then(() => sunsetTime.getFormattedTime())
    .then((formattedTime) => res.send(sunsetMessages.getOneTimeSunsetMessage(formattedTime)))
    .catch((error) => res.send(error));
  });

  // TODO: handle setting up sunset reminders for 'remind us about sunset'
  //
  robot.respond(/remind us about sunset(?: at (.*))?$/i, (res) => {
    const room = res.message.room;
    const address = res.match[1] || DEFAULT_ADDRESS;

    // Handle an existing room reminder.
    if (sunsetBrain.roomHasReminder(room)) {
      res.send(sunsetMessages.getExistingRoomMessage());
      return;
    }
    sunsetBrain.setRoomReminder(room, address);
    res.send(sunsetMessages.getSunsetReminderSetMessage());
  });

  robot.respond(/stop reminding us about sunset/i, (res) => {
    const room = res.message.room;

    if (!sunsetBrain.roomHasReminder(room)) {
      res.send(sunsetMessages.getSunsetReminderClearFailMessage());
      return;
    }

    sunsetBrain.clearRoomReminder(room);
    res.send(sunsetMessages.getSunsetReminderClearMessage());
  });
};