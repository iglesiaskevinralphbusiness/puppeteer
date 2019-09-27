const puppeteer = require('puppeteer');
const expect = require('chai').expect;
//const devices = require('puppeteer/DeviceDescriptors');

const config = require('./lib/config');
const helpers = require('./lib/helpers');

describe('Test puppeteer', () => {
    let browser;
    let page;

    before(async function(){
        browser = await puppeteer.launch({
            headless: config.isHeadless,
            slowMo: config.slowMo,
            devtools: config.isDevTools,
            timeout: config.launchTimeout,
        });
        page = await browser.newPage();
        await page.setDefaultTimeout(config.waitingTimeout);
        await page.setViewport({
            width: config.viewportWidth,
            height: config.viewportHeight
        });
    });
    
    after(async function(){
       await browser.close();
    });

    it('Manipulate Page', async () => {
        const liveLink = '#app > div.application--wrap > main > div > div > nav > div > div > div > div > div:nth-child(3) > a';
        
        await page.goto(config.baseUrl);
        await page.waitForSelector(liveLink);
        //await page.click(liveLink);
    })

    it('Get all events', async () => {
        var results = [];
        const events = await page.$$('.match-card-list > section > div .play-count')
        
        for (const event of events) {
            //open event
            await event.hover()
            await event.click()


            //wait event information to load
            const selector = 'section.match-info > section.match-title span:last-child'
            await page.waitForFunction(
                selector => document.querySelector(selector).textContent.length > 0,
                {},
                selector
            );

            //get event information
            const event_details = await page.evaluate(() => {
                const matchInfo = document.querySelector('.match-info')

                //condition if live or not
                let matchLive = matchInfo.querySelector('.match-status-content .live-icon')
                let matchTime = matchInfo.querySelector('.match-status-content .match-time')
                let matchDate = matchInfo.querySelector('.match-status-content .match-date')
                let homeTeamScore = matchInfo.querySelector('.match-status-content .team-score:first-child')
                let awayTeamScore = matchInfo.querySelector('.match-status-content .team-score:last-child')

                if ( matchLive !== null) matchLive = true
                else matchLive = false

                if ( matchTime !== null) matchTime = matchTime.textContent
                else matchTime = ''

                if ( matchDate !== null) matchDate = matchDate.textContent
                else matchDate = ''

                if ( homeTeamScore !== null) homeTeamScore = homeTeamScore.textContent
                else homeTeamScore = ''

                if ( awayTeamScore !== null) awayTeamScore = awayTeamScore.textContent
                else awayTeamScore = ''
                
                //build event information
                return {
                    competition_name: matchInfo.querySelector('.match-title span:last-child').textContent,
                    live: matchLive,
                    game_time: matchTime,
                    game_date: matchDate,
                    game_logo: matchInfo.querySelector('.match-title span:first-child').getAttribute('style').replace('background-image: url("//','').replace('");',''),
                    scoreline: [homeTeamScore, awayTeamScore],
                    team: [
                        {
                            name: matchInfo.querySelector('.match-team.left-team .team-name').textContent,
                            logo: matchInfo.querySelector('.match-team.left-team img').getAttribute('src')
                        },
                        {
                            name: matchInfo.querySelector('.match-team.right-team .team-name').textContent,
                            logo: matchInfo.querySelector('.match-team.right-team img').getAttribute('src')
                        }
                    ]
                }
            });
            //console.log(event_details);


            //get event maps
            const maps = await page.$$('.stage-list')
            let event_markets = [];
            let i = 0;
            for (const map of maps) {
                const map_details = await page.evaluate((i) => {
                    const stage_list = document.querySelectorAll('.stage-list')[i];

                    //get map name
                    let mapName = stage_list.querySelector('.stage-title')
                    if ( mapName !== null) mapName = mapName.textContent.trim()
                    else mapName = 'FINAL'

                    const markets = Array.from(stage_list.querySelectorAll('.group-list > section'));
                    const markets_items = markets.map(market => {

                        //get markets
                        marketName = market.querySelector('div')
                        if ( marketName !== null) marketName = marketName.textContent.trim()
                        else marketName = ''

                        homeOddsTitle = market.querySelector('.odds-name.left-name')
                        homeOddsValue = market.querySelector('.left-contain .bet-odds')
                        homeOddsResult = market.querySelector('.left-contain .result-icon')
                        awayOddsTitle = market.querySelector('.odds-name.right-name')
                        awayOddsValue = market.querySelector('.right-contain .bet-odds')
                        homeOddsResult = market.querySelector('.right-contain .result-icon')

                        if ( homeOddsTitle !== null) homeOddsTitle = homeOddsTitle.textContent.trim()
                        else homeOddsTitle = ''

                        if ( homeOddsValue !== null) homeOddsValue = homeOddsValue.textContent.trim()
                        else if (homeOddsResult !== null && homeOddsResult.classList.contains('match-win')) homeOddsValue = 'Win'
                        else if (homeOddsResult !== null && homeOddsResult.classList.contains('match-lose')) homeOddsValue = 'Lose'
                        else homeOddsValue = 'Locked'

                        if ( awayOddsTitle !== null) awayOddsTitle = awayOddsTitle.textContent.trim()
                        else awayOddsTitle = ''
                        
                        if ( awayOddsValue !== null) awayOddsValue = awayOddsValue.textContent.trim()
                        else if (awayOddsValue !== null && awayOddsValue.classList.contains('match-win')) awayOddsValue = 'Win'
                        else if (awayOddsValue !== null && awayOddsValue.classList.contains('match-lose')) awayOddsValue = 'Lose'
                        else awayOddsValue = 'Locked'

                        return {
                            market_name: marketName,
                            home: [ homeOddsTitle, homeOddsValue ],
                            away: [ awayOddsTitle, awayOddsValue ],
                        }
                    });

                    return {
                        map: mapName,
                        martkets: markets_items
                    }
                },i)
                i++
                event_markets.push(map_details)
            }

            //console.log(JSON.stringify(event_markets))
        

            //build event object
            results.push({
                event_details: event_details,
                event_markets: event_markets
            });
            

            //close event
            await page.evaluate(() => {
                document.querySelector('section.match-info > div.close-icon').click();
            });
        }

        console.log(JSON.stringify(results))
        //console.log(results);
    })

});