const url = 'https://www.mfa.gov.rs/lat/gradjani/putovanje-u-inostranstvo/covid-19-uslovi-za-putovanje';

const fetch = require('node-fetch');
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const nunjucks = require('nunjucks');
const express = require('express');

const { JSDOM } = require('jsdom');

main();

async function main () {
    const c = require('./countries.json');
    const countries = c.map(x => x.country);
    
    const html = await fetch(url).then(res => res.text());
    const dom = new JSDOM(html);
    
    const countriesInPage =
        Array.from(dom.window.document.querySelectorAll('.field--text > p > strong'))
            .map(x => x.textContent);
    console.log(countriesInPage);
    const mainContent = dom.window.document.querySelector('.field--text');
    const mainNodes = Array.from(mainContent.children);

    const json = mainNodes.map((x,i) => ({
        title: x.textContent.split('\n')[0],
        info: x.textContent.split('\n')[1]
    }));
    const countriesJson = json.reduce((acc, curr, i) => {
        const name = normalize(curr.title)
        const azer = normalize('AZERBEJDžAN');
        if (acc.length === 0 && name !== azer) {
            return acc;
        } else if (name == null || name == '' || name.split(' ').length > 5) {
            const n = acc.length;
            const updatedLastElement = {
                title: acc[n - 1].title,
                info: acc[n - 1].info + curr.title + curr.info 
            };
            return acc.slice(0, n - 1).concat(updatedLastElement);
        } else {
            return acc.concat(curr);
        }
    }, []);
    // const a = countriesJson.filter(x =>
    //     !countries.map(c => normalize(c)).includes(normalize(x.title)));

    // console.log(a);
    renderPage({
        template: "./index.njk",
        model: {
            countries: countriesJson.map(x => ({
                ...x
            }))
        },
        output: "./output.html"
    });
    runLocalServer();
}

function normalize(txt) {
    return txt.trim()
        .toLowerCase()
        .replace(/’/, "'");
}

function renderPage (pageData) {
	const rendered = nunjucks.render(
	  pageData.template,
	  pageData.model
	);
  fs.writeFileSync(pageData.output, rendered);
};
function runLocalServer() {
    const express = require('express')
    const app = express()
    const port = 3000
  
    app.use(express.static('.'))
  
    app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`)
    });
  };