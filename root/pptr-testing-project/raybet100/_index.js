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
        await page.waitForSelector('.match-card-list > section > div:first-child')
        let events_list = await page.evaluate(() => {
            let lists = Array.from(document.querySelectorAll('.match-card-list > section > div'))
             return lists.map(list => {
                return {
                    competition_name: list.querySelector('.tournament-name').textContent,
                    game_icon: list.querySelector('.game-icon').getAttribute('src'),
                    time: list.querySelector('.match-status').textContent,
                    teams: [list.querySelector('.left-name').textContent, list.querySelector('.right-name').textContent]
                }
            });
        })
       
        console.log(events_list)
    }) 

});