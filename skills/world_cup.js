var request = require('request');
var wordfilter = require('wordfilter');

module.exports = function(controller) {
    
    controller.hears(['next fixtures', 'upcoming fixtures'], 'message_received,direct_message,direct_mention', function(bot, message) {
        getFootballData().then(function(data) {
            getFixtures(bot, message, data.fixtures);
        });
    });

    function getFixtures(bot, message, fixtures) {

        var nextFixtures = fixtures
            .filter(function(fixture) { return fixture.status === "TIMED" })
            .slice(0, 5);

        var reply = '';
        nextFixtures.forEach(function (fixture) {
            var kickoff = getFormattedDate(new Date(fixture.date));
            reply += kickoff + ' - ' + fixture.homeTeamName + ' v ' + fixture.awayTeamName + '\n';
        });
        
        bot.reply(message, reply);
    }

    function getFormattedDate(date) {
        var offset = 10;
        var utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        date = new Date(utc + (3600000*offset));
      
        var dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
        var deadlineDate = date.toLocaleString('en-AU', dateOptions);
        var timeOptions = { hour: 'numeric', minute: 'numeric' };
        var deadlineTime = date.toLocaleString('en-AU', timeOptions).toUpperCase();
        
        return deadlineDate + ' @ ' + deadlineTime;
    };

    function getFootballData () {
        console.log("Making request");

        return new Promise((resolve, reject) => {

            var options = {
                url: 'http://api.football-data.org/v1/competitions/467/fixtures',
                headers: {
                    'X-Auth-Token': process.env.footballApiToken
                }
            };

            request(options, (err, res, body) => {
                
                if (err) {
                    reject(err); return;
                }
                
                console.log("parsing response");
                resolve(JSON.parse(body));
            });
        });
    };
}