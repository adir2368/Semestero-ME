import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: console_messages.append(f"[PAGE_ERROR] {err}"))

        print("Navigating to http://localhost:8080/?user=adir ...")
        await page.goto("http://localhost:8080/?user=adir", wait_until="networkidle")
        await page.wait_for_timeout(3000)

        # Check console logs
        print("\n--- Console Logs ---")
        for log in console_messages[-25:]:
            print(log)

        result = await page.evaluate("""() => {
            const courses = (window.gameState && window.gameState.courses) || {};
            const sem4Courses = Object.values(courses).filter(c => c && Number(c.semester) === 4);
            const sem5Courses = Object.values(courses).filter(c => c && Number(c.semester) === 5);
            
            // Check flowchart svg cards in semester 4 row
            const sem4Cards = [];
            document.querySelectorAll('#flowchart-nodes g').forEach(g => {
                const text = g.textContent || '';
                if (text.includes('03940800') || text.includes('03940808') || text.includes('034030')) {
                    sem4Cards.push(text);
                }
            });

            return {
                user: window.AuthSync ? (window.AuthSync.getActiveUser ? window.AuthSync.getActiveUser().name : 'no user') : 'no auth',
                totalCourses: Object.keys(courses).length,
                sem4: sem4Courses.map(c => ({ code: c.code, altCode: c.altCode, name: c.name, credits: c.credits, status: c.status })),
                sem5: sem5Courses.map(c => ({ code: c.code, altCode: c.altCode, name: c.name, credits: c.credits, status: c.status })),
                sem4Cards: sem4Cards
            };
        }""")

        print("\n--- Result for ?user=adir ---")
        print("Active User:", result["user"])
        print("Total courses:", result["totalCourses"])
        print("Semester 4 courses in gameState:", [c['code'] for c in result["sem4"]])
        print("Semester 5 courses in gameState:", [c['code'] for c in result["sem5"]])
        print("Sem 4 flowchart cards detected:", result["sem4Cards"])

        # Also test clicking on a course and checking if course-modal has 'active' class
        modal_opened = await page.evaluate("""() => {
            if (typeof window.openCourseDetails === 'function') {
                window.openCourseDetails('034030');
                const m = document.getElementById('course-modal');
                return m ? m.classList.contains('active') : false;
            }
            return false;
        }""")
        print("Modal opened on course click:", modal_opened)

        await page.screenshot(path=r"C:\Users\user\.gemini\antigravity\brain\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14\flowchart_adir_state.png", full_page=True)
        print("Saved screenshot to flowchart_adir_state.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
