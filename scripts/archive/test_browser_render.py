import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Create page
        page = await browser.new_page()

        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: console_messages.append(f"[PAGE_ERROR] {err}"))

        print("Navigating to http://localhost:8080/ ...")
        await page.goto("http://localhost:8080/", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # Check console logs
        print("\n--- Console Logs ---")
        for log in console_messages[-25:]:
            print(log)

        # Evaluate what courses exist in gameState.courses and in Semester 4
        result = await page.evaluate("""() => {
            const courses = (window.gameState && window.gameState.courses) || {};
            const sem4Courses = Object.values(courses).filter(c => c && Number(c.semester) === 4);
            const sem5Courses = Object.values(courses).filter(c => c && Number(c.semester) === 5);
            
            // Also inspect flowchart SVG nodes
            const fcNodes = Array.from(document.querySelectorAll('#flowchart-nodes g')).map(g => {
                const sub = g.querySelector('.fc-node-sub');
                const badge = g.querySelector('.fc-node-badge');
                return {
                    text: g.innerText || g.textContent,
                    sub: sub ? sub.textContent : '',
                    badge: badge ? badge.textContent : ''
                };
            });

            return {
                totalCourses: Object.keys(courses).length,
                sem4: sem4Courses.map(c => ({ code: c.code, altCode: c.altCode, name: c.name, credits: c.credits, status: c.status })),
                sem5: sem5Courses.map(c => ({ code: c.code, altCode: c.altCode, name: c.name, credits: c.credits, status: c.status })),
                fcNodesCount: fcNodes.length,
                fcSample: fcNodes.slice(0, 15)
            };
        }""")

        print("\n--- Evaluation Result ---")
        print("Total courses:", result["totalCourses"])
        print("\nSemester 4 courses in gameState:")
        for c in result["sem4"]:
            print(f"  - {c['code']} ({c['altCode']}) : {c['name']} [{c['credits']} cr, {c['status']}]")

        print("\nSemester 5 courses in gameState:")
        for c in result["sem5"]:
            print(f"  - {c['code']} ({c['altCode']}) : {c['name']} [{c['credits']} cr, {c['status']}]")

        # Take screenshot of flowchart
        await page.screenshot(path=r"C:\Users\user\.gemini\antigravity\brain\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14\flowchart_live_state.png", full_page=True)
        print("\nSaved screenshot to flowchart_live_state.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
