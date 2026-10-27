const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable", url: "http://localhost:8080/?user=test_qa_guest" });

const { window } = dom;
global.window = window;
global.document = window.document;
global.localStorage = window.localStorage;
global.navigator = window.navigator;
global.location = window.location;

const plannerCatalogCode = fs.readFileSync('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/planner_catalog.js', 'utf8');
const appJsCode = fs.readFileSync('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/app.js', 'utf8');

try {
    window.eval(plannerCatalogCode);
    window.eval(appJsCode);
    console.log("Evaluation successful!");
    
    console.log("Testing openCourseDetails('03940800')...");
    window.openCourseDetails('03940800');
    console.log("Modal class list after 03940800:", window.document.getElementById('course-modal').className);
    
    console.log("Testing openCourseDetails('03940808')...");
    window.openCourseDetails('03940808');
    console.log("Modal class list after 03940808:", window.document.getElementById('course-modal').className);
} catch (err) {
    console.error("ERROR CAUGHT:", err);
}
